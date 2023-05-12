import { NS } from "@ns";
import { cyan, magenta, plot, red } from "/stock/asciichart"

export function autocomplete(ns: NS, args: string[]): string[] {
    return ["ECP","MGCP","BLD","CLRK","OMTK","FSIG","KGI","FLCM","STM","DCOMM","HLS","VITA","ICRS","UNV","AERO","OMN","SLRS","GPH","NVMD","WDS","LXO","RHOC","APHE","SYSC","CTK","NTLK","OMGA","FNS","JGN","SGC","CTYS","MDYN","TITN"];
}

export function main(ns: NS): void {
    const stocks:any[] = [];
    for (const symbol of ns.args) {
        stocks.push({sym:symbol.toString()});
       
    }

    const RSI=[];
    const MACD=[];
    const PRICE = [];
    for (const stock of stocks) {
        const handle = "/stock/data/" + stock.sym.toString() + ".txt";
        if (!ns.fileExists(handle)) {
            ns.write(handle, "[]", "w");
        }

        const raw = ns.read(handle).toString();
        const series = JSON.parse(raw);
        PRICE.push(series);

        stock.min = Math.min(...series);
        stock.max = Math.max(...series);
        stock.avg = series.reduce((a:number, b:number) => a + b, 0) / series.length;
        stock.stddev = stddev(series);
        stock.long = ns.stock.getPosition(stock.sym).slice(0, 2);
        stock.short = ns.stock.getPosition(stock.sym).slice(2, 4);

        const rsiSeries = rsi(series);
        RSI.push(rsiSeries);
        stock.rsi = RSIsignal(rsiSeries);

        const macdSeries = macd(series);
        MACD.push(macdSeries);
        stock.macd = MACDsignal(macdSeries);
    }
    
    const currencyFormat = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    const numberFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    ns.tprintf("%s", formatTable(stocks));
    ns.tprintf("HISTORY\n%s", plot(PRICE, { height: 16, colors: [red, magenta, cyan], format: (x: number) => currencyFormat.format(x) }));
    ns.tprintf("MACD\n%s", plot(MACD, { height: 8, colors: [red, magenta, cyan], format: (x: number) => numberFormat.format(x).padStart(8) }));
    ns.tprintf("RSI\n%s", plot(RSI, { height: 8, colors: [red, magenta, cyan], format: (x: number) => numberFormat.format(x).padStart(8) }));
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

function stddev(values: number[]): number {
    const avg = values.reduce((a, b) => a + b) / values.length;
    const squareDiffs = values.map(v => (v - avg) ** 2);
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
}
function rsi(data: number[]): number[] {
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
        return "HOLD";
    }
}
function MACDsignal(macd: number[]): string {
    const last = macd[macd.length - 1];
    const prev = macd[macd.length - 2];
    if (last > 0 && prev < 0) {
        return "BUY";
    } else if (last < 0 && prev > 0) {
        return "SELL";
    } else {
        return "HOLD";
    }
}

function macd(data: number[]): number[] {
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