import { NS } from "@ns";

export async function main(ns: NS) {
    const status = serverStatus(ns).sort((a, b) => ns.getServerMaxRam(a.host) - ns.getServerMaxRam(b.host)).reverse();
    if (status.length === 0) {
        ns.tprintf("No servers found, purchase some.");
        return;
    }

    ns.tprintf("\n" + formatTable(status));

    const stats = summaryStats(status, ["ram", "used"]);
    ns.tprintf("\n" + formatTable(stats));
    ns.tprintf("RAM: %s%% used", Math.round(100 * sum(status.map(s => s.used)) / sum(status.map(s => s.ram))));
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

// v2023-04-07
function stringLen(str: string): number {
    return str.replaceAll(/%%/g, " ")
        .replaceAll(/\x1b\[38;5;\d+m/g, "")
        .replaceAll(/\x1b\[0m/g, "")
        .length;
}

function summaryStats(obj: any[], keys: string[]): any[] {
    const stats = keys.map(k => ({
        key: k,
        min: Math.min(...obj.map(o => o[k])),
        max: Math.max(...obj.map(o => o[k])),
        avg: avg(obj.map(o => o[k])),
        stddev: stddev(obj.map(o => o[k]))
    }));
    return stats;
}

function sum(values: number[]): number {
    return values.reduce((a, b) => a + b);
}

function avg(values: number[]): number {
    return values.reduce((a, b) => a + b) / values.length;
}

function stddev(values: number[]): number {
    const avg = values.reduce((a, b) => a + b) / values.length;
    const squareDiffs = values.map(v => (v - avg) ** 2);
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
}

const pctFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
function serverStatus(ns: NS): any[] {
    const servers = ns.getPurchasedServers();
    return servers.map(s => ({
        host: s,
        ram: ns.getServerMaxRam(s),
        used: ns.getServerUsedRam(s),
        pct: pctFormat.format(ns.getServerUsedRam(s) / ns.getServerMaxRam(s) * 100) + "%%",
    }));
}