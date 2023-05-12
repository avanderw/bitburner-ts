/**
 * COULD weight the ascention threshold by the combat stats
 * SHOULD stop territory-daemon when we have 100% territory
 */
import { GangMemberInfo, NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");

    if (ns.gang.inGang() === false) {
        ns.printf("Not in a gang");
        ns.exit();
    }

    ascend(ns);
    recruit(ns);
    equip(ns);
    assignTasks(ns);
    enableWar(ns);

    if (ns.gang.getGangInformation().territory < 1) {
        ns.run("/gang/territory-daemon.js", 1);
    } else {
        ns.scriptKill("/gang/territory-daemon.js", "home");
    }
}

async function enableWar(ns: NS) {
    const g = ns.gang.getGangInformation();
    const gangs = ns.gang.getOtherGangInformation();
    delete gangs[g.faction];

    const weightedWinChance = Object.keys(gangs).map(key => {
        const chance = ns.gang.getChanceToWinClash(key);
        return { chance, territory: gangs[key].territory };
    }).reduce((a, b) => a + b.chance * b.territory, 0);
    const avgWinChance = weightedWinChance / Object.keys(gangs).map(key => gangs[key].territory).reduce((a, b) => a + b, 0);

    ns.gang.setTerritoryWarfare(avgWinChance > 0.75);
}

async function ascend(ns: NS): Promise<void> {
    ns.gang.getMemberNames()
        // Ascend when there is a 20% growth in stats
        .filter(m => {
            const result = ns.gang.getAscensionResult(m);
            if (result === undefined) { return false; }
            const avg = (result.agi + result.def + result.dex + result.str) / 4;
            return avg > 1.2;
        })
        .forEach(m => {
            ns.gang.ascendMember(m);
            ns.gang.setMemberTask(m, "Train Combat");
            ns.printf(`${m} \x1b[38;5;2mAscended\x1b[0m`);
        });
}

async function recruit(ns: NS): Promise<void> {
    while (ns.gang.canRecruitMember()) {
        const name = uuid4();
        ns.gang.recruitMember(name);
        ns.gang.setMemberTask(name, "Train Combat");
        ns.printf(`${name} \x1b[38;5;2mRecruited\x1b[0m`);
    }
}

async function equip(ns: NS): Promise<void> {
    ns.gang.getEquipmentNames()
        .sort((a, b) => ns.gang.getEquipmentCost(a) - ns.gang.getEquipmentCost(b))
        .forEach(e => {
            ns.gang.getMemberNames().forEach(m => {
                ns.gang.purchaseEquipment(m, e);
            });
        });
}


async function assignTasks(ns: NS): Promise<void> {
    const g = ns.gang.getGangInformation();

    // Don't assign tasks if we're wanted
    // Exact 50% wanted results when respect is exactly 0
    if (g.wantedPenalty < 0.9 && g.wantedPenalty !== 0.5) {
        reducePenalty(ns);
        return;
    }

    let reason = "\x1b[38;5;2m(Money)\x1b[0m";
    let taskPriority = ns.formulas.gang.moneyGain;
    // If we have less than 12 members, prioritize respect
    if (ns.gang.getMemberNames().length < 12) {
        reason = "\x1b[38;5;3m(< 12 Members)\x1b[0m";
        taskPriority = ns.formulas.gang.respectGain;
    }

    // If we have more than 25e12 money prioritize respect (QLink augment)
    if (ns.getServerMoneyAvailable("home") > 25e12) {
        reason = "\x1b[38;5;2m(> 25e12 Money)\x1b[0m";
        taskPriority = ns.formulas.gang.respectGain;
    }

    if (ns.gang.getGangInformation().respect > 1e9) {
        reason = "\x1b[38;5;2m(> 1e9 Respect)\x1b[0m";
        taskPriority = ns.formulas.gang.moneyGain;
    }

    const tasks = ns.gang.getTaskNames().map(ns.gang.getTaskStats).filter(t => t.baseWanted > 0);
    ns.gang.getMemberNames().map(ns.gang.getMemberInformation)
        .filter(m => m.str > 250)
        .filter(m => m.dex > 250)
        .filter(m => m.agi > 250)
        .filter(m => m.def > 250)
        .sort((a, b) => combatAvg(a) - combatAvg(b)).reverse()
        .forEach(m => {
            const result = ns.gang.getAscensionResult(m.name);
            if (result !== undefined) {
                if (result.agi > 1.2 || result.def > 1.2 || result.dex > 1.2 || result.str > 1.2) {
                    if (m.task !== "Train Combat") {
                        ns.gang.setMemberTask(m.name, "Train Combat");
                        ns.printf(`${m.name} to Train Combat \x1b[38;5;2m(Combat stat over 20%%)\x1b[0m`);
                    }
                    return;
                }
            }

            const priTask = tasks
                // Consider tasks that don't grow wanted level faster than respect
                .filter(t => 2 * ns.formulas.gang.wantedLevelGain(g, m, t) < ns.formulas.gang.respectGain(g, m, t))
                .sort((a, b) => taskPriority(g, m, a) - taskPriority(g, m, b))
                .reverse()
                .find(t => true);
            if (priTask === undefined) {
                ns.gang.setMemberTask(m.name, "Train Combat");
                ns.printf(`${m.name} to Train Combat \x1b[38;5;3m(Other tasks grow wanted level)\x1b[0m`);
            } else if (m.task !== priTask.name && m.task !== "Territory Warfare") {
                ns.gang.setMemberTask(m.name, priTask.name);
                ns.printf(`${m.name} to ${priTask.name} ${reason}`);
            }
        });
}

async function reducePenalty(ns: NS): Promise<void> {
    const g = ns.gang.getGangInformation();

    const t = ns.gang.getTaskNames().map(ns.gang.getTaskStats)
        .filter(t => t.baseWanted < 0)
        .sort((a, b) => a.baseWanted - b.baseWanted).find(t => true)!;

    ns.gang.getMemberNames().map(ns.gang.getMemberInformation)
        .forEach(m => {
            if (ns.formulas.gang.wantedLevelGain(g, m, t) < -0.025 && m.task !== t.name) {
                ns.gang.setMemberTask(m.name, t.name);
                ns.printf(`${m.name} to ${t.name} \x1b[38;5;1m(Wanted too high)\x1b[0m`);
            } else if (m.task !== "Train Combat" && m.task !== t.name) {
                ns.gang.setMemberTask(m.name, "Train Combat");
                ns.printf(`${m.name} to "Train Combat \x1b[38;5;3m(Not strong enough)\x1b[0m`);
            }
        });
}

function combatAvg(m: GangMemberInfo): number {
    return (m.agi + m.def + m.dex + m.str) / 4;
}

function uuid4(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    }).substring(0, 8);
}
