import { BigNumberish, BigNumber } from '@ethersproject/bignumber';
type NumOutputs = typeof undefined | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;
type PoseidonOutput<T> = T extends Exclude<NumOutputs, 1 | typeof undefined> ? BigNumber[] : BigNumber;
export declare function poseidon<T extends NumOutputs>(inputs: BigNumberish[] | BigNumber[], numOutputs?: T): PoseidonOutput<T>;
export {};
