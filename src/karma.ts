import {NS} from "@ns";

export async function main(ns: NS): Promise<void> {
    // @ts-ignore
    ns.tprint(ns.formatNumber(ns.heart.break()));
}