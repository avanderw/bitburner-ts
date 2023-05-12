import { NS } from "@ns";

export function main(ns: NS): void {
    ns.tprintf("%s", totalWaysToSum([192, [1,2,3,4,8,9,11,12]]));
}

export function totalWaysToSum(data:(number|number[])[]):number {
    const n = data[0] as number;
    const set = data[1] as number[];
    let ways = [1];
    ways.length = n + 1;
    ways.fill(0, 1);
    for (const element of set) {
        for (let j = element; j <= n; j++) {
            ways[j] += ways[j - element];
        }
    }
    return ways[n];
}
