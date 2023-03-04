"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerkleTree = exports.verifyProof = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const bytes_1 = require("@ethersproject/bytes");
const poseidon_1 = require("./poseidon");
const common_1 = require("./common");
function verifyProof(proof) {
    const { leaf, root, path, siblings } = proof;
    let hashValue = leaf;
    for (let i = 0; i < siblings.length; i++) {
        const layerIndex = path >>> i;
        if ((layerIndex & 1) === 1) {
            hashValue = (0, poseidon_1.poseidon)([siblings[i], hashValue], 1);
        }
        else {
            hashValue = (0, poseidon_1.poseidon)([hashValue, siblings[i]], 1);
        }
    }
    return root.eq(hashValue);
}
exports.verifyProof = verifyProof;
class MerkleTree {
    get leaves() {
        return this._layers[0].slice();
    }
    get zeroValues() {
        return this._zeroValues.slice();
    }
    constructor({ leaves, zeroString = 'empty', zero, levels = 20 }) {
        this.LEVELS = levels;
        this.CAPACITY = 1 << levels;
        if (typeof zeroString !== 'string') {
            throw new Error(`Invalid zeroString, expected a string.`);
        }
        if (zero) {
            try {
                this._zeroValues = [(0, common_1.toFE)(zero)];
            }
            catch (_a) {
                throw new Error(`Invalid zero input, expected BigNumberish value.`);
            }
        }
        else {
            this._zeroValues = [(0, common_1.stringHash)(zeroString)];
        }
        this.zero = this._zeroValues[0];
        for (let i = 0; i < this.LEVELS; i++) {
            this._zeroValues[i + 1] = (0, poseidon_1.poseidon)([this._zeroValues[i], this._zeroValues[i]], 1);
        }
        if (!Array.isArray(leaves)) {
            throw new Error(`Invalid leaves, expected an array.`);
        }
        else if (leaves.length >= this.CAPACITY) {
            throw new Error(`Leaves length exceeds the maximum capacity of the tree.`);
        }
        const layers = new Array(this.LEVELS + 1);
        try {
            layers[0] = leaves.map(bignumber_1.BigNumber.from);
        }
        catch (_b) {
            throw new Error(`Invalid leaves input, expected BigNumberish values.`);
        }
        if (layers[0].length > 0) {
            for (let i = 1; i < this.LEVELS + 1; i++) {
                const p = layers[i - 1].length;
                const n = Math.ceil(p / 2);
                layers[i] = new Array(n);
                if (n > 0) {
                    for (let j = 0; j < n - 1; j++) {
                        layers[i][j] = (0, poseidon_1.poseidon)([
                            layers[i - 1][j * 2],
                            layers[i - 1][j * 2 + 1]
                        ]);
                    }
                    if ((p & 1) === 1) {
                        layers[i][n - 1] = (0, poseidon_1.poseidon)([
                            layers[i - 1][p - 1],
                            this._zeroValues[i - 1]
                        ]);
                    }
                    else {
                        layers[i][n - 1] = (0, poseidon_1.poseidon)([
                            layers[i - 1][p - 2],
                            layers[i - 1][p - 1]
                        ]);
                    }
                }
            }
        }
        else {
            for (let i = 1; i < this.LEVELS + 1; i++) {
                layers[i] = new Array();
            }
        }
        this._layers = layers;
        this.root =
            this._layers[this.LEVELS][0] || this._zeroValues[this.LEVELS];
        this.length = layers[0].length;
    }
    insert(leaf) {
        const index = this.length;
        if (index >= this.CAPACITY) {
            throw new Error(`The tree is at capacity. No more leaves can be inserted.`);
        }
        try {
            leaf = bignumber_1.BigNumber.from(leaf);
        }
        catch (_a) {
            throw new Error(`Invalid insert leaf, expected BigNumberish value.`);
        }
        this._update(index, leaf);
        return index;
    }
    update(index, leaf) {
        if (isNaN(index))
            throw new Error(`Invalid value for index: ${index}`);
        if (index >= this.length) {
            throw new Error(`Index ${index} is out of bounds of tree with size ${this.length}.`);
        }
        try {
            leaf = bignumber_1.BigNumber.from(leaf);
        }
        catch (_a) {
            throw new Error(`Invalid update leaf, expected BigNumberish value.`);
        }
        if (!this._layers[0][index].eq(leaf))
            this._update(index, leaf);
    }
    _update(index, leaf) {
        this._layers[0][index] = leaf;
        for (let i = 1; i < this.LEVELS + 1; i++) {
            const n = index >>> (i - 1);
            const p = n >>> 1;
            if ((n & 1) === 1) {
                this._layers[i][p] = (0, poseidon_1.poseidon)([this._layers[i - 1][n - 1], this._layers[i - 1][n]], 1);
            }
            else {
                if (n + 1 >= this._layers[i - 1].length) {
                    this._layers[i][p] = (0, poseidon_1.poseidon)([this._layers[i - 1][n], this._zeroValues[i - 1]], 1);
                }
                else {
                    this._layers[i][p] = (0, poseidon_1.poseidon)([this._layers[i - 1][n], this._layers[i - 1][n + 1]], 1);
                }
            }
        }
        this.root = this._layers[this.LEVELS][0];
        this.length = this._layers[0].length;
    }
    generateProof(index) {
        if (isNaN(index))
            throw new Error(`Invalid value for index: ${index}`);
        if (this.length === 0 || index >= this.length) {
            throw new Error(`Index ${index} is out of bounds of tree with size ${this.length}.`);
        }
        const siblings = new Array(this.LEVELS);
        for (let i = 0; i < this.LEVELS; i++) {
            const layerIndex = index >>> i;
            if ((layerIndex & 1) === 1) {
                siblings[i] = this._layers[i][layerIndex - 1];
            }
            else {
                if (layerIndex + 1 < this._layers[i].length) {
                    siblings[i] = this._layers[i][layerIndex + 1];
                }
                else {
                    siblings[i] = this._zeroValues[i];
                }
            }
        }
        return {
            leaf: this._layers[0][index],
            root: this._layers[this.LEVELS][0],
            path: index,
            siblings
        };
    }
    verifyProof(proof) {
        return (this.root.eq(proof.root) &&
            proof.siblings.length === this.LEVELS &&
            verifyProof(proof));
    }
    toJSON() {
        return {
            zero: (0, bytes_1.hexZeroPad)(this._zeroValues[0].toHexString(), 32),
            layers: this._layers.map((layer) => {
                return layer.map((value) => (0, bytes_1.hexZeroPad)(value.toHexString(), 32));
            })
        };
    }
    static fromJSON({ layers, zero }) {
        try {
            zero = bignumber_1.BigNumber.from(zero);
        }
        catch (_a) {
            throw new Error(`Invalid zero input, expected BigNumberish value.`);
        }
        let restoredLayers;
        try {
            restoredLayers = layers.map((layer) => layer.map(bignumber_1.BigNumber.from));
        }
        catch (_b) {
            throw new Error(`Invalid layers input, expected BigNumberish values.`);
        }
        const tree = new MerkleTree({ leaves: [], zero });
        tree._layers = restoredLayers;
        tree.length = restoredLayers[0].length;
        tree.root =
            tree._layers[tree.LEVELS][0] || tree._zeroValues[tree.LEVELS];
        return tree;
    }
    static fromString(jsonString) {
        const parsedJson = JSON.parse(jsonString);
        return MerkleTree.fromJSON(parsedJson);
    }
    static fullEmpty({ treeLength, zeroString = 'empty', zero, levels = 20 }) {
        const tree = new MerkleTree({ leaves: [], zeroString, zero, levels });
        let layers = new Array(tree.LEVELS + 1);
        for (let i = 0; i <= tree.LEVELS; i++) {
            layers[i] = new Array(Math.ceil(treeLength / (1 << i))).fill(tree.zeroValues[i]);
        }
        tree._layers = layers;
        tree.length = treeLength;
        tree.root = tree._zeroValues[tree.LEVELS];
        return tree;
    }
}
exports.MerkleTree = MerkleTree;
