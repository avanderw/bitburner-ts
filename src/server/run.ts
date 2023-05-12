/**
 * SHOULD kill scripts no longer required
 */
import {NS} from "@ns";

export async function main(ns: NS): Promise<void> {
    ns.run("/daemon.js", 1, "/server/upgrade.js", 600);
}