/**
 * SHOULD have a run for stock
 */
import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    ns.run("/gang/run.js", 1);
    ns.run("/hack/run.js", 1);
    ns.run("/server/run.js", 1);
    ns.run("/contract/complete.js", 60);

    if (ns.stock.has4SDataTIXAPI() && ns.getServerMoneyAvailable("home") > 1e12) {
        ns.tail(ns.run("/daemon.js", 1, "/stock/trader/forecast.js", 6, "--no-warning"));
    }
}