"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMPTY = exports.BLOCKED = exports.ALLOWED = exports.ZERO = exports.toFE = exports.stringHash = exports.hashMod = exports.P = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const solidity_1 = require("@ethersproject/solidity");
exports.P = bignumber_1.BigNumber.from('21888242871839275222246405745257275088548364400416034343698204186575808495617');
function hashMod(types, values) {
    return bignumber_1.BigNumber.from((0, solidity_1.keccak256)(types, values)).mod(exports.P);
}
exports.hashMod = hashMod;
function stringHash(value) {
    return bignumber_1.BigNumber.from((0, solidity_1.keccak256)(['string'], [value])).mod(exports.P);
}
exports.stringHash = stringHash;
function toFE(value) {
    return bignumber_1.BigNumber.from(value).mod(exports.P);
}
exports.toFE = toFE;
exports.ZERO = bignumber_1.BigNumber.from(0);
exports.ALLOWED = hashMod(['string'], ['allowed']);
exports.BLOCKED = hashMod(['string'], ['blocked']);
exports.EMPTY = hashMod(['string'], ['empty']);
