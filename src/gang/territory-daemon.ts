import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    ns.clearLog();
    ns.disableLog("ALL");
    await waitForTick(ns);
    while (true) {
        await ns.sleep(19e3);
        assignAllToWarfare(ns);
        await waitForTick(ns);
        assignAllToOriginalJobs(ns);
    }
}

async function waitForTick(ns: NS): Promise<void> {
    const my = ns.gang.getGangInformation();
    const powerCache: { [key: string]: number } = {};
    let gangs = ns.gang.getOtherGangInformation();
    delete gangs[my.faction];
    for (const key in gangs) {
        powerCache[key] = gangs[key].power;
    }

    while (true) {
        await ns.sleep(350);
        gangs = ns.gang.getOtherGangInformation();
        delete gangs[my.faction];
        for (const key in gangs) {
            if (powerCache[key] !== gangs[key].power) {
                ns.printf("Power changed, tick detected");
                return;
            }
        }
    }
}

const jobCache: { [key: string]: string } = {};
function assignAllToWarfare(ns: NS): void {
    ns.printf("Assigning all to warfare");
    ns.gang.getMemberNames().map(ns.gang.getMemberInformation).forEach(m => {
        jobCache[m.name] = m.task;
        ns.gang.setMemberTask(m.name, "Territory Warfare");
    });
}

function assignAllToOriginalJobs(ns: NS): void {
    ns.printf("Assigning all to original jobs");
    ns.gang.getMemberNames().map(ns.gang.getMemberInformation).forEach(m => {
        ns.gang.setMemberTask(m.name, jobCache[m.name]);
    });
}