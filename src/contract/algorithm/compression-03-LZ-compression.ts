/**
 * Lempel-Ziv (LZ) compression is a data compression technique which encodes data using references to earlier parts of the data. 
 * In this variant of LZ, data is encoded in two types of chunk. 
 * Each chunk begins with a length L, encoded as a single ASCII digit from 1 to 9, followed by the chunk data, which is either:

1. Exactly L characters, which are to be copied directly into the uncompressed data.
2. A reference to an earlier part of the uncompressed data. 
   To do this, the length is followed by a second ASCII digit X: each of the L output characters is a copy of the 
   character X places before it in the uncompressed data.

For both chunk types, a length of 0 instead means the chunk ends immediately, and the next character is the start of a new chunk. 
The two chunk types alternate, starting with type 1, and the final chunk may be of either type.

You are given the following input string:
    v8jjjjjjjjjjjjjjjjjA1sjA1sjA1sjSjAnSjAAnSjAj6IrnSjAj6Ifmpzblpzblm5zblpzU5zblpzU5ZXsp
Encode it using Lempel-Ziv encoding with the minimum possible output length.

Examples (some have other possible encodings of minimal length):
    abracadabra     ->  7abracad47
    mississippi     ->  4miss433ppi
    aAAaAAaAaAA     ->  3aAA53035
    2718281828      ->  627182844
    abcdefghijk     ->  9abcdefghi02jk
    aaaaaaaaaaaa    ->  3aaa91
    aaaaaaaaaaaaa   ->  1a91031
    aaaaaaaaaaaaaa  ->  1a91041
 */

import { NS } from "@ns";

export function main(ns: NS): void {
    let input = "v8jjjjjjjjjjjjjjjjjA1sjA1sjA1sjSjAnSjAAnSjAj6IrnSjAj6Ifmpzblpzblm5zblpzU5zblpzU5ZXsp";
    let output = encodeLZ(input);
    ns.print(`Expect 'v8jA1sjA1sjA1sjSjAnSjAAnSjAj6IrnSjAj6Ifmpzblpzblm5zblpzU5zblpzU5ZXsp'\n   got '${output}'`);

    input = "abracadabra";
    output = encodeLZ(input);
    ns.print(`Expect '7abracad47'\n   got '${output}'`);

    input = "mississippi";
    output = encodeLZ(input);
    ns.print(`Expect '4miss433ppi'\n   got '${output}'`);

    input = "aAAaAAaAaAA";
    output = encodeLZ(input);
    ns.print(`Expect '3aAA53035'\n   got '${output}'`);

    input = "2718281828";
    output = encodeLZ(input);
    ns.print(`Expect '627182844'\n   got '${output}'`);

    input = "abcdefghijk";
    output = encodeLZ(input);
    ns.print(`Expect '9abcdefghi02jk'\n   got '${output}'`);

    input = "aaaaaaaaaaaa";
    output = encodeLZ(input);
    ns.print(`Expect '3aaa91'\n   got '${output}'`);

    input = "aaaaaaaaaaaaa";
    output = encodeLZ(input);
    ns.print(`Expect '1a91031'\n   got '${output}'`);

    input = "aaaaaaaaaaaaaa";
    output = encodeLZ(input);
    ns.print(`Expect '1a91041'\n   got '${output}'`);
}

function encodeLZ(input: string): string {
    let output = "";
    let isChunkType1 = true;
    if (isChunkType1) {
        
    } else {

    }
    return output;
}