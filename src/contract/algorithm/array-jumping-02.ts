import { NS } from "@ns";

/** 
 * You are given the following array of integers:
 * 
 * 2,1,4,2,1,5,4,1,3,2,3,0,3,3,2,4,7,3,2
 * 
 * Each element in the array represents your MAXIMUM jump length at that position. 
 * This means that if you are at position i and your maximum jump length is n, you can jump to any position from i to i+n.
 * 
 * Assuming you are initially positioned at the start of the array, determine the minimum number of jumps to reach the end of the array.
 * 
 * If it's impossible to reach the end, then the answer should be 0.
*/

/**
 * 
 * You are given the following array of integers:
 * 
 * 0,3,2,5,2,2,2,3,3,3,4,4,3,2,2,1,4
 * 
 * Each element in the array represents your MAXIMUM jump length at that position. This means that if you are at position i and your maximum jump length is n, you can jump to any position from i to i+n.
 * 
 * Assuming you are initially positioned at the start of the array, determine the minimum number of jumps to reach the end of the array.
 * 
 * If it's impossible to reach the end, then the answer should be 0.
 */

/**
 * 
 * You are given the following array of integers:
 * 
 * 3,2,2,3,2,3,3,4,5,3,2,1
 * 
 * Each element in the array represents your MAXIMUM jump length at that position. This means that if you are at position i and your maximum jump length is n, you can jump to any position from i to i+n.
 * 
 * Assuming you are initially positioned at the start of the array, determine the minimum number of jumps to reach the end of the array.
 * 
 * If it's impossible to reach the end, then the answer should be 0.
 */

export async function main(ns: NS) {
    let data = [2, 1, 4, 2, 1, 5, 4, 1, 3, 2, 3, 0, 3, 3, 2, 4, 7, 3, 2];
    let expect = 6;
    let result = minJumps(data);
    ns.tprintf(`Expect: ${expect}, Result: ${result}`);
    
    data = [0, 3, 2, 5, 2, 2, 2, 3, 3, 3, 4, 4, 3, 2, 2, 1, 4];
    expect = 0;
    result = minJumps(data);
    ns.tprintf(`Expect: ${expect}, Result: ${result}`);

    data = [3, 2, 2, 3, 2, 3, 3, 4, 5, 3, 2, 1];
    expect = 4;
    result = minJumps(data);
    ns.tprintf(`Expect: ${expect}, Result: ${result}`);
}

export function minJumps(data: number[]): number {
    let n = data.length;
    let dp:any[] = [];
    for (let i = 0; i < n; ++i) {
        dp.push(0);
    }
    for (let i = 0; i < n; ++i) {
        if (dp[i] === 0 && i !== 0) {
            continue;
        }
        for (let j = 1; j <= data[i]; ++j) {
            if (i + j < n) {
                dp[i + j] = dp[i+j] !== 0 ? Math.min(dp[i + j], dp[i] + 1) : dp[i] + 1;
            }
        }
    }
    return dp[n-1];
}

