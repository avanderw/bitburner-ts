import { NS } from "@ns";

const ENTER_LONG = 0.55;
const EXIT_LONG = 0.5;
const ENTER_SHORT = 0.45;
const EXIT_SHORT = 0.5;
const PERIOD = 64;
const MIN_SPEND = 1_000_000;

type Stock = {
    sym: string;
    forecast: number;
    long: number;
    avgLong: number;
    short: number;
    avgShort: number;
};

export function main(ns: NS): void {
    if (!ns.stock.hasTIXAPIAccess()) {
        ns.tprint("Stock market is not available.");
        return;
    }

    ns.disableLog("ALL");
    const stocks = ns.stock.getSymbols().map(s => {
        const filename = "/stock/data/" + s + ".txt";
        const data = JSON.parse(ns.read(filename).toString());
        const [long, avgLong, short, avgShort] = ns.stock.getPosition(s);
        return {
            sym: s,
            forecast: ns.stock.has4SDataTIXAPI() ? ns.stock.getForecast(s) : forecast(data, PERIOD),
            long: long,
            avgLong: avgLong,
            short: short,
            avgShort: avgShort
        };
    });

    trade(ns, stocks);
}

function trade(ns: NS, stocks: Stock[]) {
    exitLongs(ns, stocks);
    exitShorts(ns, stocks);
    enterPositions(ns, stocks);
}

function exitLongs(ns: NS, stocks: Stock[]) {
    stocks.filter(s => s.long > 0)
        .filter(s => s.forecast <= EXIT_LONG)
        .forEach(s => {
            const price = ns.stock.sellStock(s.sym, s.long);
            const gain = price * s.long;
            const base = s.avgLong * s.long;
            const profit = (price - s.avgLong) * s.long;

            ns.printf("\x1b[38;5;%sm%s %5s+ $%8s (%8s shares) [$%9s %5s]\x1b[0m",
                profit > 0 ? 2 : 1,
                new Date().toISOString(),
                s.sym,
                ns.formatNumber(gain),
                ns.formatNumber(s.long),
                ns.formatNumber(profit),
                (profit * 100 / base).toFixed(2));
        });
}

function exitShorts(ns: NS, stocks: Stock[]) {
    stocks.filter(s => s.short > 0)
        .filter(s => s.forecast >= EXIT_SHORT)
        .forEach(s => {
            const price = ns.stock.sellShort(s.sym, s.short);
            const gain = price * s.short;
            const base = s.avgShort * s.short;
            const profit = (s.avgShort - price) * s.short;
            ns.printf("\x1b[38;5;%sm%s %5s- $%8s (%8s shares) [$%9s %5s]\x1b[0m",
                profit > 0 ? 2 : 1,
                new Date().toISOString(),
                s.sym,
                ns.formatNumber(gain),
                ns.formatNumber(s.short),
                ns.formatNumber(profit),
                (profit * 100 / base).toFixed(2));
        });
}

function enterPositions(ns: NS, stocks: Stock[]) {
    const longs = stocks.filter(s => s.forecast > ENTER_LONG);
    longs.sort((a, b) => a.forecast - b.forecast);
    longs.reverse();

    const shorts = stocks.filter(s => s.forecast < ENTER_SHORT);
    shorts.sort((a, b) => a.forecast - b.forecast);

    while (ns.getServerMoneyAvailable("home") > MIN_SPEND) {
        if (longs.length === 0 && shorts.length === 0) {
            return;
        }

        if (tradeLong(longs, shorts)) {
            enterLong(ns, longs.shift()!);
        } else {
            enterShort(ns, shorts.shift()!);
        }
    }
}

function enterLong(ns: NS, stock: Stock): number {
    const amount = Math.floor(ns.getServerMoneyAvailable("home") / ns.stock.getAskPrice(stock.sym));
    const price = ns.stock.buyStock(stock.sym, Math.min(amount, ns.stock.getMaxShares(stock.sym) - stock.short - stock.long));
    const spend = price * amount;

    if (spend > 0) {
        ns.printf("\x1b[38;5;3m%s %5s+ $%8s (%8s shares)\x1b[0m", new Date().toISOString(), stock.sym, ns.formatNumber(spend), ns.formatNumber(amount));
    }
    return spend;
}

function enterShort(ns: NS, stock: Stock): number {
    const amount = Math.floor(ns.getServerMoneyAvailable("home") / ns.stock.getAskPrice(stock.sym));
    const price = ns.stock.buyShort(stock.sym, Math.min(amount, ns.stock.getMaxShares(stock.sym) - stock.short - stock.long));
    const spend = price * amount;
    if (spend > 0) {
        ns.printf("\x1b[38;5;3m%s %5s- $%8s (%8s shares)\x1b[0m", new Date().toISOString(), stock.sym, ns.formatNumber(spend), ns.formatNumber(amount));
    }
    return spend;
}


function tradeLong(longs: Stock[], shorts: Stock[]): boolean {
    if (longs.length === 0) {
        return false;
    }

    if (shorts.length === 0) {
        return true;
    }

    return longs[0].forecast > 1 - shorts[0].forecast;
}

function forecast(data: number[], period: number): number {
    if (data.length < 2) {
        return 0.5;
    }

    const working = data.slice(Math.max(0, data.length - period));
    let gain = 0;
    let loss = 0;
    for (let i = 1; i < working.length; i++) {
        const change = working[i] - working[i - 1];
        if (change > 0) {
            gain++;
        } else {
            loss++;
        }
    }

    return gain / (gain + loss);
}
