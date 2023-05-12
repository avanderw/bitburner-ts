/**
 * You are given the following array with two elements:
 * 
 * [9, [24,83,96,191,60,104,86,24,87,19,113,146,110,88,149,193,44,111,153,199,190,18,140,170,146,7,116,90,28,92,163,86,136,134,6,60,146,74,77,191,176]]
 * 
 * The first element is an integer k. The second element is an array of stock prices (which are numbers) where the i-th element represents the stock price on day i.
 * 
 * Determine the maximum possible profit you can earn using at most k transactions. A transaction is defined as buying and then selling one share of the stock. Note that you cannot engage in multiple transactions at once. In other words, you must sell the stock before you can buy it again.
 * 
 * If no profit can be made, then the answer should be 0.
 */

import { NS } from "@ns";

export function main(ns: NS): void {
    ns.tprintf("%s", stockTrader04([9, [24,83,96,191,60,104,86,24,87,19,113,146,110,88,149,193,44,111,153,199,190,18,140,170,146,7,116,90,28,92,163,86,136,134,6,60,146,74,77,191,176]]));
}

export function stockTrader04(data:(number|number[])[]) {
    const k = data[0] as number;
    const prices = data[1] as number[];
    const holds = new Array(k + 1).fill(Number.MIN_SAFE_INTEGER);
    const releases = new Array(k + 1).fill(0);

    for (const price of prices) {
        for (let i = 1; i <= k; ++i) {
            releases[i] = Math.max(releases[i], holds[i] + price);
            holds[i] = Math.max(holds[i], releases[i - 1] - price);
            holds[0] = Math.max(holds[0], -price);
        }
    }

    return releases[k];
}