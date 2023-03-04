"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HDSecretGenerator = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const hdnode_1 = require("@ethersproject/hdnode");
const common_1 = require("./common");
const poseidon_1 = require("./poseidon");
/*
  HDSecretGenerator is a class that implements the hierarchical deterministic secret generation.
  It is used to generate a list of commitments, which are similar to a list of public addresses in a wallet. The
  HDSecretGenerator is initialized with a mnemonic, a password, and number of commitments to
  generate initially. The mnemonic and password are used to generate the seed. The seed is then used to generate the
  first parent node, which is used to generate the first child node, which is used to generate the first commitment. The
  process is repeated to generate a list of extended secrets and corresponding commitments.
*/
class HDSecretGenerator {
    constructor({ mnemonic, password = '', numKeys = 10 }) {
        this.maxKeys = 1024; // arbitrary
        if (!(0, hdnode_1.isValidMnemonic)(mnemonic)) {
            throw new Error('Invalid mnemonic');
        }
        var seedHex = (0, hdnode_1.mnemonicToSeed)(mnemonic, password);
        this._mainSeed = [
            bignumber_1.BigNumber.from(seedHex.slice(0, 66)).mod(common_1.P),
            bignumber_1.BigNumber.from('0x' + seedHex.slice(66, 130)).mod(common_1.P)
        ];
        this._nodes = [];
        while (this._nodes.length < numKeys) {
            this._nextKey();
        }
    }
    get mainSeed() {
        return this._mainSeed;
    }
    get nodes() {
        return this._nodes;
    }
    get keyRing() {
        return this._nodes.map((node) => node.keyPair);
    }
    get commitments() {
        return this._nodes.map((node) => node.keyPair[1]);
    }
    get secrets() {
        return this._nodes.map((node) => node.keyPair[0]);
    }
    get latestNode() {
        if (this._nodes.length === 0) {
            throw new Error('No nodes generated yet');
        }
        return this._nodes[this._nodes.length - 1];
    }
    get latestKeys() {
        if (this._nodes.length === 0) {
            throw new Error('No nodes generated yet');
        }
        return this._nodes[this._nodes.length - 1].keyPair;
    }
    _nextKey() {
        const parent = this._nodes.length === 0
            ? {
                extendedSeed: this._mainSeed,
                keyPair: [bignumber_1.BigNumber.from(0), bignumber_1.BigNumber.from(0)]
            }
            : this._nodes[this._nodes.length - 1];
        const extendedSeed = (0, poseidon_1.poseidon)(parent.extendedSeed.slice(0, 2), 3);
        const secret = (0, poseidon_1.poseidon)([extendedSeed[0], extendedSeed[2]], 1);
        const commitment = (0, poseidon_1.poseidon)([bignumber_1.BigNumber.from(0), secret], 1);
        const keyPair = [secret, commitment];
        const node = {
            extendedSeed,
            keyPair
        };
        this._nodes.push(node);
        return node;
    }
    keysAt(index) {
        while (this._nodes.length <= index) {
            this._nextKey();
        }
        return this._nodes[index].keyPair;
    }
    nullifierAt(index, contractCode) {
        const [secret] = this.keysAt(index);
        return (0, poseidon_1.poseidon)([0, secret, index, contractCode], 1);
    }
    nullifiersAt(index, numNullifiers, contractCode) {
        const nullifiers = [];
        for (let i = index; i < index + numNullifiers; i++) {
            nullifiers.push(this.nullifierAt(i, contractCode));
        }
        return nullifiers;
    }
    keysAtRange(start, end) {
        while (this._nodes.length <= end) {
            this._nextKey();
        }
        return this.keyRing.slice(start, end);
    }
    nullifiersAtRange(start, end, contractCode) {
        const nullifiers = [];
        for (let i = start; i < end; i++) {
            nullifiers.push(this.nullifierAt(i, contractCode));
        }
        return nullifiers;
    }
    static getContractCode(address, chainId) {
        return (0, common_1.hashMod)(['address', 'uint256'], [address, chainId]);
    }
}
exports.HDSecretGenerator = HDSecretGenerator;
exports.HDSecretGenerator = HDSecretGenerator;
