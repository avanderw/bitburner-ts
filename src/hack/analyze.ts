import { NS } from "@ns";


export function autocomplete(data: any) {
    return [...data.servers];
}

let WEAKEN_RAM:number;
let HACK_RAM:number;
let GROW_RAM:number;
const PER_WEAKEN_SECURITY = 0.05;
const PER_GROW_SECURITY = 0.004;
export async function main(ns: NS) {
    if (ns.args.length === 0) {
        ns.tprintf("Usage: command <target> [--use-home]");
        return;
    }

    const currencyFormat = Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const numberFormat = Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const target = ns.args[0] as string;
    WEAKEN_RAM = ns.getScriptRam("/hack/weaken-thread.js");
    HACK_RAM = ns.getScriptRam("/hack/hack-thread.js");
    GROW_RAM = ns.getScriptRam("/hack/grow-thread.js");

    const delay = 500;
    const targetRatio = 0.25;
    const hackThreads = Math.ceil(targetRatio / ns.hackAnalyze(target));
    const hackSecurityEffect = ns.hackAnalyzeSecurity(hackThreads, target);
    const hackWeakenThreads = Math.ceil(hackSecurityEffect / PER_WEAKEN_SECURITY);
    const realRatio = hackThreads * ns.hackAnalyze(target);
    const growThreads = Math.ceil(ns.growthAnalyze(target, 1 / (1 - realRatio)));
    const growWeakenThreads = Math.ceil((PER_GROW_SECURITY * growThreads) / PER_WEAKEN_SECURITY);
    const RAM = HACK_RAM * hackThreads + WEAKEN_RAM * hackWeakenThreads + GROW_RAM * growThreads + WEAKEN_RAM * growWeakenThreads;
    const batch = {
        "Delay": delay + "ms",
        "Duration": ms2MinSec(ns.getWeakenTime(target) + 3 * delay),
        "Ratio": targetRatio + 100 + "%%",
        "Take/s": currencyFormat.format(ns.hackAnalyzeChance(target) * ns.getServerMaxMoney(target) * 0.25 / ((ns.getWeakenTime(target) + 3 * delay) / 1000)),
        "RAM": numberFormat.format(RAM) + "GB",
    }

    const targetBox = formatBox(formatForm({
        "Target": target,
        "Chance": ns.hackAnalyzeChance(target) * 100 + "%%",
        "Weaken time": ms2MinSec(ns.getWeakenTime(target)),
        "Security": ns.getServerSecurityLevel(target),
        "Growth": ns.getServerGrowth(target),
    }));

    const batchBox = formatBox(formatForm(batch), "Single Batch");

    ns.tprintf("\n");
    ns.tprintf(formatColum(targetBox, batchBox))
    ns.tprintf("\n"+formatTable(analyzeDelay(ns, target).sort((a, b) => b["Potential/s"] - a["Potential/s"])));
}

function analyzeDelay(ns: NS, target: string): any[] {
    const results: any[] = [];
    for (let ratio = 0.25; ratio < 1; ratio += 0.15) {
        for (let delay = 500; delay >= 200; delay -= 100) {
            const hackThreads = Math.ceil(ratio / ns.hackAnalyze(target));
            const hackSecurityEffect = ns.hackAnalyzeSecurity(hackThreads, target);
            const hackWeakenThreads = Math.ceil(hackSecurityEffect / PER_WEAKEN_SECURITY);
            const realRatio = hackThreads * ns.hackAnalyze(target);
            const growThreads = Math.ceil(ns.growthAnalyze(target, 1 / (1-realRatio)));
            const growWeakenThreads = Math.ceil((PER_GROW_SECURITY * growThreads) / PER_WEAKEN_SECURITY);
            const RAM = HACK_RAM * hackThreads + WEAKEN_RAM * hackWeakenThreads + GROW_RAM * growThreads + WEAKEN_RAM * growWeakenThreads;
            const result = {
                "Spacer": delay + "ms",
                "Freeze Window": 4 * delay + "ms",
                "#Batches": Math.floor(Math.floor(ns.getWeakenTime(target) - delay) / (4 * delay)),
                "Take": Math.round(ratio * 100) + "%%",
                "Take/Batch": ns.getServerMaxMoney(target) * ratio * ns.hackAnalyzeChance(target),
                "Potential/s": 0,
                "RAM": RAM,
                "Potential/RAM": 0,
            }
            result["Potential/s"] = result["Take/Batch"] * result["#Batches"] / ((ns.getWeakenTime(target) + 3 * delay) / 1000);
            result["Potential/RAM"] = result["Potential/s"] / result["RAM"];
            results.push(result);
        }
    }
    return results;
}

function ms2MinSec(ms: number) {
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    return `${min}m ${sec % 60}s`;
}

// version 1.0.0
function formatColum(left: string, right: string) {
    let result = "";
    const leftLines = left.split("\n");
    const rightLines = right.split("\n");
    const maxLeftLen = Math.max(...leftLines.map(l => l.indexOf("%%") !== -1 ? l.length - 1 : l.length));
    const maxRightLen = Math.max(...rightLines.map(l => l.indexOf("%%") !== -1 ? l.length - 1 : l.length));
    for (let i = 0; i < leftLines.length; i++) {
        if (rightLines[i] === undefined) {
            result = result + leftLines[i].padEnd(maxLeftLen) + "\n";
            continue;
        }

        if (leftLines[i] === undefined) {
            result = result + "".padStart(maxLeftLen) + rightLines[i].padEnd(maxRightLen) + "\n";
            continue;
        }

        result = result + leftLines[i].padEnd(maxLeftLen) + " " + rightLines[i].padEnd(maxRightLen) + "\n";
    }
    return result;
}

// version 1.0.0
function formatBox(text: string, title: string = "") {
    const lines = text.split("\n");
    const maxLen = Math.max(...lines.map(l => l.indexOf("%%") !== -1 ? l.length - 1 : l.length));
    const top = "┌" + (title.length !== 0 ? (" " + title + " ") : title).padEnd(maxLen, "─") + "┐";
    const bottom = "└" + "─".repeat(maxLen) + "┘";
    const body = lines.map(l => "│" + l.padEnd(l.indexOf("%%") !== -1 ? maxLen + 1 : maxLen) + "│").join("\n");
    return top + "\n" + body + "\n" + bottom;
}

// version 1.0.0
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
    const borderTop = "┌"+widths.map(w => "─".repeat(w)).join("─┬─") + "┐";
    const header = "│"+colums.map((c, i) => c.padEnd(widths[i])).join(" │ ") + "│";
    const divider = "├"+widths.map(w => "─".repeat(w)).join("─┼─") + "┤";
    const borderBottom = "└"+widths.map(w => "─".repeat(w)).join("─┴─") + "┘";
    const body = rows.slice(limit).map(
        r => "│"+r.map(
            (v, i) => typeof v === 'number' ? NUMBER_FORMAT.format(v).padStart(widths[i]) : (v as object).toString()
                .padStart((v as object).toString().indexOf("%%") !== -1 ? widths[i] + 1 : widths[i])
        ).join(" │ ") + "│"
    ).join("\n");
    const summary = `Showing ${limit === 0 ? rows.length : limit} of ${rows.length} rows`;
    return borderTop + "\n" + header + "\n" + divider + "\n" + body + "\n" + borderBottom + "\n" + summary;
}

// version 1.0.0
function formatForm(obj: { [key: string]: any }) {
    const maxLabel = Math.max(...Object.keys(obj).map(k => k.length));
    const maxVal = Math.max(...Object.values(obj).map(v => v.toString().length));
    const labelPad = maxLabel + 2;
    const valPad = maxVal + 2;
    return Object.keys(obj).map(k => k.padStart(labelPad) + " : " + obj[k as keyof typeof obj].toString().padEnd(valPad)).join("\n");
}