/** 
 * Lempel-Ziv (LZ) compression is a data compression technique which encodes data using references to earlier parts of the data. 
 * In this variant of LZ, data is encoded in two types of chunk. 
 * Each chunk begins with a length L, encoded as a single ASCII digit from 1 to 9, followed by the chunk data, which is either:
 * 
 * 1. Exactly L characters, which are to be copied directly into the uncompressed data.
 * 2. A reference to an earlier part of the uncompressed data. 
 *    To do this, the length is followed by a second ASCII digit X: 
 *    each of the L output characters is a copy of the character X places before it in the uncompressed data.
 * 
 * For both chunk types, a length of 0 instead means the chunk ends immediately, and the next character is the start of a new chunk. 
 * The two chunk types alternate, starting with type 1, and the final chunk may be of either type.
 * 
 * You are given the following LZ-encoded string:
 *     47bG4713Gp3498CN05gh22978rO3WJgKt145T2BVv9426G52189876RUrhmn59
 * Decode it and output the original string.
 * 
 * Example: decoding '5aaabb450723abb' chunk-by-chunk
 *     5aaabb           ->  aaabb
 *     5aaabb45         ->  aaabbaaab
 *     5aaabb450        ->  aaabbaaab
 *     5aaabb45072      ->  aaabbaaababababa
 *     5aaabb450723abb  ->  aaabbaaababababaabb
 */

import { NS } from "@ns";

export function main(ns: NS): void {
    ns.tprintf("Expected %s\n     got %s", "aaabbaaababababaabb", decode("5aaabb450723abb"));
    ns.tprintf("Expected %s\n     got %s", "7bG44444444Gp34444CN05gh22N05gh22N0rO3WJgKtJT2BVv2BVv2BVv26G6G6G686G6G6G6866RUrhmn866RU", decode("47bG4713Gp3498CN05gh22978rO3WJgKt145T2BVv9426G52189876RUrhmn59"));
    ns.tprintf("Expected %s\n     got %s", "FXFN4CXFN4CXF2uAUF2uAc4UGgJGg0UQVHAJpc7ptih13RRRRRhdLDRRRhdLdUYRjH2X0XtG0XtG0", decode("6FXFN4C7542uAU456c4UGgJ2390UQVHAJpc087ptih13R414hdLD679dUYRjH2X003XtG54"));
}

export function decode(data:string): string {
    let output = "";
    let isChunkType1 = false;
    let idx = 0;
    while (idx < data.length) {
        isChunkType1 = !isChunkType1;
        if (data[idx] === "0") {
            idx++;
            continue;
        }

        if (isChunkType1) {
            const start = idx + 1;
            const length = parseInt(data[idx]);
            const chunk = data.substring(start, start+length);
            output += chunk;
            idx += length + 1;
        } else {
            const length = parseInt(data[idx]);
            const offset = parseInt(data[idx + 1]);
            const chunk = output.substring(output.length - offset);
            const repeat = Math.ceil(length / offset);
            output += chunk.repeat(repeat).substring(0, length);
            idx += 2;
        }
    }
    return output;
}
