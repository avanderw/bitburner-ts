import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    const force = ns.flags([["force", false]]).force;
    let total = 0;
    ns.stock.getSymbols().forEach(s => {
        const [lShares, avgLong, sShares, avgShort] = ns.stock.getPosition(s);
        if (lShares > 0) {
            const cost = avgLong * lShares;
            const currPrice = ns.stock.getPrice(s);
            if (currPrice > avgLong || force) {
                const price = ns.stock.sellStock(s, lShares);
                const gain = price * lShares;
                const profit = gain - cost;
                total += profit;
            }
        }

        if (sShares > 0) {
            const cost = avgShort * sShares;
            const currPrice = ns.stock.getPrice(s);
            if (currPrice < avgShort || force) {
                const price = ns.stock.sellShort(s, sShares);
                const gain = price * sShares;
                const profit = cost - gain;
                total += profit;
            }
        }
    });
    ns.tprintf("Total profit: $%s", ns.formatNumber(total));
}