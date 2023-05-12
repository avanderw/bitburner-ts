import { NS } from "@ns";

export function main(ns: NS): void {
    if (!ns.stock.hasTIXAPIAccess()) {
        ns.tprintf("Stock market is not available.");
        return;
    }

    ns.stock.getSymbols().forEach(s => {
        const price = ns.stock.getPrice(s);
        const handle = "/stock/data/" + s + ".txt";
        const raw = ns.read(handle).toString();

        let data = (raw.length === 0) ? [] : JSON.parse(raw);
        data.push(price);
        if (data.length > 128) {
            data.shift();
        }

        ns.write(handle, JSON.stringify(data), "w");
    });
}