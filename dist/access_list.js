"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessList = void 0;
const common_1 = require("./common");
const merkle_tree_1 = require("./merkle_tree");
const subsets_1 = require("./subsets");
class AccessList {
    get root() {
        return this.tree.root;
    }
    get length() {
        return this.tree.length;
    }
    get subsetData() {
        return this._subsetData.slice();
    }
    get leaves() {
        return this.tree.leaves;
    }
    get zeroValues() {
        return this.tree.zeroValues;
    }
    get LEVELS() {
        return this.tree.LEVELS;
    }
    get CAPACITY() {
        return this.tree.CAPACITY;
    }
    get zero() {
        return this.tree.zero;
    }
    constructor({ accessType, subsetData, bytesData, packedData }) {
        let zero, one;
        switch (accessType) {
            case 'allowlist':
                zero = common_1.BLOCKED;
                one = common_1.ALLOWED;
                break;
            case 'blocklist':
                zero = common_1.ALLOWED;
                one = common_1.BLOCKED;
                break;
            default:
                throw new Error(`Expected a valid accessType ('allowlist' or 'blocklist'), received ${accessType} instead.`);
        }
        let subset;
        let leaves;
        if ((0, subsets_1.isSubsetData)(subsetData)) {
            subset = subsetData;
            leaves = new Array(subsetData.length);
            for (let i = 0; i < subsetData.length; i++) {
                const v = subsetData[i];
                if (v !== 0 && v !== 1) {
                    throw new Error(`Expected binary inputs only, received ${v} instead`);
                }
                leaves[i] = v ? one : zero;
            }
        }
        else if ((0, subsets_1.isBytesData)(bytesData)) {
            subset = (0, subsets_1.bytesToSubsetData)(bytesData);
            leaves = new Array(subset.length);
            for (let i = 0; i < subset.length; i++) {
                const v = subset[i];
                if (v !== 0 && v !== 1) {
                    throw new Error(`Expected binary inputs only, received ${v} instead`);
                }
                leaves[i] = v ? one : zero;
            }
        }
        else if ((0, subsets_1.isPackedData)(packedData)) {
            subset = (0, subsets_1.unpackSubsetData)(packedData);
            leaves = new Array(subset.length);
            for (let i = 0; i < subset.length; i++) {
                const v = subset[i];
                if (v !== 0 && v !== 1) {
                    throw new Error(`Expected binary inputs only, received ${v} instead`);
                }
                leaves[i] = v ? one : zero;
            }
        }
        else if (typeof subsetData === 'undefined' &&
            typeof bytesData === 'undefined' &&
            typeof packedData === 'undefined') {
            subset = [];
            leaves = [];
        }
        else {
            throw new Error(`Invalid constructor arguments, either subsetData, bytesData, or packedData are incorrect`);
        }
        this.accessType = accessType;
        this.one = one;
        this._subsetData = subset;
        this.tree = new merkle_tree_1.MerkleTree({ leaves, zero });
    }
    insert(value) {
        if (value !== 0 && value !== 1) {
            throw new Error(`Expected binary inputs only, received ${value} instead`);
        }
        const index = this.tree.insert(value ? this.one : this.zero);
        this._subsetData[index] = value;
        return index;
    }
    update(index, value) {
        if (value !== 0 && value !== 1) {
            throw new Error(`Expected binary inputs only, received ${value} instead`);
        }
        this.tree.update(index, value ? this.one : this.zero);
        this._subsetData[index] = value;
    }
    generateProof(index) {
        return this.tree.generateProof(index);
    }
    verifyProof(proof) {
        return this.tree.verifyProof(proof);
    }
    toJSON() {
        return {
            accessType: this.accessType,
            subsetData: this.subsetData,
            tree: this.tree.toJSON()
        };
    }
    getWindow(start, end) {
        return this._subsetData.slice(start, end);
    }
    setWindow(start, end, newSubsetData) {
        if (isNaN(start) || isNaN(end)) {
            throw new Error(`Invalid start or end, expected number`);
        }
        else if (start < 0 ||
            end < 0 ||
            start > end ||
            end > this.tree.CAPACITY ||
            end > this.tree.length) {
            throw new Error(`Invalid slice, must be within bounds and use positive index only`);
        }
        else if (!(0, subsets_1.isSubsetData)(newSubsetData)) {
            throw new Error(`Invalid newSubsetData`);
        }
        const existing = this._subsetData.slice(start, end);
        if (existing.length !== newSubsetData.length) {
            throw new Error(`Expected newSubsetData length to be ${existing.length}, instead got ${newSubsetData.length} `);
        }
        for (const v of newSubsetData) {
            if (v !== 0 && v !== 1) {
                throw new Error(`Expected binary inputs only, received ${v} instead`);
            }
        }
        for (let i = 0, j = start; j < end; i++, j++) {
            const v = newSubsetData[i];
            this.tree.update(j, v ? this.one : this.zero);
            this._subsetData[j] = v;
        }
    }
    extend(newLength) {
        if (newLength > this.tree.CAPACITY) {
            throw new Error(`New length exceeds the maximum capacity of the tree.`);
        }
        const initialLength = this.tree.length;
        if (initialLength >= newLength)
            return;
        for (let i = initialLength; newLength > initialLength; i++, newLength--) {
            this.tree.insert(this.zero);
            this._subsetData[i] = 0;
        }
    }
    static fromJSON({ tree, accessType, subsetData }) {
        const accessList = new AccessList({ accessType });
        accessList._subsetData = subsetData;
        accessList.tree = merkle_tree_1.MerkleTree.fromJSON(tree);
        return accessList;
    }
    static fromString(jsonString) {
        const parsedJson = JSON.parse(jsonString);
        return AccessList.fromJSON(parsedJson);
    }
    static fullEmpty({ subsetLength, accessType }) {
        const accessList = new AccessList({ accessType });
        accessList._subsetData = new Array(subsetLength).fill(0);
        accessList.tree = merkle_tree_1.MerkleTree.fullEmpty({
            treeLength: subsetLength,
            zero: accessList.zero
        });
        return accessList;
    }
}
exports.AccessList = AccessList;
