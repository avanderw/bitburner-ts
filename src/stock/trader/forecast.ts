import { NS } from "@ns";

const RESERVE = 1_000_000;
const MIN_SPEND = 250_000_000;
const FEE = 100_000;

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    if (!ns.stock.hasTIXAPIAccess()) {
        ns.tprint("Stock market is not available.");
        return;
    }

    if (!ns.stock.has4SDataTIXAPI()) {
        ns.tprint("Stock market data is not available.");
        return;
    }

    exitPosition(ns);
    enterPosition(ns);
}

function enterPosition(ns: NS) {
    ns.stock.getSymbols()
        .sort((a, b) => scoreStock(ns, b) - scoreStock(ns, a))
        .forEach(s => {
            if (ns.getServerMoneyAvailable("home") < MIN_SPEND + FEE + RESERVE) {
                return;
            }
            
            const forecast = ns.stock.getForecast(s);
            if (forecast > 0.55) {
                enterLong(ns, s);
            } else if (forecast < 0.45) {
                enterShort(ns, s);
            }
        });
}

function scoreStock(ns: NS, sym: string): number {
    const forecast = ns.stock.getForecast(sym);
    const chance = Math.abs(forecast - 0.5);
    const volatility = ns.stock.getVolatility(sym);

    return chance * volatility;
}

function exitPosition(ns: NS) {
    ns.stock.getSymbols().forEach(s => {
        const [long, _, short, __] = ns.stock.getPosition(s);
        const forecast = ns.stock.getForecast(s);
        if (long > 0 && forecast <= 0.5) {
            exitLong(ns, s);
        } else if (short > 0 && forecast >= 0.5) {
            exitShort(ns, s);
        }
    });
}

function exitLong(ns: NS, sym: string) {
    const [long, avgLong] = ns.stock.getPosition(sym);
    const price = ns.stock.sellStock(sym, long);
    const sale = price * long;
    const cost = avgLong * long;
    const profit = sale - cost;

    ns.printf("\x1b[38;5;%sm%5s📈 $%8s (%s%%)\x1b[0m",
        profit > 0 ? 2 : 1,
        sym,
        ns.formatNumber(sale),
        (profit * 100 / cost).toFixed(2));
}

function exitShort(ns: NS, sym: string) {
    const [_, __, short, avgShort] = ns.stock.getPosition(sym);
    const price = ns.stock.sellShort(sym, short);
    const sale = price * short;
    const cost = avgShort * short;
    const profit = cost - sale;

    ns.printf("\x1b[38;5;%sm%5s📉 $%8s (%s%%)\x1b[0m",
        profit > 0 ? 2 : 1,
        sym,
        ns.formatNumber(sale),
        (profit * 100 / cost).toFixed(2));
}

function enterLong(ns: NS, sym: string) {
    const [long, _, short, __] = ns.stock.getPosition(sym);
    const amount = Math.min(Math.floor((ns.getServerMoneyAvailable("home") - FEE - RESERVE) / ns.stock.getAskPrice(sym)), ns.stock.getMaxShares(sym) - short - long);
    const price = ns.stock.buyStock(sym, Math.min(amount, ns.stock.getMaxShares(sym) - short - long));
    const spend = price * amount;

    if (spend > 0) {
        ns.printf("%5s📈 $%8s",
            sym,
            ns.formatNumber(spend));
    }
}

function enterShort(ns: NS, sym: string) {
    const [long, _, short, __] = ns.stock.getPosition(sym);
    const amount = Math.min(Math.floor((ns.getServerMoneyAvailable("home") - FEE - RESERVE) / ns.stock.getAskPrice(sym)), ns.stock.getMaxShares(sym) - short - long);
    const price = ns.stock.buyShort(sym, Math.min(amount, ns.stock.getMaxShares(sym) - short - long));
    const spend = price * amount;
    if (spend > 0) {
        ns.printf("%5s📉 $%8s",
            sym,
            ns.formatNumber(spend));
    }
}