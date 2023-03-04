import { BigNumber } from '@ethersproject/bignumber';
type Seed = [presecret: BigNumber, chainCode: BigNumber];
type KeyPair = [secret: BigNumber, commitment: BigNumber];
type HDNode = {
    extendedSeed: [
        presecret: Seed[0],
        chainCode: Seed[1],
        randomness: BigNumber
    ];
    keyPair: KeyPair;
};
export declare class HDSecretGenerator {
    private _mainSeed;
    private _nodes;
    maxKeys: number;
    constructor({ mnemonic, password, numKeys }: {
        mnemonic: string;
        password?: string;
        numKeys?: number;
    });
    get mainSeed(): Seed;
    get nodes(): HDNode[];
    get keyRing(): KeyPair[];
    get commitments(): BigNumber[];
    get secrets(): BigNumber[];
    get latestNode(): HDNode;
    get latestKeys(): KeyPair;
    private _nextKey;
    keysAt(index: number): KeyPair;
    nullifierAt(index: number, contractCode: BigNumber): BigNumber;
    nullifiersAt(index: number, numNullifiers: number, contractCode: BigNumber): BigNumber[];
    keysAtRange(start: number, end: number): KeyPair[];
    nullifiersAtRange(start: number, end: number, contractCode: BigNumber): BigNumber[];
    static getContractCode(address: string, chainId: number): BigNumber;
}
export {};
