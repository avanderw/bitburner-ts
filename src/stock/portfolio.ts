import {NS} from "@ns";

import {plot} from "/stock/asciichart";

export async function main(ns: NS): Promise<void> {
    ns.clearLog();
    ns.disableLog("ALL");
    const filename = "/stock/metrics.txt";
    const metrics = JSON.parse(ns.read(filename)) as any[];
    const time = metrics.map(m => m["time"]);
    const funds: number[] = metrics.map(m => m["funds"]);
    const portfolioCap = metrics.map(m => m["portfolioCap"]);
    const marketCap = metrics.map(m => m["marketCap"]);
    
    const series = [];
    series.push(portfolioCap, marketCap);

    ns.printf(plot(series, { height: 20, colors: ["\x1b[38;5;3m", "\x1b[38;6;3m", "\x1b[38;3;3m"], format: (x: number) => ns.formatNumber(x).padStart(8) }));

    // market cap
    // long cap
    // short cap
    // long profit
    // short profit
    // long profit / hour
    // short profit / hour
    // long profit / day
    // short profit / day
}