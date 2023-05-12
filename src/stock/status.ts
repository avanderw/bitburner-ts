/**
 * MUST purchase the TIX API before running this script.
 */

import { NS } from "@ns";

export function main(ns: NS): void {
    if (!ns.stock.hasTIXAPIAccess()) {
        ns.tprintf("Stock market is not available.");
        return;
    }

    const stocks = ns.stock.getSymbols().map(s => ({
        symbol: s,
        price: ns.stock.getPrice(s),
        spread: ns.stock.getAskPrice(s) - ns.stock.getBidPrice(s),
        ema8: 0,
        ema16: 0,
        ema32: 0,
        ema64: 0,
        macd: 0,
        rsi: 0, 
        t1: "NA",
        t2: "NA",
        t3: "NA",
    })).map(s => {
        const data = JSON.parse(ns.read("/stock/data/" + s.symbol + ".txt").toString());
        s.ema8 = ema(data, 8)[data.length - 1];
        s.ema16 = ema(data, 16)[data.length - 1];
        s.ema32 = ema(data, 32)[data.length - 1];
        s.ema64 = ema(data, 64)[data.length - 1];
        s.macd = macd(data, 16, 32, 9);
        s.rsi = rsi(data, 18)[data.length - 1];
        s.t1 = s.ema8 - s.ema16 > 0 ? "UP" : "DOWN";
        s.t2 = s.ema16 - s.ema32 > 0 ? "UP" : "DOWN";
        s.t3 = s.ema32 - s.ema64 > 0 ? "UP" : "DOWN";
        return s;
    });

    ns.tprintf("\n"+formatTable(stocks));
}

function ema(data: number[], period: number): number[] {
    const ema = [];
    let emaPrev = 0;
    for (const element of data) {
        const emaCurr = (element - emaPrev) * 2 / (period + 1) + emaPrev;
        ema.push(emaCurr);
        emaPrev = emaCurr;
    }
    return ema;
}

function macd(data: number[], shortPeriod: number, longPeriod: number, signalPeriod: number): number {
    const shortEma = ema(data, shortPeriod);
    const longEma = ema(data, longPeriod);
    const macd = shortEma.map((v, i) => v - longEma[i]);
    const signal = ema(macd, signalPeriod);
    return macd[macd.length - 1] - signal[signal.length - 1];
}

function rsi(data: number[], period: number): number[] {
    const rsi:number[] = [];
    if (data.length < period) {
        return rsi;
    }
    
    for (let i = 0; i < period; i++) {
        rsi.push(-1);
    }

    let [avgGain, avgLoss] = avgMoves(data.slice(0, period));
    for (let i = 1; i < data.length; i++) {
        const gain = Math.max(0, data[i] - data[i - 1]);
        const loss = Math.max(0, data[i - 1] - data[i]);
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        rsi.push(100 - 100 / (1 + avgGain / avgLoss));
    }
    return rsi;
}

function avgMoves(data: number[]): [number, number] {
    let avgGain = 0;
    let avgLoss = 0;
    for (let i = 1; i < data.length; i++) {
        const gain = Math.max(0, data[i] - data[i - 1]);
        const loss = Math.max(0, data[i - 1] - data[i]);
        avgGain += gain;
        avgLoss += loss;
    }
    return [avgGain / data.length, avgLoss / data.length];
}

function formatTable(obj: any[], limit = 0): string {
    if (obj.length === 0) {
        return "";
    }
    const NUMBER_FORMAT = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const colums = Object.keys(obj[0]);
    const rows = obj.map(o => Object.values(o));
    const widths = colums.map((c, i) => Math.max(c.length, Math.max(...rows.map(r => typeof r[i] === 'number'
        ? NUMBER_FORMAT.format(r[i] as number).length
        : (r[i] as object).toString().indexOf("%%") !== -1
            ? (r[i] as object).toString().length - 1
            : (r[i] as object).toString().length))));
    const borderTop = "┌"+widths.map(w => "─".repeat(w)).join("─┬─") + "┐";
    const header = "│"+colums.map((c, i) => c.padEnd(widths[i])).join(" │ ") + "│";
    const divider = "├"+widths.map(w => "─".repeat(w)).join("─┼─") + "┤";
    const borderBottom = "└"+widths.map(w => "─".repeat(w)).join("─┴─") + "┘";
    const body = rows.slice(limit).map(
        r => "│"+r.map(
            (v, i) => typeof v === 'number' ? NUMBER_FORMAT.format(v).padStart(widths[i]) : (v as object).toString()
                .padStart((v as object).toString().indexOf("%%") !== -1 ? widths[i] + 1 : widths[i])
        ).join(" │ ") + "│"
    ).join("\n");
    const summary = `Showing ${limit === 0 ? rows.length : limit} of ${rows.length} rows`;
    return borderTop + "\n" + header + "\n" + divider + "\n" + body + "\n" + borderBottom + "\n" + summary;
}