/**
 * Vigenère cipher is a type of polyalphabetic substitution. It uses the Vigenère square to encrypt and decrypt plaintext with a keyword.
 * 
 *   Vigenère square:
 *          A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
 *        +----------------------------------------------------
 *      A | A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
 *      B | B C D E F G H I J K L M N O P Q R S T U V W X Y Z A
 *      C | C D E F G H I J K L M N O P Q R S T U V W X Y Z A B
 *      D | D E F G H I J K L M N O P Q R S T U V W X Y Z A B C
 *      E | E F G H I J K L M N O P Q R S T U V W X Y Z A B C D
 *                 ...
 *      Y | Y Z A B C D E F G H I J K L M N O P Q R S T U V W X
 *      Z | Z A B C D E F G H I J K L M N O P Q R S T U V W X Y
 * 
 * For encryption each letter of the plaintext is paired with the corresponding letter of a repeating keyword. For example, the plaintext DASHBOARD is encrypted with the keyword LINUX:
 *    Plaintext: DASHBOARD
 *    Keyword:   LINUXLINU
 * So, the first letter D is paired with the first letter of the key L. Therefore, row D and column L of the Vigenère square are used to get the first cipher letter O. This must be repeated for the whole ciphertext.
 * 
 * You are given an array with two elements:
 *   ["ENTERLOGICSHIFTINBOXTABLE", "FLOWCHART"]
 * The first element is the plaintext, the second element is the keyword.
 * 
 * Return the ciphertext as uppercase string.
 */
import { NS } from "@ns";

export function main(ns: NS): void {
    const data = ["ENTERLOGICSHIFTINBOXTABLE", "FLOWCHART"];
    const expect = "JYHATSOXBHDVEHAIEUTIHWDSE";
    const actual = vigenereCipher(data);
    
    ns.tprintf("%s Expect: %s, Actual: %s", expect === actual ? "INFO" : "FAIL", expect, actual);
}

const vigenereSquare = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "BCDEFGHIJKLMNOPQRSTUVWXYZA",
    "CDEFGHIJKLMNOPQRSTUVWXYZAB",
    "DEFGHIJKLMNOPQRSTUVWXYZABC",
    "EFGHIJKLMNOPQRSTUVWXYZABCD",
    "FGHIJKLMNOPQRSTUVWXYZABCDE",
    "GHIJKLMNOPQRSTUVWXYZABCDEF",
    "HIJKLMNOPQRSTUVWXYZABCDEFG",
    "IJKLMNOPQRSTUVWXYZABCDEFGH",
    "JKLMNOPQRSTUVWXYZABCDEFGHI",
    "KLMNOPQRSTUVWXYZABCDEFGHIJ",
    "LMNOPQRSTUVWXYZABCDEFGHIJK",
    "MNOPQRSTUVWXYZABCDEFGHIJKL",
    "NOPQRSTUVWXYZABCDEFGHIJKLM",
    "OPQRSTUVWXYZABCDEFGHIJKLMN",
    "PQRSTUVWXYZABCDEFGHIJKLMNO",
    "QRSTUVWXYZABCDEFGHIJKLMNOP",
    "RSTUVWXYZABCDEFGHIJKLMNOPQ",
    "STUVWXYZABCDEFGHIJKLMNOPQR",
    "TUVWXYZABCDEFGHIJKLMNOPQRS",
    "UVWXYZABCDEFGHIJKLMNOPQRST",
    "VWXYZABCDEFGHIJKLMNOPQRSTU",
    "WXYZABCDEFGHIJKLMNOPQRSTUV",
    "XYZABCDEFGHIJKLMNOPQRSTUVW",
    "YZABCDEFGHIJKLMNOPQRSTUVWX",
    "ZABCDEFGHIJKLMNOPQRSTUVWXY",
];

export function vigenereCipher(data:(string|number)[]): string {
    const message:string = data[0] as string;
    const key:string = data[1] as string;
    let ans = "";
    for (let i = 0; i < message.length; i++) {
        let c = message.charCodeAt(i);
        if (c < 65 || c > 90) {
            ans += String.fromCharCode(c);
            continue;
        }
        const row = vigenereSquare[c - 65];
        const col = key.charCodeAt(i % key.length) - 65;
        c = row.charCodeAt(col);
        ans += String.fromCharCode(c);
    }
    return ans;
}