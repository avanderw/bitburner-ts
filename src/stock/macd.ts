import { NS } from "@ns";

export function main(ns: NS): void {
    const stocks:any[] = [];
    ns.stock.getSymbols().forEach(s => {
        const filename = "/stock/data/" + s + ".txt";
        if (!ns.fileExists(filename)) {
            ns.write(filename, "[]", "w");
        }

        const data = JSON.parse(ns.read(filename).toString());
        const macd = calculateMACD(data);
        const signal = MACDsignal(macd);
        stocks.push({
            symbol: s,
            signal: signal,
            macd: macd[macd.length - 1],
        });
    });
    ns.tprintf("\n"+formatTable(stocks.sort((a, b) => a.macd - b.macd).reverse()));
}

function MACDsignal(macd: number[]): string {
    const last = macd[macd.length - 1];
    const prev = macd[macd.length - 2];
    if (last > 0 && prev < 0) {
        return "BUY";
    } else if (last < 0 && prev > 0) {
        return "SELL";
    } else {
        return trend(macd);
    }
}

function calculateMACD(data: number[]): number[] {
    const EMA12 = calculateEMA(data, 12);
    const EMA26 = calculateEMA(data, 26);
    const MACD = EMA12.map((v, i) => v - EMA26[i]);
    const signal = calculateEMA(MACD, 9);
    const histogram = MACD.map((v, i) => v - signal[i]);
    return histogram;
}

function calculateEMA(data: number[], period: number): number[] {
    const alpha = 2 / (period + 1);
    const ema = [];
    let emaPrev = 0;
    for (const element of data) {
        const emaCurr = (element - emaPrev) * alpha + emaPrev;
        ema.push(emaCurr);
        emaPrev = emaCurr;
    }
    return ema;
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