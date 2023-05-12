import { NS } from "@ns";

export function main(ns: NS): void {
    if (ns.args.length === 0) {
        ns.tprint("Usage: deploy <script>");
        return;
    }

    const script = ns.args[0] as string;
    ns.getPurchasedServers().forEach(s => {
        ns.scp(script, s);
        if (ns.isRunning(script, s)) {
            ns.kill(script, s);
        }
        ns.exec(script, s);
    });
}