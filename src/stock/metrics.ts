import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    const filename = "/stock/metrics.txt";
    const storageSize = 10 * 60 * 24 * 2;

    const time = new Date().getTime();
    const funds = ns.getServerMoneyAvailable("home");
    const portfolioCap = getPortfolioCap(ns);
    const marketCap = getMarketCap(ns);
    const metric = { time: time, funds: funds, portfolioCap: portfolioCap, marketCap: marketCap };
    ns.printf(new Date().toISOString() + " " + JSON.stringify(metric));

    if (!ns.fileExists(filename)) {
        ns.write(filename, JSON.stringify([]), "w");
    }

    const metrics = JSON.parse(ns.read(filename)) as object[];
    metrics.push(metric);
    
    if (metrics.length > storageSize) {
        metrics.shift();
    }
    
    ns.write(filename, JSON.stringify(metrics), "w");
}

function getPortfolioCap(ns: NS): number {
    return ns.stock.getSymbols()
        .map(symbol => {
            const position = ns.stock.getPosition(symbol);
            return {
                symbol: symbol,
                long: position[0],
                avgLong: position[1],
                short: position[2],
                avgShort: position[3]
            }
        }).filter(stock => stock.long > 0)
        .map(stock => stock.long * ns.stock.getPrice(stock.symbol) + stock.short * ns.stock.getPrice(stock.symbol))
        .reduce((a, b) => a + b, 0);
}

function getMarketCap(ns: NS): number {
    return ns.stock.getSymbols()
        .map(symbol => ns.stock.getMaxShares(symbol) * ns.stock.getPrice(symbol))
        .reduce((a, b) => a + b, 0);
}