import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
export type MerkleProof = {
    leaf: BigNumber;
    root: BigNumber;
    path: number;
    siblings: BigNumber[];
};
export type MerkleTreeJSON = {
    layers: BigNumberish[][];
    zero: BigNumberish;
};
export declare function verifyProof(proof: MerkleProof): boolean;
export declare class MerkleTree {
    readonly LEVELS: number;
    readonly CAPACITY: number;
    readonly zero: BigNumber;
    root: BigNumber;
    length: number;
    protected _zeroValues: BigNumber[];
    protected _layers: BigNumber[][];
    get leaves(): BigNumber[];
    get zeroValues(): BigNumber[];
    constructor({ leaves, zeroString, zero, levels }: {
        leaves: BigNumberish[];
        zeroString?: string;
        zero?: BigNumberish;
        levels?: number;
    });
    insert(leaf: BigNumberish): number;
    update(index: number, leaf: BigNumberish): void;
    protected _update(index: number, leaf: BigNumber): void;
    generateProof(index: number): MerkleProof;
    verifyProof(proof: MerkleProof): boolean;
    toJSON(): MerkleTreeJSON;
    static fromJSON({ layers, zero }: MerkleTreeJSON): MerkleTree;
    static fromString(jsonString: string): MerkleTree;
    static fullEmpty({ treeLength, zeroString, zero, levels }: {
        treeLength: number;
        zeroString?: string;
        zero?: BigNumberish;
        levels?: number;
    }): MerkleTree;
}
