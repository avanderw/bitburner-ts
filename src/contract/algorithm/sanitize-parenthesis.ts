/**
 * Given the following string:

(()a)a()()((a()aa((

remove the minimum number of invalid parentheses in order to validate the string. If there are multiple minimal ways to validate the string, provide all of the possible results. The answer should be provided as an array of strings. If it is impossible to validate the string the result should be an array with only an empty string.

IMPORTANT: The string may contain letters, not just parentheses. Examples:
"()())()" -> [()()(), (())()]
"(a)())()" -> [(a)()(), (a())()]
")(" -> [""]
 */

import { NS } from "@ns";

export function main(ns: NS): void {
    let input = '()())()';
    let result = sanitizeParenthesis(input);
    ns.print(`Expect '[()()(),(())()]'\n   got '[${result}]'`);

    input = '(a)())()';
    result = sanitizeParenthesis(input);
    ns.print(`Expect '[(a)()(),(a())()]'\n   got '[${result}]'`);

    input = ')(';
    result = sanitizeParenthesis(input);
    ns.print(`Expect '[""]'\n   got '[${result}]'`);

    input = '(()a)a()()((a()aa((';
    result = sanitizeParenthesis(input);
    ns.print(`Expect ''\n   got '[${result}]'`);
}

export function sanitizeParenthesis(input: string): string[] {
    let result: string[] = [];
    let left = 0;
    let right = 0;
    for (const element of input) {
        if (element == '(') {
            left++;
        } else if (element == ')') {
            if (left > 0) {
                left--;
            } else {
                right++;
            }
        }
    }
    sanitizeParenthesisRecursive(input, 0, left, right, result);
    return result;
}

function sanitizeParenthesisRecursive(input: string, start: number, left: number, right: number, result: string[]): void {
    if (left == 0 && right == 0) {
        if (isValid(input)) {
            result.push(input);
        }
        return;
    }
    for (let i = start; i < input.length; i++) {
        if (i > start && input[i] == input[i - 1]) {
            continue;
        }
        if (input[i] == '(' || input[i] == ')') {
            let newInput = input.substring(0, i) + input.substring(i + 1);
            if (right > 0 && input[i] == ')') {
                sanitizeParenthesisRecursive(newInput, i, left, right - 1, result);
            } else if (left > 0 && input[i] == '(') {
                sanitizeParenthesisRecursive(newInput, i, left - 1, right, result);
            }
        }
    }
}

function isValid(input: string): boolean {
    let count = 0;
    for (const element of input) {
        if (element == '(') {
            count++;
        } else if (element == ')') {
            count--;
        }
        if (count < 0) {
            return false;
        }
    }
    return count == 0;
}
