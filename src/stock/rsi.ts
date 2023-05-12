import { NS } from "@ns";

export function main(ns: NS): void {
    const stocks:any[] = [];
    ns.stock.getSymbols().forEach(s => {
        const filename = "/stock/data/" + s + ".txt";
        if (!ns.fileExists(filename)) {
            ns.write(filename, "[]", "w");
        }

        const data = JSON.parse(ns.read(filename).toString());
        const rsi = calculateRSI(data);
        const signal = RSIsignal(rsi);
        stocks.push({
            symbol: s,
            signal: signal,
            rsi: rsi[rsi.length - 1],
        });
    });

    stocks.sort((a, b) => a.rsi - b.rsi).reverse();
    ns.tprintf("\n"+formatTable(stocks));
}

function calculateRSI(data: number[]): number[] {
    const rsi = [];
    let gain = 0;
    let loss = 0;
    for (let i = 1; i < data.length; i++) {
        const change = data[i] - data[i - 1];
        if (change > 0) {
            gain = (gain * 13 + change) / 14;
            loss = loss * 13 / 14;
        } else {
            gain = gain * 13 / 14;
            loss = (loss * 13 - change) / 14;
        }
        rsi.push(100 - 100 / (1 + gain / loss));
    }
    return rsi;
}

function RSIsignal(rsi: number[]): string {
    const last = rsi[rsi.length - 1];
    const prev = rsi[rsi.length - 2];
    if (last < 70 && prev > 70) {
        return "SELL";
    } else if (last > 30 && prev < 30) {
        return "BUY";
    } else {
        return trend(rsi);
    }
}

function trend(data: number[]): string {
    if (ema(data, 5) > ema(data, 10)) { 
        return "UP";
    } else {
        return "DOWN";
    }
}

function ema(data: number[], period: number): number {
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
        ema = (data[i] - ema) * 2 / (period + 1) + ema;
    }
    return ema;
}

function formatTable(obj: any[]): string {
    const NUMBER_FORMAT = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const colums = Object.keys(obj[0]);
    const rows = obj.map(o => Object.values(o));
    const widths = colums.map((c, i) => Math.max(c.length, Math.max(...rows.map(r => typeof r[i] === 'number' ? NUMBER_FORMAT.format(r[i] as number).length : (r[i] as object).toString().length))));
    const borderTop = widths.map(w => "─".repeat(w)).join("─┬─");
    const header = colums.map((c, i) => c.padEnd(widths[i])).join(" │ ");
    const divider = widths.map(w => "─".repeat(w)).join("─┼─");
    const borderBottom = widths.map(w => "─".repeat(w)).join("─┴─");
    const body = rows.map(
        r => r.map(
            (v, i) => typeof v === 'number' ? NUMBER_FORMAT.format(v).padStart(widths[i]) : (v as object).toString().padEnd(widths[i])
        ).join(" │ ")
    ).join("\n");
    return borderTop + "\n" + header + "\n" + divider + "\n" + body + "\n" + borderBottom;
}