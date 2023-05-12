import { NS } from "@ns";

export function main(ns: NS): void {
    ns.stock.getSymbols().forEach(s => {
        const filename = "/stock/data/" + s + ".txt";
        if (ns.fileExists(filename)) {
            ns.rm(filename);
        }
    });
}