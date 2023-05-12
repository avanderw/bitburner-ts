import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    const reserve = 0;
    ns.stock.getSymbols().forEach(s => {
        const budget = ns.getServerMoneyAvailable("home") - reserve;
        if (budget < 1_000_000) {
            return;
        }

        const price = ns.stock.getPrice(s);
        const [lShares, _, sShares, __] = ns.stock.getPosition(s);
        const data = JSON.parse(ns.read("/stock/data/" + s + ".txt").toString());

        if (lShares > 0 && longExit(data, price)) {
            exitLong(ns, s);
        } else if (sShares > 0 && shortExit(data, price)) {
            exitShort(ns, s);
        }

        if (longEntry(data, price)) {
            enterLong(ns, s, budget);
        } else if (shortEntry(data, price)) {
            enterShort(ns, s, budget);
        }
    });
}

function longExit(data: number[], price:number): boolean {
    const stddev = calcStdDev(data, 64);
    const mean = calcMean(data, 64);
    const takeProfit = mean + stddev * 1;
    const stopLoss = mean - stddev * 4;

    if (price > takeProfit) {
        return true;
    } else if (price < stopLoss) {
        return true;
    } else {
        return false;
    }
}

function exitLong(ns: NS, sym: string): void {
    const [shares, avgPrice] = ns.stock.getPosition(sym);
    const price = ns.stock.sellStock(sym, shares);
    const gain = price * shares;
    const base = avgPrice * shares;
    const profit = (price - avgPrice) * shares;

    ns.printf("\x1b[38;5;%sm%s %5s+ $%8s (%8s shares) [$%9s %5s]\x1b[0m",
        profit > 0 ? 2 : 1,
        new Date().toISOString(),
        sym,
        ns.formatNumber(gain),
        ns.formatNumber(shares),
        ns.formatNumber(profit),
        (profit * 100 / base).toFixed(2));
}

function shortExit(data: number[], price:number): boolean {
    const stddev = calcStdDev(data, 64);
    const mean = calcMean(data, 64);
    const takeProfit = mean - stddev * 1;
    const stopLoss = mean + stddev * 4;

    if (price < takeProfit) {
        return true;
    } else if (price > stopLoss) {
        return true;
    } else {
        return false;
    }
}

function exitShort(ns: NS, sym: string): void {
    const [_, __, shares, avgPrice] = ns.stock.getPosition(sym);
    const price = ns.stock.sellShort(sym, shares);
    const gain = price * shares;
    const base = avgPrice * shares;
    const profit = (avgPrice - price) * shares;
    
    ns.printf("\x1b[38;5;%sm%s %5s- $%8s (%8s shares) [$%9s %5s]\x1b[0m",
        profit > 0 ? 2 : 1,
        new Date().toISOString(),
        sym,
        ns.formatNumber(gain),
        ns.formatNumber(shares),
        ns.formatNumber(profit),
        (profit * 100 / base).toFixed(2));
}

function longEntry(data: number[], price:number): boolean {
    const stddev = calcStdDev(data, 64);
    const mean = calcMean(data, 64);
    const buyPrice = mean - stddev * 2;

    if (price < buyPrice) {
        return true;
    } else {
        return false;
    }
}

function enterLong(ns: NS, sym: string, budget: number): void {
    const [long, _, short, __] = ns.stock.getPosition(sym);
    const amount = Math.min(Math.floor(budget / ns.stock.getAskPrice(sym)), ns.stock.getMaxShares(sym) - short - long);
    const price = ns.stock.buyStock(sym, Math.min(amount, ns.stock.getMaxShares(sym) - short - long));
    const spend = price * amount;

    if (spend > 0) {
        ns.printf("\x1b[38;5;3m%s %5s+ $%8s (%8s shares)\x1b[0m",
            new Date().toISOString(),
            sym,
            ns.formatNumber(spend),
            ns.formatNumber(amount));
    }
}

function shortEntry(data: number[], price:number): boolean {
    const stddev = calcStdDev(data, 64);
    const mean = calcMean(data, 64);
    const buyPrice = mean + stddev * 2;

    if (price > buyPrice) {
        return true;
    } else {
        return false;
    }
}

function enterShort(ns: NS, sym: string, budget: number): void {
    const [long, _, short, __] = ns.stock.getPosition(sym);
    const amount = Math.min(Math.floor(budget / ns.stock.getAskPrice(sym)), ns.stock.getMaxShares(sym) - short - long);
    const price = ns.stock.buyShort(sym, Math.min(amount, ns.stock.getMaxShares(sym) - short - long));
    const spend = price * amount;
    if (spend > 0) {
        ns.printf("\x1b[38;5;3m%s %5s- $%8s (%8s shares)\x1b[0m",
            new Date().toISOString(),
            sym,
            ns.formatNumber(spend),
            ns.formatNumber(amount));
    }
}

function calcMean(data: number[], window: number): number {
    const start = Math.max(0, data.length - window);
    let sum = 0;
    for (let i = data.length - 1; i >= start; i--) {
        sum += data[i];
    }
    return sum / window;
}

function calcStdDev(data: number[], window: number): number {
    const start = Math.max(0, data.length - window);
    const mean = calcMean(data, window);
    let sum = 0;
    for (let i = data.length - 1; i >= start; i--) {
        sum += Math.pow(data[i] - mean, 2);
    }
    return Math.sqrt(sum / window);
}