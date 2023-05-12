import { NS } from "@ns";


export async function main(ns: NS) {
    ns.disableLog("ALL");
    if (ns.getPurchasedServers().length === 0) {
        ns.printf("No servers purchased to upgrade");
        return;
    }
    
    const upgraded = upgradeServers(ns);
    if (upgraded.length > 0) {
        ns.printf("\n"+formatTable(upgraded));
    } else {
        ns.printf("No servers upgraded");
    }
}

function upgradeServers(ns: NS): any[] {
    const upgraded = [];
    let max = 5;
    while (max > 0) {
        const servers = ns.getPurchasedServers();
        const server = servers.map(s => ({
            host: s,
            ram: ns.getServerMaxRam(s)
        })).sort((a, b) => a.ram - b.ram)
            .find(s => true);
        const upgrade = largestAffordableServer(ns);
        const host = {
            host: server!.host,
            old: server!.ram,
            new: upgrade
        }

        if (host.new > host.old) {
            ns.killall(host.host);
            ns.deleteServer(host.host);
            ns.purchaseServer(uuid4(), host.new);
            upgraded.push(host);
        } else {
            break;
        }
        max--;
    }
    return upgraded;
}

function largestAffordableServer(ns: NS) {
    const maxPower = 20;
    const budget = ns.getServerMoneyAvailable('home');
    for (let i = maxPower; i > 3; i--) {
        const cost = ns.getPurchasedServerCost(Math.pow(2, i));
        if (cost < budget) {
            return Math.pow(2, i);
        }
    }
    return 0;
}

function formatTable(obj: any[]): string {
    const NUMBER_FORMAT = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
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

function uuid4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        let r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    }).substring(0, 8);
}