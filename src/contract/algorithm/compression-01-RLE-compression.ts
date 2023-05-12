/** 
 * Run-length encoding (RLE) is a data compression technique which encodes data as a series of runs of a repeated single character. Runs are encoded as a length, followed by the character itself. Lengths are encoded as a single ASCII digit; runs of 10 characters or more are encoded by splitting them into multiple runs.
 * 
 * You are given the following input string:
 *     TppMMMMMMMMAUUfDDDeebbbbbbbEEOSSffffffwYYAAAAAAAzzzzzzzzzzttDD7
 * Encode it using run-length encoding with the minimum possible output length.
 * 
 * Examples:
 *     aaaaabccc            ->  5a1b3c
 *     aAaAaA               ->  1a1A1a1A1a1A
 *     111112333            ->  511233
 *     zzzzzzzzzzzzzzzzzzz  ->  9z9z1z  (or 9z8z2z, etc.)
 */

import { NS } from "@ns";

export function main(ns: NS): void {
    ns.tprintf("%s", rle("TppMMMMMMMMAUUfDDDeebbbbbbbEEOSSffffffwYYAAAAAAAzzzzzzzzzzttDD7"));
}

export function rle(data:string): string {
    let output = "";
    let count = 1;
    for (let i = 0; i < data.length; i++) {
        if (data[i] === data[i + 1]) {
            count++;
        } else {
            while (count > 9) {
                output += 9 + data[i];
                count -= 9;
            }
            if (count !== 0) {
                output += count + data[i];
            }
            count = 1;
        }
    }
    return output;
}