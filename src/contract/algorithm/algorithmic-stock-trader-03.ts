import { NS } from "@ns";

export function main(ns: NS): void {
    ns.tprintf("%s", stockTrader03([196,8,175,130,128,120,43,151,8,133,163,50,71,115,6,158,194,82,98,171]));
}

export function stockTrader03(data:number[]) {
    let hold1 = Number.MIN_SAFE_INTEGER;
    let hold2 = Number.MIN_SAFE_INTEGER;
    let release1 = 0;
    let release2 = 0;
    for (const price of data) {
        release2 = Math.max(release2, hold2 + price);
        hold2 = Math.max(hold2, release1 - price);
        release1 = Math.max(release1, hold1 + price);
        hold1 = Math.max(hold1, -price);
    }
    return release2;
}