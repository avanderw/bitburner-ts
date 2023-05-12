import {NS} from "@ns";

export async function main(ns: NS): Promise<void> {
    ns.gang.getMemberNames().forEach(m => {
        ns.gang.getEquipmentNames().forEach(e => {
            ns.gang.purchaseEquipment(m, e);
        });
    });
}