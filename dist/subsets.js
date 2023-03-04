"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unpackSubsetData = exports.packSubsetData = exports.bytesToSubsetData = exports.subsetDataToBytes = exports.isSubsetData = exports.isPackedData = exports.isBytesData = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
function isBytesData(d) {
    return d && typeof d.bitLength === 'number' && d.data instanceof Uint8Array;
}
exports.isBytesData = isBytesData;
function isPackedData(d) {
    return d && typeof d.bitLength === 'number' && Array.isArray(d.data);
}
exports.isPackedData = isPackedData;
function isSubsetData(d) {
    return Array.isArray(d);
}
exports.isSubsetData = isSubsetData;
function subsetDataToBytes(subsetData) {
    const bitLength = subsetData.length;
    if (!bitLength)
        return { bitLength, data: new Uint8Array() };
    const tail = bitLength % 8;
    const bytesLength = tail > 0 ? Math.floor(bitLength / 8) + 1 : Math.floor(bitLength / 8);
    const bytesData = new Uint8Array(bytesLength);
    for (let i = 0; i < bytesLength - 1; i++) {
        bytesData[i] = 0;
        for (let j = 0; j < 8; j++) {
            const v = subsetData[i * 8 + j];
            if (v !== 0 && v !== 1) {
                throw new Error(`Expected binary inputs only, received ${v} instead`);
            }
            bytesData[i] = bytesData[i] | (v << (7 - j));
        }
    }
    bytesData[bytesLength - 1] = 0;
    for (let i = 0; i < (tail === 0 ? 8 : tail); i++) {
        const v = subsetData[(bytesLength - 1) * 8 + i];
        if (v !== 0 && v !== 1) {
            throw new Error(`Expected binary inputs only, received ${v} instead`);
        }
        bytesData[bytesLength - 1] =
            bytesData[bytesLength - 1] | (v << (7 - i));
    }
    return { bitLength, data: bytesData };
}
exports.subsetDataToBytes = subsetDataToBytes;
function bytesToSubsetData(subsetBytes) {
    const bytesLength = subsetBytes.data.length;
    if (bytesLength === 0)
        return [];
    const subsetData = [];
    for (let i = 0; i < bytesLength - 1; i++) {
        for (let j = 0; j < 8; j++) {
            const slot = 1 << (7 - j);
            if ((subsetBytes.data[i] & slot) === slot) {
                subsetData[i * 8 + j] = 1;
            }
            else {
                subsetData[i * 8 + j] = 0;
            }
        }
    }
    const tail = subsetBytes.bitLength % 8 || 8;
    for (let j = 0; j < tail; j++) {
        const slot = 1 << (7 - j);
        if ((subsetBytes.data[bytesLength - 1] & slot) === slot) {
            subsetData[(bytesLength - 1) * 8 + j] = 1;
        }
        else {
            subsetData[(bytesLength - 1) * 8 + j] = 0;
        }
    }
    return subsetData;
}
exports.bytesToSubsetData = bytesToSubsetData;
function packSubsetData(subsetData) {
    const bitLength = subsetData.length;
    if (bitLength === 0)
        return { bitLength, data: [] };
    const numWords = Math.ceil(bitLength / 256);
    const packedData = new Array(numWords);
    for (let i = 0; i < numWords - 1; i++) {
        let x = bignumber_1.BigNumber.from(0);
        for (let j = 0; j < 256; j++) {
            const v = subsetData[i * 256 + j];
            if (v !== 0 && v !== 1) {
                throw new Error(`Expected binary inputs only, received ${v} instead`);
            }
            x = x.or(bignumber_1.BigNumber.from(v).shl(255 - j));
        }
        packedData[i] = x;
    }
    const tail = bitLength % 256;
    let x = bignumber_1.BigNumber.from(0);
    if (tail > 0) {
        for (let j = 0; j < tail; j++) {
            const v = subsetData[subsetData.length - tail + j];
            if (v !== 0 && v !== 1) {
                throw new Error(`Expected binary inputs only, received ${v} instead`);
            }
            x = x.or(bignumber_1.BigNumber.from(v).shl(255 - j));
        }
    }
    else {
        for (let j = 0; j < 256; j++) {
            const v = subsetData[subsetData.length - 256 + j];
            if (v !== 0 && v !== 1) {
                throw new Error(`Expected binary inputs only, received ${v} instead`);
            }
            x = x.or(bignumber_1.BigNumber.from(v).shl(255 - j));
        }
    }
    packedData[numWords - 1] = x;
    return { bitLength, data: packedData };
}
exports.packSubsetData = packSubsetData;
function unpackSubsetData(packedData) {
    if (!isPackedData(packedData)) {
        throw new Error(`Expected PackedData input only, received ${packedData.toString} instead`);
    }
    const numWords = packedData.data.length;
    if (numWords === 0)
        return [];
    const subsetData = new Array();
    for (let i = 0; i < numWords - 1; i++) {
        if (!bignumber_1.BigNumber.isBigNumber(packedData.data[i])) {
            throw new Error(`Expected BigNumber inputs only, received ${packedData.data[i].toString} instead`);
        }
        for (let j = 0; j < 256; j++) {
            const slot = bignumber_1.BigNumber.from(1).shl(255 - j);
            if (packedData.data[i].and(slot).eq(slot)) {
                subsetData[i * 256 + j] = 1;
            }
            else {
                subsetData[i * 256 + j] = 0;
            }
        }
    }
    const tail = packedData.bitLength % 256 || 256;
    for (let i = 0; i < tail; i++) {
        const slot = bignumber_1.BigNumber.from(1).shl(255 - i);
        if (packedData.data[numWords - 1].and(slot).eq(slot)) {
            subsetData[(numWords - 1) * 256 + i] = 1;
        }
        else {
            subsetData[(numWords - 1) * 256 + i] = 0;
        }
    }
    return subsetData;
}
exports.unpackSubsetData = unpackSubsetData;
