/**
 * You are given the following encoded binary string:
 * '1011000000000000100000000000001000010001011010100011011111111000'
 * 
 * Treat it as an extended Hamming code with 1 'possible' error at a random index.
 * Find the 'possible' wrong bit, fix it and extract the decimal value, which is hidden inside the string.
 * 
 * Note: The length of the binary string is dynamic, but its encoding/decoding follows Hamming's 'rule'
 * Note 2: Index 0 is an 'overall' parity bit. Watch the Hamming code video from 3Blue1Brown for more information
 * Note 3: There's a ~55% chance for an altered Bit. So... MAYBE there is an altered Bit 😉
 * Note: The endianness of the encoded decimal value is reversed in relation to the endianness of the Hamming code. 
 *       Where the Hamming code is expressed as little-endian (LSB at index 0), 
 *       the decimal value encoded in it is expressed as big-endian (MSB at index 0).
 * Extra note for automation: return the decimal value as a string
 */

/**
 * '00101100' -> '12'
 */

import { NS } from "@ns";

export function main(ns: NS): void {
    let binaryString = "00101100";
    let decimal = decodeHamming(binaryString);
    ns.print(`Expect 12, got ${decimal}`);
}

export function decodeHamming(binary:string): string {
    const parityIdx:number[] = getParityIdx(binary.length-1);
    return decodeBinary(binary.slice(1), parityIdx);
}

function decodeBinary(binary:string, parityIdx:number[]): string {
    let decimal = 0;
    for (let i = 0; i < binary.length; i++) {
        if (parityIdx.indexOf(i) == -1) {
            decimal += parseInt(binary[i]) * Math.pow(2, i - parityIdx.length);
        }
    }
    return decimal.toString();
}

export function getParityIdx(length:number): number[] {
    let parityIdx:number[] = [];
    let i = 0;
    while (Math.pow(2, i) < length) {
        parityIdx.push(Math.pow(2, i));
        i++;
    }
    return parityIdx;
}

