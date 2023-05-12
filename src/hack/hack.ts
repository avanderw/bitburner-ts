/**
 * MUST fix limit to account for memory requirements between bitnodes
 */
import { NS } from "@ns";

export function autocomplete(data: any) {
    return [...data.servers];
}

export async function main(ns: NS) {
    ns.clearLog();
    ns.disableLog("ALL");
    if (ns.args.length === 0) {
        const ready = traverseNet(ns)
            .filter(s => ns.getServerSecurityLevel(s) === ns.getServerMinSecurityLevel(s))
            .filter(s => ns.hasRootAccess(s))
            .filter(s => ns.getServerMaxMoney(s) > 0)
            .filter(s => ns.getServerMoneyAvailable(s) === ns.getServerMaxMoney(s))
            .filter(s => ns.hackAnalyzeChance(s) > 0.75)
            .filter(s => getHackStatus(ns, s) === "idle")
            .map(s => ({
                server: s,
                time: ns.tFormat(ns.getWeakenTime(s)),
                ["take/s"]: ns.hackAnalyzeChance(s) * ns.getServerMaxMoney(s) / ns.getWeakenTime(s) || "",
                grow: ns.getServerGrowth(s),
            })).sort((a, b) => a["take/s"] as number - (b["take/s"] as number)).reverse()
            .map(s => {
                s["take/s"] = "$" + ns.formatNumber(s["take/s"] as number).padStart(8);
                return s;
            });

        const hacking = traverseNet(ns)
            .filter(s => ns.hasRootAccess(s))
            .filter(s => getHackStatus(ns, s) === "hacking")
            .map(s => ({
                server: s,
                time: ns.tFormat(ns.getWeakenTime(s)),
                ["take/s"]: ns.hackAnalyzeChance(s) * ns.getServerMaxMoney(s) / (ns.getWeakenTime(s) / 1000) || "",
                grow: ns.getServerGrowth(s),
            })).sort((a, b) => a["take/s"] as number - (b["take/s"] as number)).reverse()
            .map(s => {
                s["take/s"] = "$" + ns.formatNumber(s["take/s"] as number).padStart(8);
                return s;
            });


        const memory = ns.getPurchasedServers().reduce((a, b) => a + ns.getServerMaxRam(b), 0);
        const limit = (ns.getServerMaxRam("home") > 1e6) ? 100:  Math.ceil(memory / 1e3); 
        const startLimit = limit - hacking.length;

        ns.printf(`Hacking...\n${formatTable(hacking)}`);
        ns.printf("Ready...\n" + formatTable(ready));
        ns.printf(`Max Memory: ${ns.formatRam(memory)}`);
        ns.printf(`Hack Limit: ${limit}`);
        const useHome = ns.getServerMaxRam("home") > Math.pow(2, 13);
        if (memory < 2e6) {
            ready.sort((a, b) => a.grow - b.grow).reverse();
        }
        ready.slice(0, startLimit).forEach(async s => {
            hack(ns, s.server, useHome);
            ns.printf(`Hacking ${s.server}...`);
        });
    } else {
        ns.args.forEach(async s => {
            ns.printf(`Hacking ${s}...`);
            hack(ns, s as string, true);
        });
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

function hack(ns: NS, target: string, useHome: boolean) {
    if (ns.getScriptRam("/hack/hack-daemon.js") > ns.getServerMaxRam("home") - ns.getServerUsedRam("home")) {
        ns.printf("WARN Not enough RAM to run hack-daemon.js on home");
        return;
    }
    if (ns.isRunning("/hack/hack-daemon.js", "home", target) || ns.isRunning("/hack/hack-daemon.js", "home", target, "--use-home")) {
        ns.printf("WARN Already hacking " + target);
        return;
    }
    if (useHome) {
        ns.run("/hack/hack-daemon.js", 1, target, "--use-home");
    } else {
        ns.run("/hack/hack-daemon.js", 1, target);
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