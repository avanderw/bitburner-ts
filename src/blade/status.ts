import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    if (!ns.bladeburner.inBladeburner()) {
        if (!ns.bladeburner.joinBladeburnerDivision()) {
            ns.printf("Not in Bladeburner. Exiting.");
            ns.exit();
        }
    }

    ns.printf("General\n" + formatTable(ns.bladeburner.getGeneralActionNames()
        .map(a => compileAction(ns, "general", a))
    ));

    ns.printf("Contracts\n" + formatTable(ns.bladeburner.getContractNames()
        .map(c => compileAction(ns, "contract", c))
    ));

    ns.printf("Operations\n" + formatTable(ns.bladeburner.getOperationNames()
        .map(o => compileAction(ns, "operation", o))
    ));

    ns.printf("BlackOps\n" + formatTable(ns.bladeburner.getBlackOpNames()
        .map(b => compileAction(ns, "blackops", b))
        .map(b => ({ ...b, ...{ rank: ns.bladeburner.getBlackOpRank(b.name) } }))
    ));
    
    ns.tail();
}

function compileAction(ns: NS, type: string, action: string) {
    return {
        name: action,
        auto: ns.bladeburner.getActionAutolevel(type, action),
        count: ns.bladeburner.getActionCountRemaining(type, action),
        lvl: ns.bladeburner.getActionCurrentLevel(type, action) + "/" + ns.bladeburner.getActionMaxLevel(type, action),
        time: ns.bladeburner.getActionCurrentTime() + "/" + ns.bladeburner.getActionTime(type, action),
        chance: ns.formatPercent(ns.bladeburner.getActionEstimatedSuccessChance(type, action)[0]) + "%",
        rep: ns.bladeburner.getActionRepGain(type, action, ns.bladeburner.getActionCurrentLevel(type, action)),
        wins: ns.bladeburner.getActionSuccesses(type, action),
    }
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
