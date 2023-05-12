import {NS} from "@ns";

export async function main(ns: NS): Promise<void> {
    let totalCost = 0;
    let totalProfit = 0;
    let totalWorth = 0;
    ns.stock.getSymbols().forEach(s => {
        const [lShares, avgLong, sShares, avgShort] = ns.stock.getPosition(s);
        totalCost += avgLong * lShares + avgShort * sShares;
        const price = ns.stock.getPrice(s);
        if (lShares > 0) {
            const cost = avgLong * lShares;
            const sale = price * lShares;
            const profit = sale - cost;
            totalProfit += profit;
            totalWorth += cost + profit;
        }

        if (sShares > 0) {
            const cost = avgShort * sShares;
            const sale = price * sShares;
            const profit = cost - sale;
            totalProfit += profit;
            totalWorth += cost + profit;
        }
    });

    ns.printf("\x1b[38;5;15m%s \x1b[38;5;%sm$ %s/%s (%s%%)\x1b[0m", 
        new Date().toISOString(),
        totalProfit === 0 ? 3 : totalProfit > 0 ? 2 : 1,
        ns.formatNumber(totalWorth),
        ns.formatNumber(totalCost),
        (totalProfit * 100 / totalCost).toFixed(2));
}