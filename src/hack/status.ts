/**
 * MUST change ordering to include grow
 */
import { NS } from "@ns";

export function autocomplete(data: any) {
    return [...data.servers];
}

export function main(ns: NS): void {
    const pctFormat = (n: number) => (n * 100).toFixed(1).padStart(5) + "%%";
    const ms2MinSec = (n: number) => {
        const s = Math.floor(n / 1000);
        const m = Math.floor(s / 60);
        return `${m}m${(s % 60).toString().padStart(2, "0")}s`.padStart(6);
    }
    if (ns.args.length > 0) {
        const servers = [];
        for (const server of ns.args) {
            servers.push({
                server: server,
                action: nextAction(ns, server as string),
                take: ns.hackAnalyzeChance(server as string) * ns.getServerMaxMoney(server as string),
            });
        }

        ns.tprintf("\n"+formatTable(servers));
    } else {
        const s: any[] = traverseNet(ns)
            .filter(s => ns.getServerMaxMoney(s) !== 0)
            .filter(s => ns.hasRootAccess(s))
            .map(s => {
                const ps = ns.ps("home").filter(p => p.filename === "/hack/hack-daemon.js").filter(p => p.args[0] === s);
                const take = ns.hackAnalyzeChance(s) * ns.getServerMaxMoney(s) / ns.getWeakenTime(s) * 1000;
                const profit = ps.map(p => ns.getScriptIncome(p.filename, "home", ...p.args)).reduce((a, b) => a + b, 0);
                return {
                    "host": s,
                    "action": nextAction(ns, s),
                    "chance": pctFormat(ns.hackAnalyzeChance(s)),
                    "take": ns.hackAnalyzeChance(s) * ns.getServerMaxMoney(s),
                    "time": ms2MinSec(ns.getWeakenTime(s)),
                    "takePerSec": take,
                    "hacking": ps.length+"x",
                    "profitPerSec": profit,
                    "efficiency": pctFormat(profit / take)
                }
            })
            .sort((a, b) => a.takePerSec - b.takePerSec);
        ns.tprintf("\n"+formatTable(s.filter(s => s.action === "weaken")));
        ns.tprintf("\n"+formatTable(s.filter(s => s.action === "grow")));
        ns.tprintf("\n"+formatTable(s.filter(s => s.action === "hack")));
    }
}

function nextAction(ns: NS, s: string): string {
    if (!ns.hasRootAccess(s)) {
        return "root";
    } else if (ns.getServerMinSecurityLevel(s) !== ns.getServerSecurityLevel(s)) {
        return "weaken";
    } else if (ns.getServerMoneyAvailable(s) < ns.getServerMaxMoney(s)) {
        return "grow";
    } else if (ns.getServerMaxMoney(s) === ns.getServerMoneyAvailable(s) && ns.getServerMinSecurityLevel(s) === ns.getServerSecurityLevel(s)) {
        return "hack";
    }

    return "error";
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

function formatTable(obj: any[], limit = 0): string {
    if (obj.length === 0) {
        return "";
    }
    const NUMBER_FORMAT = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const colums = Object.keys(obj[0]);
    const rows = obj.map(o => Object.values(o));
    const widths = colums.map((c, i) => Math.max(c.length, Math.max(...rows.map(r => typeof r[i] === 'number'
        ? NUMBER_FORMAT.format(r[i] as number).length
        : (r[i] as object).toString().indexOf("%") !== -1
            ? (r[i] as object).toString().length - 1
            : (r[i] as object).toString().length))));
    const borderTop = widths.map(w => "─".repeat(w)).join("─┬─");
    const header = colums.map((c, i) => c.padEnd(widths[i])).join(" │ ");
    const divider = widths.map(w => "─".repeat(w)).join("─┼─");
    const borderBottom = widths.map(w => "─".repeat(w)).join("─┴─");
    const body = rows.slice(limit).map(
        r => r.map(
            (v, i) => typeof v === 'number' ? NUMBER_FORMAT.format(v).padStart(widths[i]) : (v as object).toString().padEnd(widths[i])
        ).join(" │ ")
    ).join("\n");
    const summary = `Showing ${limit === 0 ? rows.length : limit} of ${rows.length} rows`;
    return borderTop + "\n" + header + "\n" + divider + "\n" + body + "\n" + borderBottom + "\n" + summary;
}