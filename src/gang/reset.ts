import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    ns.gang.getMemberNames().forEach(m => {
        ns.gang.setMemberTask(m, "Train Combat");
    });
}