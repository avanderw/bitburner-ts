
import { NS } from "@ns";


export async function main(ns: NS) {
    const catalogue = serverCatalogue(ns);
    ns.tprintf("\n"+formatTable(catalogue));
    ns.tprintf("%s servers", catalogue.length);
    ns.tprintf("\n");
}

function serverCatalogue(ns: NS): any[] {
    const affordability = ns.getServerMoneyAvailable('home');
    const maxPower = 20;
    const catalogue = [];
    for (let i = 0; i <= maxPower; i++) {
        const host = {
            ram: Math.pow(2, i),
            cost: ns.getPurchasedServerCost(Math.pow(2, i)),
            affordable: ns.getPurchasedServerCost(Math.pow(2, i)) < affordability ? "Yes" : "No"
        }
        catalogue.push(host);
    }
    return catalogue;
}

function formatTable(obj: any[]): string {
    const NUMBER_FORMAT = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const colums = Object.keys(obj[0]);
    const rows = obj.map(o => Object.values(o));
    const widths = colums.map((c, i) => Math.max(c.length, Math.max(...rows.map(r => typeof r[i] === 'number' ? NUMBER_FORMAT.format(r[i] as number).length : (r[i] as object).toString().length))));
    const borderTop = widths.map(w => "─".repeat(w)).join("─┬─");
    const header = colums.map((c, i) => c.padEnd(widths[i])).join(" │ ");
    const divider = widths.map(w => "─".repeat(w)).join("─┼─");
    const borderBottom = widths.map(w => "─".repeat(w)).join("─┴─");
    const body = rows.map(
        r => r.map(
            (v, i) => typeof v === 'number' ? NUMBER_FORMAT.format(v).padStart(widths[i]) : (v as object).toString().padEnd(widths[i])
        ).join(" │ ")
    ).join("\n");
    return borderTop + "\n" + header + "\n" + divider + "\n" + body + "\n" + borderBottom;
}
