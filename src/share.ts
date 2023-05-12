import {NS} from "@ns";

export async function main(ns: NS): Promise<void> {
    const server = ns.getServer();
    const scriptRam = ns.getScriptRam("share-daemon.js");
    const freeRam = server.maxRam - server.ramUsed;
    const ratioRam = freeRam * 0.8;
    const threads = Math.round(ratioRam/scriptRam);
    ns.run("share-daemon.js", threads);
    await ns.sleep(1000);
    ns.tprintf("%d share power", ns.getSharePower());
}