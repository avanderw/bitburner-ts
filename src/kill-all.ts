import { NS } from "@ns";

export function autocomplete(data: any) {
    return [...data.servers];
}

export async function main(ns: NS) {
    ns.clearLog();
    const target = ns.args[0] as string;
    if (target) {
        ns.killall(target);
    } else {
        traverseNet(ns).forEach(s => ns.killall(s));
    }
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