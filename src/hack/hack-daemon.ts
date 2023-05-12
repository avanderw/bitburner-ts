/**
 * MUST dynamically convert to batch schedules when memory allows it
 * MUST Handle weaken times less than a minute
 */
import { NS } from "@ns";

export function autocomplete(data: any) {
    return [...data.servers];
}

export async function main(ns: NS) {
    ns.disableLog("ALL");
    if (ns.args.length === 0) {
        ns.tprintf("Usage: hack-daemon <target>");
        return;
    }

    const target = ns.args[0] as string;
    const useHome = ns.flags([['use-home', false]])['use-home'] as boolean;
    const WEAKEN = "/hack/weaken-thread.js";
    const HACK = "/hack/hack-thread.js";
    const GROW = "/hack/grow-thread.js";
    const PER_WEAKEN_SECURITY = 0.05;
    const PER_GROW_SECURITY = 0.004;

    let targetRatio = 0.32;
    

    let last = "\x1b[38;5;3mStarting\x1b[0m";
    while (true) {
        ns.clearLog();

        const hackThreads = Math.max(1, Math.ceil(ns.hackAnalyzeThreads(target, ns.getServerMaxMoney(target) * targetRatio)));
        const hackMoney = ns.getServerMoneyAvailable(target) * targetRatio;
        const hackSecurityEffect = ns.hackAnalyzeSecurity(hackThreads, target);
        const hackWeakenThreads = Math.ceil(hackSecurityEffect / PER_WEAKEN_SECURITY);
    
        const growMultiplier = ns.getServerMaxMoney(target) / (ns.getServerMoneyAvailable(target) - hackMoney);
        const growThreads = Math.ceil(ns.growthAnalyze(target, growMultiplier));
        const growSecurity = PER_GROW_SECURITY * growThreads;
        const growWeakenThreads = Math.ceil(growSecurity / PER_WEAKEN_SECURITY);
        const s = ns.getServer(target);
        s.moneyAvailable = s.moneyMax - hackMoney;
        const growPercent = ns.formulas.hacking.growPercent(s, growThreads, ns.getPlayer());

        const maxMoney = ns.getServerMaxMoney(target);
        const currMoney = ns.getServerMoneyAvailable(target);
        const minSec = ns.getServerMinSecurityLevel(target);
        const currSec = ns.getServerSecurityLevel(target);
        const delay = 500;

        const hackWeakenEnd = ns.getWeakenTime(target);
        const hackEnd = hackWeakenEnd - delay;
        const growEnd = hackWeakenEnd + delay;
        const growWeakenEnd = growEnd + delay;
        const batchEnd = growWeakenEnd + delay;

        const hackStart = hackEnd - ns.getHackTime(target);
        const growStart = growEnd - ns.getGrowTime(target);
        const growWeakenStart = growWeakenEnd - ns.getWeakenTime(target);

        ns.printf("\n" + formatBox(formatForm({
            "Hack Weaken": ns.tFormat(hackWeakenEnd),
            "Hack": ns.tFormat(hackEnd),
            "Grow": ns.tFormat(growEnd),
            "Grow Weaken": ns.tFormat(growWeakenEnd),
            "Batch End": ns.tFormat(batchEnd),
        }), "Batch"));
        
        ns.printf("\n" + formatBox(formatForm({
            "Hack Threads": hackThreads,
            "Hack Security": hackSecurityEffect,
            "Hack Weaken Threads": hackWeakenThreads,
            "Grow Multiplier": ns.formatNumber(growMultiplier),
            "Grow Percent": ns.formatNumber(growPercent),
            "Grow Threads": growThreads,
            "Grow Security": ns.formatNumber(growSecurity),
            "Grow Weaken Threads": growWeakenThreads,
            "Total RAM": ns.formatRam(hackThreads * ns.getScriptRam(HACK) +
                growThreads * ns.getScriptRam(GROW) +
                hackWeakenThreads * ns.getScriptRam(WEAKEN) +
                growWeakenThreads * ns.getScriptRam(WEAKEN)),
        }), "Debug"));

        ns.printf("\n" + formatBox(formatForm({
            "Target": target,
            "Max Money": "$" + ns.formatNumber(maxMoney),
            "Current Money": (currMoney < maxMoney ? '\x1b[38;5;3m' : '\x1b[38;5;2m') + "$" + ns.formatNumber(currMoney) + "\x1b[0m",
            "Min Security": ns.formatNumber(minSec),
            "Current Security": (currSec > minSec ? '\x1b[38;5;3m' : '\x1b[38;5;2m') + ns.formatNumber(currSec) + "\x1b[0m",
            "Growth Modifier": ns.getServerGrowth(target),
        }), "Target"));

        ns.printf("\n" + formatBox(formatForm({
            "Hack Status": last,
            "Target Ratio": (targetRatio > 0.8
                ? "\x1b[38;5;2m"
                : targetRatio < 0.2
                    ? "\x1b[38;5;1m"
                    : "\x1b[38;5;3m") + ns.formatPercent(targetRatio) + "%\x1b[0m",
            "Hack Money": "$" + ns.formatNumber(hackMoney),
            "Weaken Time": ns.tFormat(ns.getWeakenTime(target)),
            "Potential/s": "$" + ns.formatNumber(hackMoney / ((ns.getWeakenTime(target) + delay) / 1000)),
        }), "Hack"));

        let elapsed = 0;
        let start = new Date().getTime();
        let outstanding = fire(ns, WEAKEN, target, hackWeakenThreads, useHome);
        if (outstanding > 0) {
            await ns.sleep(batchEnd - elapsed);
            last = "\x1b[38;5;1mWeaken Hack Failed\x1b[0m";
            targetRatio = decreaseRatio(targetRatio);
            continue;
        }

        await ns.sleep(growWeakenStart - elapsed);
        elapsed = new Date().getTime() - start;
        outstanding = fire(ns, WEAKEN, target, growWeakenThreads, useHome)
        if (outstanding > 0) {
            await ns.sleep(batchEnd - elapsed);
            last = "\x1b[38;5;1mWeaken Grow Failed\x1b[0m";
            targetRatio = decreaseRatio(targetRatio);
            continue;
        }

        await ns.sleep(growStart - elapsed);
        elapsed = new Date().getTime() - start;
        outstanding = fire(ns, GROW, target, growThreads, useHome, growStock(ns, toStock(ns, target)));
        if (outstanding > 0) {
            await ns.sleep(batchEnd - elapsed);
            last = "\x1b[38;5;3mGrow Failed\x1b[0m";
            targetRatio = decreaseRatio(targetRatio);
            continue;
        }

        await ns.sleep(hackStart - elapsed);
        elapsed = new Date().getTime() - start;
        outstanding = fire(ns, HACK, target, hackThreads, useHome, hackStock(ns, toStock(ns, target)));
        await ns.sleep(batchEnd - elapsed);
        if (outstanding > 0) {
            last = "\x1b[38;5;3mHack Failed\x1b[0m";
            targetRatio = decreaseRatio(targetRatio);
        } else {
            last = "\x1b[38;5;2mHack Success\x1b[0m";
            targetRatio = increaseRatio(targetRatio);
        }
    }
}

function decreaseRatio(ratio: number): number {
    return Math.max(0.01, ratio - 0.02);
}

function increaseRatio(ratio: number): number {
    return Math.min(0.95, ratio + 0.02);
}

function fire(ns: NS, script: string, target: string, threads: number, useHome: boolean, stock: boolean = false): number {
    if (threads <= 0) {
        ns.printf("ERROR No threads to fire");
        ns.tail();
        ns.exit();
    }

    let remainingGrowThreads = threads;
    traverseNet(ns)
        .filter(s => ns.hasRootAccess(s))
        .filter(s => freeRAM(ns, s) > ns.getScriptRam(script))
        .filter(s => useHome || s !== "home")
        .sort((a, b) => freeRAM(ns, a) - freeRAM(ns, b)).reverse()
        .forEach(s => {
            if (remainingGrowThreads <= 0) {
                return;
            }
            const assignThreads = Math.min(remainingGrowThreads, Math.floor(freeRAM(ns, s) / ns.getScriptRam(script)));
            ns.scp(script, s);
            if (stock) {
                ns.exec(script, s, assignThreads, target, `--stock`, uuidv4());
            } else {
                ns.exec(script, s, assignThreads, target, uuidv4());
            }

            remainingGrowThreads -= assignThreads;
        });

    if (remainingGrowThreads > 0) {
        ns.printf(`\x1b[38;5;1mNot enough RAM\x1b[0m`);
        ns.printf(`${script}`);
        ns.printf(`${remainingGrowThreads} threads`);
    }
    return remainingGrowThreads;
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

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16).substring(0, 13);
    });
}

function toStock(ns: NS, server: string): string | undefined {
    return ns.stock.getSymbols().find(s => ns.stock.getOrganization(s) === ns.getServer(server).organizationName);
}

function hackStock(ns: NS, sym: string | undefined): boolean {
    if (!ns.stock.getSymbols().some(s => s === sym)) {
        return false;
    }

    if (ns.stock.has4SDataTIXAPI() && sym) {
        return ns.stock.getForecast(sym) < 0.5;
    }
    
    return false; // consider alternative to 4S
}

function growStock(ns: NS, sym: string | undefined): boolean {
    if (!ns.stock.getSymbols().some(s => s === sym)) {
        return false;
    }

    if (ns.stock.has4SDataTIXAPI() && sym) {
        return ns.stock.getForecast(sym) > 0.5;
    }

    return false; // consider alternative to 4S
}


// v2023-04-13
function formatColum(left: string, right: string) {
    let result = "";
    const leftLines = left.split("\n");
    const rightLines = right.split("\n");
    const maxLeftLen = Math.max(...leftLines.map(l => stringLen(l)));
    const maxRightLen = Math.max(...rightLines.map(l => stringLen(l)));
    for (let i = 0; i < Math.max(leftLines.length, rightLines.length); i++) {
        if (rightLines[i] === undefined) {
            result = result + leftLines[i].padEnd(maxLeftLen) + "\n";
            continue;
        }

        if (leftLines[i] === undefined) {
            result = result + "".padStart(maxLeftLen + 1) + rightLines[i].padEnd(maxRightLen) + "\n";
            continue;
        }

        result = result + leftLines[i].padEnd(maxLeftLen) + " " + rightLines[i].padEnd(maxRightLen) + "\n";
    }
    return result;
}

// v2023-04-07
function stringLen(str: string): number {
    return str.replaceAll(/%%/g, " ")
        .replaceAll(/\x1b\[38;5;\d+m/g, "")
        .replaceAll(/\x1b\[0m/g, "")
        .length;
}

// v2023-04-13
function formatForm(obj: { [key: string]: any }) {
    const maxLabel = Math.max(...Object.keys(obj).map(k => stringLen(k)));
    const maxVal = Math.max(...Object.values(obj).map(v => stringLen(v.toString())));
    const labelPad = maxLabel + 2;
    const valPad = maxVal + 2;
    return Object.keys(obj).map(k => {
        const val = obj[k as keyof typeof obj].toString();
        return k.padStart(labelPad) + " : " + val.padEnd(valPad + (val.length - stringLen(val)))
    }).join("\n");
}

// v2023-04-13
function formatBox(text: string, title: string = "") {
    const lines = text.split("\n");
    const maxLen = Math.max(...lines.map(l => stringLen(l)));
    const top = "┌" + (title.length !== 0 ? (" " + title + " ") : title).padEnd(maxLen, "─") + "┐";
    const bottom = "└" + "─".repeat(maxLen) + "┘";
    const body = lines.map(l => "│" + l.padEnd(maxLen + (l.length - stringLen(l))) + "│").join("\n");
    return top + "\n" + body + "\n" + bottom;
}
