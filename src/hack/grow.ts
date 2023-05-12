
/**
 * SHOULD remove servers that are currently being grown
 */
import { NS } from "@ns";

export function autocomplete(data: any) {
    return [...data.servers];
}

const PER_GROW_THREAD = "/hack/grow-thread.js";
const PER_GROW_SECURITY = 0.004;
const PER_WEAKEN_THREAD = "/hack/weaken-thread.js";
const PER_WEAKEN_SECURITY = 0.05;

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    if (ns.args.length === 0) {
        const servers = traverseNet(ns)
            .filter(s => ns.getServerMaxMoney(s) > 0)
            .filter(s => ns.getServerSecurityLevel(s) === ns.getServerMinSecurityLevel(s))
            .filter(s => ns.hasRootAccess(s))
            .filter(s => ns.getServerMoneyAvailable(s) < ns.getServerMaxMoney(s))
            .filter(s => ns.hackAnalyzeChance(s) > 0.75)
            .filter(s => getHackStatus(ns, s) === "idle")
            .map(s => ({
                server: s,
                time: ns.tFormat(ns.getWeakenTime(s)),
                ["take/s"]: ns.hackAnalyzeChance(s) * ns.getServerMaxMoney(s) / ns.getWeakenTime(s) || "0",
            }))
            .sort((a, b) => a["take/s"] as number - (b["take/s"] as number)).reverse()
            .map(s => {
                s["take/s"] = "$" + ns.formatNumber(s["take/s"] as number).padStart(8);
                return s;
            });

        if (servers.length === 0) {
            return;
        }

        ns.printf("Growing...\n"+formatTable(servers));
        const useHome = ns.getServerMaxRam("home") > Math.pow(2, 13);
        for (const s of servers) {
            await grow(ns, s.server, useHome);
        };
    } else {
        for (const s of ns.args) {
            await grow(ns, s as string, true);
        };
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

function freeRAM(ns: NS, host: string): number {
    return ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
}

async function grow(ns: NS, target: string, useHome: boolean) {
    if (ns.getServerMoneyAvailable(target) === ns.getServerMaxMoney(target)) {
        ns.print(`${target} is already fully grown`);
        return;
    }

    while (true) {
        const growMultiplier = Math.min(ns.getServerMaxMoney(target), Math.max(1, ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target)));
        let remainingGrowThreads = Math.ceil(ns.growthAnalyze(target, growMultiplier));

        const hosts = traverseNet(ns)
            .filter(s => s !== "home" || useHome)
            .filter(s => ns.hasRootAccess(s))
            .filter(s => freeRAM(ns, s) > ns.getScriptRam(PER_WEAKEN_THREAD) + ns.getScriptRam(PER_GROW_THREAD))
            .sort((a, b) => freeRAM(ns, a) - freeRAM(ns, b)).reverse();
        for (const host of hosts) {
            const assignGrowThreads = calculateGrowThreads(ns, host, remainingGrowThreads);
            if (assignGrowThreads === 0) {
                continue;
            }
            const requiredWeakenThreads = Math.ceil(assignGrowThreads * PER_GROW_SECURITY / PER_WEAKEN_SECURITY);
            if (host !== "home") {
                ns.scp(PER_WEAKEN_THREAD, host);
                ns.scp(PER_GROW_THREAD, host);
            }
            ns.exec(PER_WEAKEN_THREAD, host, requiredWeakenThreads, target);
            ns.exec(PER_GROW_THREAD, host, assignGrowThreads, target);
            remainingGrowThreads -= assignGrowThreads;
            if (remainingGrowThreads <= 0) {
                break;
            }
        }

        if (remainingGrowThreads > 0) {
            ns.print(`WARN Not enough RAM to grow ${target}`);
            await ns.sleep(ns.getWeakenTime(target) + 500);
        }
        else {
            break;
        }
    }
}

function calculateGrowThreads(ns: NS, host: string, remainingGrowThreads: number): number {
    const PER_WEAKEN_RAM = ns.getScriptRam(PER_WEAKEN_THREAD);
    const PER_GROW_RAM = ns.getScriptRam(PER_GROW_THREAD);

    let assignGrowThreads = remainingGrowThreads;
    while (true) {
        const requiredWeakenThreads = Math.ceil(assignGrowThreads * PER_GROW_SECURITY / PER_WEAKEN_SECURITY);
        const requiredWeakenRam = requiredWeakenThreads * PER_WEAKEN_RAM;
        const requiredGrowRAM = assignGrowThreads * PER_GROW_RAM;
        const totalRequiredRAM = requiredWeakenRam + requiredGrowRAM;
        const freeRam = freeRAM(ns, host);

        if (totalRequiredRAM <= freeRam) {
            return assignGrowThreads;
        } else {
            assignGrowThreads -= 8;
        }

        if (assignGrowThreads <= 0) {
            return 0;
        }
    }
}

// v2023-04-07
function stringLen(str: string): number {
    return str.replaceAll(/%%/g, " ")
        .replaceAll(/\x1b\[38;5;\d+m/g, "")
        .replaceAll(/\x1b\[0m/g, "")
        .length;
}

// v2023-04-07
function formatTable(obj: any[], limit = 0): string {
    if (obj.length === 0) {
        return "";
    }
    const NUMBER_FORMAT = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const colums = Object.keys(obj[0]);
    const rows = obj.map(o => Object.values(o));
    const widths = colums.map((c, i) => Math.max(c.length, Math.max(...rows.map(r => typeof r[i] === 'number'
        ? NUMBER_FORMAT.format(r[i] as number).length
        : stringLen((r[i] as object).toString())))));
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
