import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    ns.gang.getTaskNames().map(ns.gang.getTaskStats).forEach(t => {
        ns.printf("\n" + formatForm(t));
    });

    ns.gang.getMemberNames().forEach(m => {
        const member = ns.gang.getMemberInformation(m);
        const task = ns.gang.getTaskNames().map(ns.gang.getTaskStats)
            .filter(t => t.name !== "Unassigned")
            .filter(t => !t.name.startsWith("Train"))
            .sort((a, b) => a.difficulty - b.difficulty)
            .find(t => true)!;
        
        ns.gang.setMemberTask(member.name, task.name);
    });
}


// version 1.0.0
function formatForm(obj: { [key: string]: any }) {
    const maxLabel = Math.max(...Object.keys(obj).map(k => k.length));
    const maxVal = Math.max(...Object.values(obj).map(v => v.toString().length));
    const labelPad = maxLabel + 2;
    const valPad = maxVal + 2;
    return Object.keys(obj).map(k => k.padStart(labelPad) + " : " + obj[k as keyof typeof obj].toString().padEnd(valPad)).join("\n");
}
