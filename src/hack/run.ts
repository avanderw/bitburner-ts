/**
 * SHOULD not start root if all servers rooted
 * SHOULD kill scripts that are no longer required
 * COULD stagger the start of the scripts
 * COULD collapse the scripts into one
 */
import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    ns.run("/daemon.js", 1, "/hack/root.js", 600);
    ns.run("/daemon.js", 1, "/hack/weaken.js", 60);
    ns.run("/daemon.js", 1, "/hack/grow.js", 60);
    ns.tail(ns.run("/daemon.js", 1, "/hack/hack.js", 60, "--clear"));
}