import { BigNumber } from '@ethersproject/bignumber';
import { ALLOWED, BLOCKED } from './common';
import { MerkleTree, MerkleTreeJSON, MerkleProof } from './merkle_tree';
import {
    unpackSubsetData,
    bytesToSubsetData,
    isBytesData,
    isPackedData,
    isSubsetData,
    BytesData,
    PackedData,
    SubsetData
} from './subsets';

export type AccessListJSON = {
    accessType: string;
    subsetData: SubsetData;
    tree: MerkleTreeJSON;
};

export class AccessList {
    readonly accessType: string;
    readonly one: BigNumber;
    protected tree: MerkleTree;
    private _subsetData: SubsetData;

    get root(): BigNumber {
        return this.tree.root;
    }

    get length(): number {
        return this.tree.length;
    }

    get subsetData(): SubsetData {
        return this._subsetData.slice();
    }

    get leaves(): BigNumber[] {
        return this.tree.leaves;
    }

    get zeroValues(): BigNumber[] {
        return this.tree.zeroValues;
    }

    get LEVELS(): number {
        return this.tree.LEVELS;
    }

    get CAPACITY(): number {
        return this.tree.CAPACITY;
    }

    get zero(): BigNumber {
        return this.tree.zero;
    }

    constructor({
        accessType,
        subsetData,
        bytesData,
        packedData
    }: {
        accessType: string;
        subsetData?: SubsetData;
        bytesData?: BytesData;
        packedData?: PackedData;
    }) {
        let zero, one;
        switch (accessType) {
            case 'allowlist':
                zero = BLOCKED;
                one = ALLOWED;
                break;
            case 'blocklist':
                zero = ALLOWED;
                one = BLOCKED;
                break;
            default:
                throw new Error(
                    `Expected a valid accessType ('allowlist' or 'blocklist'), received ${accessType} instead.`
                );
        }
        let subset: SubsetData;
        let leaves: BigNumber[];
        if (isSubsetData(subsetData)) {
            subset = subsetData;
            leaves = new Array(subsetData.length);
            for (let i = 0; i < subsetData.length; i++) {
                const v = subsetData[i];
                if (v !== 0 && v !== 1) {
                    throw new Error(
                        `Expected binary inputs only, received ${v} instead`
                    );
                }
                leaves[i] = v ? one : zero;
            }
        } else if (isBytesData(bytesData)) {
            subset = bytesToSubsetData(bytesData);
            leaves = new Array(subset.length);
            for (let i = 0; i < subset.length; i++) {
                const v = subset[i];
                if (v !== 0 && v !== 1) {
                    throw new Error(
                        `Expected binary inputs only, received ${v} instead`
                    );
                }
                leaves[i] = v ? one : zero;
            }
        } else if (isPackedData(packedData)) {
            subset = unpackSubsetData(packedData);
            leaves = new Array(subset.length);
            for (let i = 0; i < subset.length; i++) {
                const v = subset[i];
                if (v !== 0 && v !== 1) {
                    throw new Error(
                        `Expected binary inputs only, received ${v} instead`
                    );
                }
                leaves[i] = v ? one : zero;
            }
        } else if (
            typeof subsetData === 'undefined' &&
            typeof bytesData === 'undefined' &&
            typeof packedData === 'undefined'
        ) {
            subset = [];
            leaves = [];
        } else {
            throw new Error(
                `Invalid constructor arguments, either subsetData, bytesData, or packedData are incorrect`
            );
        }
        this.accessType = accessType;
        this.one = one;
        this._subsetData = subset;
        this.tree = new MerkleTree({ leaves, zero });
    }

    public insert(value: 0 | 1): number {
        if (value !== 0 && value !== 1) {
            throw new Error(
                `Expected binary inputs only, received ${value} instead`
            );
        }
        const index = this.tree.insert(value ? this.one : this.zero);
        this._subsetData[index] = value;
        return index;
    }

    public update(index: number, value: 0 | 1): void {
        if (value !== 0 && value !== 1) {
            throw new Error(
                `Expected binary inputs only, received ${value} instead`
            );
        }
        this.tree.update(index, value ? this.one : this.zero);
        this._subsetData[index] = value;
    }

    public generateProof(index: number): MerkleProof {
        return this.tree.generateProof(index);
    }

    public verifyProof(proof: MerkleProof): boolean {
        return this.tree.verifyProof(proof);
    }

    public toJSON(): AccessListJSON {
        return {
            accessType: this.accessType,
            subsetData: this.subsetData,
            tree: this.tree.toJSON()
        };
    }

    public getWindow(start: number, end: number): SubsetData {
        return this._subsetData.slice(start, end);
    }

    public setWindow(
        start: number,
        end: number,
        newSubsetData: SubsetData
    ): void {
        if (isNaN(start) || isNaN(end)) {
            throw new Error(`Invalid start or end, expected number`);
        } else if (
            start < 0 ||
            end < 0 ||
            start > end ||
            end > this.tree.CAPACITY ||
            end > this.tree.length
        ) {
            throw new Error(
                `Invalid slice, must be within bounds and use positive index only`
            );
        } else if (!isSubsetData(newSubsetData)) {
            throw new Error(`Invalid newSubsetData`);
        }
        const existing = this._subsetData.slice(start, end);
        if (existing.length !== newSubsetData.length) {
            throw new Error(
                `Expected newSubsetData length to be ${existing.length}, instead got ${newSubsetData.length} `
            );
        }
        for (const v of newSubsetData) {
            if (v !== 0 && v !== 1) {
                throw new Error(
                    `Expected binary inputs only, received ${v} instead`
                );
            }
        }

        for (let i = 0, j = start; j < end; i++, j++) {
            const v = newSubsetData[i];
            this.tree.update(j, v ? this.one : this.zero);
            this._subsetData[j] = v;
        }
    }

    public extend(newLength: number): void {
        if (newLength > this.tree.CAPACITY) {
            throw new Error(
                `New length exceeds the maximum capacity of the tree.`
            );
        }
        const initialLength = this.tree.length;
        if (initialLength >= newLength) return;
        for (
            let i = initialLength;
            newLength > initialLength;
            i++, newLength--
        ) {
            this.tree.insert(this.zero);
            this._subsetData[i] = 0;
        }
    }

    static fromJSON({
        tree,
        accessType,
        subsetData
    }: AccessListJSON): AccessList {
        const accessList = new AccessList({ accessType });
        accessList._subsetData = subsetData;
        accessList.tree = MerkleTree.fromJSON(tree);
        return accessList;
    }

    static fromString(jsonString: string): AccessList {
        const parsedJson: AccessListJSON = JSON.parse(jsonString);
        return AccessList.fromJSON(parsedJson);
    }

    static fullEmpty({
        subsetLength,
        accessType
    }: {
        subsetLength: number;
        accessType: string;
    }): AccessList {
        const accessList = new AccessList({ accessType });
        accessList._subsetData = new Array(subsetLength).fill(0);
        accessList.tree = MerkleTree.fullEmpty({
            treeLength: subsetLength,
            zero: accessList.zero
        });
        return accessList;
    }
}
