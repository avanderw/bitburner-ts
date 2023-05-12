export function autocomplete(data: any) {
    return [...data.servers];
}

import { NS } from "@ns";

export async function main(ns: NS) {
    const growStock: boolean = ns.flags([["stock", false]]).stock as boolean;
    await ns.grow(ns.args[0] as string, { stock: growStock });
}