import {NS} from "@ns";

export async function main(ns: NS): Promise<void> {
    const servers = traverseNet(ns).filter(s => ns.getServer(s).organizationName !== "");
    
    ns.stock.getSymbols().forEach(s => {
        const stockOrg = ns.stock.getOrganization(s);
        const server = servers.find(s => {
            const serverOrg = ns.getServer(s).organizationName;
            if (serverOrg === stockOrg) {
                return true;
            }
            return false;
        });
        ns.printf("%s: %s", s, server || "none");
    });
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