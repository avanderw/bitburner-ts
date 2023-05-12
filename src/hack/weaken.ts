/** 
 * COULD prevent multiple threads from targeting the same server
 * SHOULD be smarter with weaken times when targeting all servers
 */

import { NS } from "@ns";

export function autocomplete(data: any) {
    return [...data.servers];
}

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    if (ns.args.length === 0) {
        const servers = traverseNet(ns)
            .filter(s => ns.getServerSecurityLevel(s) > ns.getServerMinSecurityLevel(s))
            .filter(s => ns.hasRootAccess(s))
            .filter(s => getHackStatus(ns, s) === "idle")
            .map(s => ({
                server: s,
                time: ns.tFormat(ns.getWeakenTime(s)),
                "take/s": ns.hackAnalyzeChance(s) * ns.getServerMaxMoney(s) / ns.getWeakenTime(s) || "0",
            })).sort((a, b) => a["take/s"] as number - (b["take/s"] as number)).reverse()
            .map(s => {
                s["take/s"] = "$" + ns.formatNumber(s["take/s"] as number).padStart(8);
                return s;
            });

        if (servers.length === 0) {
            return;
        }

        ns.printf("Weakening...\n"+formatTable(servers));
        const useHome = ns.getServerMaxRam("home") > Math.pow(2, 13);
        for (const s of servers) {
            await weaken(ns, s.server, useHome);
        }
    } else {
        for (const s of ns.args) {
            await weaken(ns, s as string, true);
        }
    }
}

// v1.0.0
function getHackStatus(ns: NS, target: string): string {
    let status: string;
    if (ns.isRunning("/hack/hack-daemon.js", "home", target)) {
        status = "hacking";
    } else if (ns.isRunning("/hack/hack-daemon.js", "home", target, "--use-home")) {
        status = "hacking";
    } else if (ns.isRunning("/hack/weaken-thread.js", "home", target)) {
        status = "weakening";
    } else if (ns.isRunning("/hack/weaken-thread.js", "home", target, "--use-home")) {
        status = "weakening";
    } else if (ns.isRunning("/hack/grow-thread.js", "home", target)) {
        status = "growing";
    } else if (ns.isRunning("/hack/grow-thread.js", "home", target, "--use-home")) {
        status = "growing";
    } else {
        status = "idle";
    }
    return status;
}

// v1.0.0
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

// v1.0.0
function freeRAM(ns: NS, host: string): number {
    return ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
}

// v1.0.1
async function weaken(ns: NS, target: string, useHome: boolean) {
    const THREAD = "/hack/weaken-thread.js";

    while (ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target)) {
        const hosts = traverseNet(ns)
            .filter(s => ns.hasRootAccess(s))
            .filter(s => freeRAM(ns, s) !== 0)
            .filter(s => s !== "home" || useHome)
            .sort((a, b) => freeRAM(ns, a) - freeRAM(ns, b)).reverse();
        const threadWeaken = ns.weakenAnalyze(1)
        const threadRAM = ns.getScriptRam(THREAD);
        const serverWeaken = ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target);

        let remainingThreads = Math.ceil(serverWeaken / threadWeaken);
        for (const host of hosts) {
            const remainingRAM = remainingThreads * threadRAM;
            let assignRAM = Math.min(freeRAM(ns, host), remainingRAM);
            let assignThreads = remainingThreads;
            if (assignRAM !== remainingRAM) {
                assignThreads = Math.floor(assignRAM / threadRAM);
            }
            if (assignThreads === 0) {
                continue;
            }

            if (host !== "home") {
                ns.scp(THREAD, host);
            }
            ns.exec(THREAD, host, assignThreads, target);
            remainingThreads -= assignThreads;

            if (remainingThreads === 0) {
                break;
            }
        }

        if (remainingThreads > 0) {
            await ns.sleep(ns.getWeakenTime(target) + 500);
        } else {
            break;
        }
    }
}

// v1.1.0
function formatTable(obj: any[], limit = 0): string {
    if (obj.length === 0) {
        return "";
    }
    const NUMBER_FORMAT = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const colums = Object.keys(obj[0]);
    const rows = obj.map(o => Object.values(o));
    const widths = colums.map((c, i) => Math.max(c.length, Math.max(...rows.map(r => typeof r[i] === 'number'
        ? NUMBER_FORMAT.format(r[i] as number).length
        : (r[i] as object).toString().indexOf("%%") !== -1
            ? (r[i] as object).toString().length - 1
            : (r[i] as object).toString().length))));
    const borderTop = "┌" + widths.map(w => "─".repeat(w)).join("─┬─") + "┐";
    const header = "│" + colums.map((c, i) => c.toUpperCase().padEnd(widths[i])).join(" │ ") + "│";
    const divider = "├" + widths.map(w => "─".repeat(w)).join("─┼─") + "┤";
    const borderBottom = "└" + widths.map(w => "─".repeat(w)).join("─┴─") + "┘";
    const body = rows.slice(limit).map(
        r => "│" + r.map(
            (v, i) => typeof v === 'number' ? NUMBER_FORMAT.format(v).padStart(widths[i]) : (v as object).toString()
                .padStart((v as object).toString().indexOf("%%") !== -1 ? widths[i] + 1 : widths[i])
        ).join(" │ ") + "│"
    ).join("\n");
    const summary = `Showing ${limit === 0 ? rows.length : limit} of ${rows.length} rows`;
    return borderTop + "\n" + header + "\n" + divider + "\n" + body + "\n" + borderBottom + "\n" + summary;
}