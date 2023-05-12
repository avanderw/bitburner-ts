import { NS } from "@ns";

export async function main(ns: NS) {
    const contracts = findContracts(ns);
    let displayLimit = Math.min(13, contracts.length);
    if (contracts.length > 0) {
        ns.tprintf("\n" + formatTable(contracts.slice(0, displayLimit)));
        
        const typeBucket = frequency(contracts, "type");
        displayLimit = Math.min(8, Object.keys(typeBucket).length);
        ns.tprintf("\n" + formatTable(Object.keys(typeBucket).map(k => ({ type: k, count: typeBucket[k], example: path(contracts.find(c => c.type === k)) })).sort((a, b) => a.type.localeCompare(b.type)).slice(0, displayLimit)));
    } else {
        ns.tprintf("No contracts found");
    }
}

function path(contract: any): string {
    return "//" + contract.server + "/" + contract.file;
}

function frequency(items: any[], key: string): { [key: string]: number } {
    return items.reduce((acc, item) => {
        if (acc[item[key]] === undefined) {
            acc[item[key]] = 0;
        }
        acc[item[key]] += 1;
        return acc;
    }, {} as { [key: string]: number });
}

function findContracts(ns: NS): any[] {
    const contracts: any[] = [];
    traverseNet(ns).forEach(server => ns.ls(server).filter(file => file.endsWith(".cct")).forEach(file => {
        const contract = {
            file: file,
            server: server,
            type: ns.codingcontract.getContractType(file, server),
            guesses: ns.codingcontract.getNumTriesRemaining(file, server),
        };
        contracts.push(contract);
    }));
    return contracts;
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