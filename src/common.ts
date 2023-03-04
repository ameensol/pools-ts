import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { keccak256 } from '@ethersproject/solidity';

export const P = BigNumber.from(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617'
);

export function hashMod(types: string[], values: any[]): BigNumber {
    return BigNumber.from(keccak256(types, values)).mod(P);
}

export function stringHash(value: string): BigNumber {
    return BigNumber.from(keccak256(['string'], [value])).mod(P);
}

export function toFE(value: BigNumberish): BigNumber {
    return BigNumber.from(value).mod(P);
}

export const ZERO = BigNumber.from(0);
export const ALLOWED = hashMod(['string'], ['allowed']);
export const BLOCKED = hashMod(['string'], ['blocked']);
export const EMPTY = hashMod(['string'], ['empty']);
