export function autocomplete(data: any) {
    return [...data.servers];
}

import { NS } from "@ns";

export async function main(ns: NS) {
    const hackStock:boolean = ns.flags([["stock", false]]).stock as boolean;
    await ns.hack(ns.args[0] as string, { stock: hackStock });
}