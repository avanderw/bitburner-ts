import { NS } from "@ns";

export async function main(ns: NS) {
    const MONEY_FORMAT = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
    });
    const FLAGS = ns.flags([["budget", ns.getServerMoneyAvailable("home")]]);
    const history = [];

    // Purchase hacknet
    let workingBudget = FLAGS.budget as number;
    let nextPurchase = availableActions(ns).sort((a, b) => a.cost - b.cost)[0];
    let totalSpent = 0;
    while (nextPurchase.cost < workingBudget) {
        history.push(nextPurchase);
        nextPurchase.func.call(null, ...nextPurchase.args);
        totalSpent += nextPurchase.cost;
        workingBudget -= nextPurchase.cost;
        nextPurchase = availableActions(ns).sort((a, b) => a.cost - b.cost)[0];
    }

    if (totalSpent > 0) {
        const actions = frequency(history, "name");
        ns.tprintf("\n"+formatTable(Object.keys(actions).map(k => ({ "Purchase": k, "Count": actions[k] }))));
        ns.tprintf("Total spent: " + MONEY_FORMAT.format(totalSpent));
    }
    ns.tprintf(`Next purchase: ${nextPurchase.name} (${MONEY_FORMAT.format(nextPurchase.cost)})`);
}

function availableActions(ns: NS): [{ cost: number; func: Function; args: any[], name: string }] {
    const actions: [{ cost: number; func: Function; args: any[], name: string }] = [
        { cost: ns.hacknet.getPurchaseNodeCost(), func: ns.hacknet.purchaseNode, args: [], name: "Purchase Node" }
    ];
    for (let i = 0; i < ns.hacknet.numNodes(); i++) {
        actions.push({ cost: ns.hacknet.getLevelUpgradeCost(i, 1), func: ns.hacknet.upgradeLevel, args: [i, 1], name: "Upgrade Node Level" });
        actions.push({ cost: ns.hacknet.getRamUpgradeCost(i, 1), func: ns.hacknet.upgradeRam, args: [i, 1], name: "Upgrade Node RAM" });
        actions.push({ cost: ns.hacknet.getCoreUpgradeCost(i, 1), func: ns.hacknet.upgradeCore, args: [i, 1], name: "Upgrade Node Core" });
    }
    actions.sort((a, b) => a.cost - b.cost);
    return actions;
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