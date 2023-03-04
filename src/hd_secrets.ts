import { BigNumber } from '@ethersproject/bignumber';
import { mnemonicToSeed, isValidMnemonic } from '@ethersproject/hdnode';
import { P, hashMod } from './common';
import { poseidon } from './poseidon';

/*
This comment is a reference definition of the hierarchical deterministic secret generation. The implementation is in
the class HierarchicalDeterministicSecretGenerator, which is defined at the bottom of this file.

  We use poseidonT3 and poseidonT5 in this scheme. Those are the only two input lengths for which we reference values.
  => seed is 64 bytes
  => poseidon output is ~(numOutputs * 32) bytes (it's 3 FieldElements, which are roughly 254 bits each)
  => p is the prime number 21888242871839275222246405745257275088548364400416034343698204186575808495617

  We use the ethers.js library to generate the seed from the mnemonic and password.

  seedHex = mnemonicToSeed(mnemonic, password)
  seed = [
    seedHex[0:32] % p,
    seedHex[32:64] % p
  ]

  HDNode_{0} = poseidon(
    inputs=[
      seed[0],
      seed[1]
    ],
    numOutputs=3
  )

  HDNode_{N} = poseidon(
    inputs=[
      extendedSeed_{N-1}[0],
      extendedSeed_{N-1}[1]
    ],
    numOutputs=3
  )

  secret_{N} = poseidon(
    inputs=[
      extendedSeed_{N}[0],
      extendedSeed_{N}[2]
    ],
    numOutputs=1
  )

  commitment_{N} = poseidon(
    inputs=[
      0,
      secret_{N}
    ],
    numOutputs=1
  )

  In this scheme, we define the nullifier of a specific deposit as the hash of the secret value and its position in the
  list of commitments as follows:

  First, define a value `contractCode`. In Solidity, this can be defined as:

  bytes32 contractCode = keccak256(abi.encodePacked(address(this), chaindId)) % p

  Then, the nullifier of the i-th deposit is:
  nullifier_{N}_{i} = poseidon(
    inputs=[0, secret_{N}, i, contractCode],
    numOutputs=1
  )

  This scheme makes the commitment reusable everywhere without leaking any information about the deposit. It can be
  repeatedly used in the same contract, in different contracts, and on different chains, without the nullifiers of
  commitments in any instance of privacy pools contracts on any chain colliding with the nullifiers of each other. This
  value MUST be unique to the contract and chain, and SHOULD be an immutable variable instantiated in the privacy pool
  contract's contstructor. This value will makes it way into the input of the SNARK withdrawal circuit.
*/

/*
  The main seed is generated using pbkdf2, which uses HMAC-SHA512. We split the output into two 32-byte chunks, to be
  used as the inputs to the Poseidon hash function, deriving the first parent node. Child nodes are derived from the
  seed of the corresponding parent node.
*/
type Seed = [presecret: BigNumber, chainCode: BigNumber];

/*
  The extended seed is the output of the Poseidon hash function, which is used to derive the secret and the next parent.
*/
type ExtendedSeed = [
    presecret: BigNumber,
    chainCode: BigNumber,
    randomness: BigNumber
];

/*
  A Key Pair is a 2-tuple of (secret, commitment). Commitments are public values generated from the secret. Commitments
  are used in proof of membership during withdrawal. The secret is a private input to the SNARK circuit, and is used
  to generate the nullifier.
*/
type KeyPair = [secret: BigNumber, commitment: BigNumber];

/*
  HDNodes are used to derive the secret as well as derive the next parent node.
*/
type HDNode = {
    extendedSeed: [
        presecret: Seed[0],
        chainCode: Seed[1],
        randomness: BigNumber
    ];
    keyPair: KeyPair;
};

/*
  HDSecretGenerator is a class that implements the hierarchical deterministic secret generation.
  It is used to generate a list of commitments, which are similar to a list of public addresses in a wallet. The
  HDSecretGenerator is initialized with a mnemonic, a password, and number of commitments to
  generate initially. The mnemonic and password are used to generate the seed. The seed is then used to generate the
  first parent node, which is used to generate the first child node, which is used to generate the first commitment. The
  process is repeated to generate a list of extended secrets and corresponding commitments.
*/
export class HDSecretGenerator {
    private _mainSeed: Seed;
    private _nodes: HDNode[];

    public maxKeys: number = 1024; // arbitrary

    constructor({
        mnemonic,
        password = '',
        numKeys = 10
    }: {
        mnemonic: string;
        password?: string;
        numKeys?: number;
    }) {
        if (!isValidMnemonic(mnemonic)) {
            throw new Error('Invalid mnemonic');
        }
        var seedHex = mnemonicToSeed(mnemonic, password);
        this._mainSeed = [
            BigNumber.from(seedHex.slice(0, 66)).mod(P),
            BigNumber.from('0x' + seedHex.slice(66, 130)).mod(P)
        ];
        this._nodes = [];

        while (this._nodes.length < numKeys) {
            this._nextKey();
        }
    }

    get mainSeed(): Seed {
        return this._mainSeed;
    }

    get nodes(): HDNode[] {
        return this._nodes;
    }

    get keyRing(): KeyPair[] {
        return this._nodes.map((node) => node.keyPair);
    }

    get commitments(): BigNumber[] {
        return this._nodes.map((node) => node.keyPair[1]);
    }

    get secrets(): BigNumber[] {
        return this._nodes.map((node) => node.keyPair[0]);
    }

    get latestNode(): HDNode {
        if (this._nodes.length === 0) {
            throw new Error('No nodes generated yet');
        }
        return this._nodes[this._nodes.length - 1];
    }

    get latestKeys(): KeyPair {
        if (this._nodes.length === 0) {
            throw new Error('No nodes generated yet');
        }
        return this._nodes[this._nodes.length - 1].keyPair;
    }

    private _nextKey(): HDNode {
        const parent =
            this._nodes.length === 0
                ? {
                      extendedSeed: this._mainSeed,
                      keyPair: [BigNumber.from(0), BigNumber.from(0)]
                  }
                : this._nodes[this._nodes.length - 1];

        const extendedSeed = poseidon(
            parent.extendedSeed.slice(0, 2),
            3
        ) as ExtendedSeed;
        const secret = poseidon([extendedSeed[0], extendedSeed[2]], 1);
        const commitment = poseidon([BigNumber.from(0), secret], 1);
        const keyPair: KeyPair = [secret, commitment];
        const node: HDNode = {
            extendedSeed,
            keyPair
        };
        this._nodes.push(node);
        return node;
    }

    public keysAt(index: number): KeyPair {
        while (this._nodes.length <= index) {
            this._nextKey();
        }
        return this._nodes[index].keyPair;
    }

    public nullifierAt(index: number, contractCode: BigNumber): BigNumber {
        const [secret] = this.keysAt(index);
        return poseidon([0, secret, index, contractCode], 1);
    }

    public nullifiersAt(
        index: number,
        numNullifiers: number,
        contractCode: BigNumber
    ): BigNumber[] {
        const nullifiers = [];
        for (let i = index; i < index + numNullifiers; i++) {
            nullifiers.push(this.nullifierAt(i, contractCode));
        }
        return nullifiers;
    }

    public keysAtRange(start: number, end: number): KeyPair[] {
        while (this._nodes.length <= end) {
            this._nextKey();
        }
        return this.keyRing.slice(start, end);
    }

    public nullifiersAtRange(
        start: number,
        end: number,
        contractCode: BigNumber
    ): BigNumber[] {
        const nullifiers = [];
        for (let i = start; i < end; i++) {
            nullifiers.push(this.nullifierAt(i, contractCode));
        }
        return nullifiers;
    }

    static getContractCode(address: string, chainId: number): BigNumber {
        return hashMod(['address', 'uint256'], [address, chainId]);
    }
}

exports.HDSecretGenerator = HDSecretGenerator;
