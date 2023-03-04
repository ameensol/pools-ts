import { BigNumber } from '@ethersproject/bignumber';
import { MerkleTree, MerkleTreeJSON, MerkleProof } from './merkle_tree';
import { BytesData, PackedData, SubsetData } from './subsets';
export type AccessListJSON = {
    accessType: string;
    subsetData: SubsetData;
    tree: MerkleTreeJSON;
};
export declare class AccessList {
    readonly accessType: string;
    readonly one: BigNumber;
    protected tree: MerkleTree;
    private _subsetData;
    get root(): BigNumber;
    get length(): number;
    get subsetData(): SubsetData;
    get leaves(): BigNumber[];
    get zeroValues(): BigNumber[];
    get LEVELS(): number;
    get CAPACITY(): number;
    get zero(): BigNumber;
    constructor({ accessType, subsetData, bytesData, packedData }: {
        accessType: string;
        subsetData?: SubsetData;
        bytesData?: BytesData;
        packedData?: PackedData;
    });
    insert(value: 0 | 1): number;
    update(index: number, value: 0 | 1): void;
    generateProof(index: number): MerkleProof;
    verifyProof(proof: MerkleProof): boolean;
    toJSON(): AccessListJSON;
    getWindow(start: number, end: number): SubsetData;
    setWindow(start: number, end: number, newSubsetData: SubsetData): void;
    extend(newLength: number): void;
    static fromJSON({ tree, accessType, subsetData }: AccessListJSON): AccessList;
    static fromString(jsonString: string): AccessList;
    static fullEmpty({ subsetLength, accessType }: {
        subsetLength: number;
        accessType: string;
    }): AccessList;
}
