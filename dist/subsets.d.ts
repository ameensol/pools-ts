import { BigNumber } from '@ethersproject/bignumber';
export type BytesData = {
    bitLength: number;
    data: Uint8Array;
};
export type PackedData = {
    bitLength: number;
    data: BigNumber[];
};
export type SubsetData = Array<0 | 1>;
export declare function isBytesData(d: any): d is BytesData;
export declare function isPackedData(d: any): d is BytesData;
export declare function isSubsetData(d: any): d is SubsetData;
export declare function subsetDataToBytes(subsetData: SubsetData): BytesData;
export declare function bytesToSubsetData(subsetBytes: BytesData): SubsetData;
export declare function packSubsetData(subsetData: SubsetData): PackedData;
export declare function unpackSubsetData(packedData: PackedData): SubsetData;
