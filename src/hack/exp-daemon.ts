/**
 * MUST use all purchased server RAM
 * MUST identify the highest XP server
 */
import { NS } from "@ns";

export function autocomplete(data: any) {
    return [...data.servers];
}

export async function main(ns: NS): Promise<void> {
    if (ns.args.length === 0) {
        const target = traverseNet(ns)
            .filter(s => ns.hasRootAccess(s))
            .filter(s => ns.getServerRequiredHackingLevel(s) > 1000)
            .filter(s => "ecorp" === s)
            .sort((a, b) => ns.getServerRequiredHackingLevel(a) - ns.getServerRequiredHackingLevel(b))
            .reverse()
            .find(s => true);

        if (target) {
            while (true) {
                const free = ns.getServerMaxRam(ns.getHostname()) - ns.getServerUsedRam(ns.getHostname()) - 64;
                const threads = Math.floor(free / ns.getScriptRam("/hack/weaken-thread.js"));
                if (threads > 0) {
                    ns.run("/hack/weaken-thread.js", threads, target);
                }
                await ns.sleep(ns.getWeakenTime(target) + 500)
            }
        }
    }
}

function traverseNet(ns: NS): string[] {
    const process = ["home"];
    const visited: string[] = [];
    while (process.length > 0) {
        const current = process.pop()!;
        const servers = ns.scan(current);
        for (const server of servers) {
            if (!visited.includes(server) && !process.includes(server)) {
                process.push(server);
            }
        }

        visited.push(current);
    }
    return visited;
}
