/**
 * You are given the following decimal Value:
 * 82725
 * Convert it to a binary representation and encode it as an 'extended Hamming code'. Eg:
 * Value 8 is expressed in binary as '1000', which will be encoded with the pattern 'pppdpddd', where p is a parity bit and d a data bit. The encoding of
 * 8 is 11110000. As another example, '10101' (Value 21) will result into (pppdpdddpd) '1001101011'.
 * The answer should be given as a string containing only 1s and 0s.
 * NOTE: the endianness of the data bits is reversed in relation to the endianness of the parity bits.
 * NOTE: The bit at index zero is the overall parity bit, this should be set last.
 * NOTE 2: You should watch the Hamming Code video from 3Blue1Brown, which explains the 'rule' of encoding, including the first index parity bit mentioned in the previous note.
 * 
 * Extra rule for encoding:
 * There should be no leading zeros in the 'data bit' section
 */

import { NS } from "@ns";

export function main(ns: NS): void {
    ns.tprintf(test(1, "1111"));
    ns.tprintf(test(2, "111100"));
    ns.tprintf(test(3, "001111"));
    ns.tprintf(test(5, "0101101"));
    ns.tprintf(test(8, "11110000"));
    ns.tprintf(test(13, "01010101"));
    ns.tprintf(test(21, "1001101011"));
    ns.tprintf(test(154, "0011100101010"));
    ns.tprintf(test(82725, "11111010000011001100101"));
}

function test(data: number, expect: string): string {
    const actual = encodeHammingFromInteger(data);
    if (expect === actual) {
        return `INFO Expect: ${expect}, Actual: ${actual}`;
    } else {
        const binary = data.toString(2);
        const parityBits = calcParityBits(binary.length);
        const dataBits = populateData(binary, binary.length, parityBits);
        return `FAIL Expect: ${expect}
     Actual: ${actual}
  Data bits:  ${dataBits}
     Binary: ${binary}
Parity bits: ${parityBits}`;
    }
}

// Adapted from the algorithm at http://users.cs.fiu.edu/~downeyt/cop3402/hamming.html
export function encodeHammingFromInteger(data: number): string {
    let binary = data.toString(2);

    const dataBits = binary.length;
    const parityBits = calcParityBits(dataBits);

    let hamming = populateData(binary, dataBits, parityBits);
    hamming = populateParity(hamming);
    hamming = extendHamming(hamming);

    return hamming;
}

function calcParityBits(dataBits: number): number {
    let parityBits = 0;
    while (Math.pow(2, parityBits) < dataBits + parityBits + 1) {
        parityBits++;
    }

    return parityBits;
}

function populateData(binary: string, dataBits: number, parityBits: number): string {
    let hamming = "";
    let dataBitIndex = 0;
    for (let i = 0; i < dataBits + parityBits; i++) {
        if (Math.log2(i + 1) % 1 === 0) {
            hamming += "_";
        } else {
            hamming += binary[dataBitIndex++];
        }
    }
    return hamming;
}

function populateParity(hamming: string): string {
    for (let i = 0; i < hamming.length; i++) {
        if (hamming[i] === "_") {
            const batch = i + 1;
            let parity = 0;
            for (let j = i; j < hamming.length; j += batch * 2) {
                for (let k = 0; k < batch; k++) {
                    if (hamming[j + k] === "1") {
                        parity++;
                    }
                }
            }

            hamming = hamming.slice(0, i) + parity % 2 + hamming.slice(i + 1);
        }
    }

    return hamming;
}

function extendHamming(hamming: string): string {
    let sum = 0;
    for (const c of hamming) {
        if (c === "1") {
            sum++;
        }
    }

    return (sum % 2) + hamming;
}