import { NS } from "@ns";

export function main(ns: NS): void {
    ns.disableLog("ALL");
    if (!ns.stock.hasTIXAPIAccess()) {
        ns.tprintf("Stock market is not available.");
        return;
    }

    if (ns.getServerMoneyAvailable("home") < 5_000_000_000) {
        ns.printf("Not enough money to trade.");
        return;
    }

    const stocks = ns.stock.getSymbols().map(s => {
        const [long, avgLong, short, avgShort] = ns.stock.getPosition(s);
        if (long > 0 && short > 0) {
            ns.printf("Long and short positions are not supported.");
            ns.tail();
        }
        return {
            symbol: s,
            price: ns.stock.getPrice(s),
            ask: ns.stock.getAskPrice(s),
            long: long,
            avgLong: avgLong,
            short: short,
            avgShort: avgShort,
            available: ns.stock.getMaxShares(s) - long - short,
            forecast: "NA",
        }
    }).map(s => {
        const data = JSON.parse(ns.read("/stock/data/" + s.symbol + ".txt").toString());
        const ema8 = ema(data, 8)[data.length - 1];
        const ema16 = ema(data, 16)[data.length - 1];
        const ema32 = ema(data, 32)[data.length - 1];
        const ema64 = ema(data, 64)[data.length - 1];
        const rsi18 = rsi(data, 18)[data.length - 1];
        const t1 = ema8 - ema16 > 0 ? "UP" : "DOWN";
        const t2 = ema16 - ema32 > 0 ? "UP" : "DOWN";
        const t3 = ema32 - ema64 > 0 ? "UP" : "DOWN";

        const rsiLow = 30;
        const rsiHigh = 70;
        if (t1 === "UP" && t2 === "UP" && t3 === "UP") {
            if (rsi18 > rsiHigh) {
                s.forecast = "++++";
            } else if (rsi18 < rsiLow) {
                s.forecast = "++";
            } else {
                s.forecast = "+++";
            }
        } else if (t1 === "DOWN" && t2 === "DOWN" && t3 === "DOWN") {
            if (rsi18 < rsiLow) {
                s.forecast = "----";
            } else if (rsi18 > rsiHigh) {
                s.forecast = "--";
            } else {
                s.forecast = "---";
            }
        } else if (t1 === "UP" && t2 === "UP" && t3 === "DOWN") {
            if (rsi18 > rsiHigh) {
                s.forecast = "+++";
            } else if (rsi18 < rsiLow) {
                s.forecast = "+";
            } else {
                s.forecast = "++";
            }
        } else if (t1 === "DOWN" && t2 === "DOWN" && t3 === "UP" && rsi18 < rsiHigh) {
            if (rsi18 < rsiLow) {
                s.forecast = "---";
            } else if (rsi18 > rsiHigh) {
                s.forecast = "-";
            } else {
                s.forecast = "--";
            }
        } else {
            s.forecast = "";
        }
        return s;
    });

    const maxPrice = Math.max(...stocks.map(s => s.price));
    stocks.sort((a, b) => (a.price - b.price) / maxPrice + (b.forecast.length - a.forecast.length) / 4);

    stocks.filter(s => s.forecast.length > 0)
        .filter(s => s.forecast[0] === "+")
        .filter(s => s.short > 0)
        .forEach(s => {
            const gain = ns.stock.getSaleGain(s.symbol, s.short, "Short");
            ns.stock.sellShort(s.symbol, s.short);
            const base = s.avgShort * s.short;
            const profit = gain - base;
            ns.printf("\x1b[38;5;%sm%s %5s- $%8s (%8s shares) [$%9s %5s]\x1b[0m",
                profit > 0 ? 2 : 1,
                new Date().toISOString(),
                s.symbol,
                ns.formatNumber(gain),
                ns.formatNumber(s.short),
                ns.formatNumber(profit),
                (profit * 100 / base).toFixed(2));
        });

    stocks.filter(s => s.forecast.length > 0)
        .filter(s => s.forecast[0] === "-")
        .filter(s => s.long > 0)
        .forEach(s => {
            const gain = ns.stock.getSaleGain(s.symbol, s.long, "Long");
            ns.stock.sellStock(s.symbol, s.long);
            const base = s.avgLong * s.long;
            const profit = gain - base;

            ns.printf("\x1b[38;5;%sm%s %5s+ $%8s (%8s shares) [$%9s %5s]\x1b[0m",
                profit > 0 ? 2 : 1,
                new Date().toISOString(),
                s.symbol,
                ns.formatNumber(gain),
                ns.formatNumber(s.long),
                ns.formatNumber(profit),
                (profit * 100 / base).toFixed(2));
        });

    stocks.filter(s => s.forecast.length > 0)
        .filter(s => s.forecast[0] === "+")
        .filter(s => s.available > 0)
        .forEach(s => {
            const affordable = Math.min(s.available, Math.floor((ns.getServerMoneyAvailable("home") - 100_000) / s.ask));
            if (affordable > 0) {
                const buyPrice = ns.stock.buyStock(s.symbol, affordable);
                const cost = buyPrice * affordable;
                ns.printf("\x1b[38;5;3m%s %5s+ $%8s (%8s shares)\x1b[0m",
                    new Date().toISOString(),
                    s.symbol,
                    ns.formatNumber(cost),
                    ns.formatNumber(affordable));
            }
        });

    stocks.filter(s => s.forecast.length > 0)
        .filter(s => s.forecast[0] === "-")
        .filter(s => s.available > 0)
        .forEach(s => {
            const affordable = Math.min(s.available, Math.floor((ns.getServerMoneyAvailable("home") - 100_000) / s.ask));
            if (affordable > 0) {
                const price = ns.stock.buyShort(s.symbol, affordable);
                const cost = price * affordable;
                ns.printf("\x1b[38;5;3m%s %5s- $%8s (%8s shares)\x1b[0m",
                    new Date().toISOString(),
                    s.symbol,
                    ns.formatNumber(cost),
                    ns.formatNumber(affordable));
            }
        });
}

function rsi(data: number[], period: number): number[] {
    const rsi: number[] = [];
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

function log(ns: NS, message: string) {
    const date = new Date();
    ns.tprintf(`${date.toLocaleDateString()} ${date.toLocaleTimeString()}: ${message}`);
}