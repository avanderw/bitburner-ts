import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    if (ns.gang.inGang() === true) {
        ns.run("/gang/reset.js", 1);
        ns.tail(ns.run("/daemon.js", 1, "/gang/manage.js", 120));
    }
}