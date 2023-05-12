
import { NS } from "@ns";

export function autocomplete(data: any) {
    return [...data.servers];
}

export function main(ns: NS): void {
    if (ns.args.length === 0) {
        ns.tprint("Usage: tracert <server>");
        return;
    }

    const hops = tracert(ns, ns.args[0] as string, "home", []);
    if (hops.length === 0) {
        ns.tprintf("Unable to resolve %s", ns.args[0] as string);
        return;
    }

    const ansiRed = "\x1b[31m";
    const ansiYellow = "\x1b[33m";
    const ansiGreen = "\x1b[32m";
    const ansiReset = "\x1b[0m";
    ns.tprintf(hops.map(s => ns.getServer(s))
        .map(s => {
            let color = ansiRed;
            let name = s.hostname;
            if (s.backdoorInstalled) {
                color = ansiGreen;
                name += " (backdoor)";
            } else if (s.hasAdminRights) {
                color = ansiYellow;
                name += " (admin)";
            }
            return color + name + ansiReset;
        })
        .reduce((a, b, i) => a + "\n" + " ".repeat(i) + "-> " + b, ansiGreen + "\nhome" + ansiReset));

    const command = hops.map(s=>"connect " + s).join(";");
    ns.tprintf(`\x1b[38;5;6m\nCopied to clipboard, Ctrl+V to paste...\x1b[0m`);
    window.navigator.clipboard.writeText(command);
}

function tracert(ns: NS, to: string, from: string, seen: string[]): string[] {
    if (seen.indexOf(from) !== -1) {
        return [];
    }
    seen = [...seen, from];
    const neighbours = ns.scan(from)
        .filter(s => seen.indexOf(s) === -1);
    for (const s of neighbours) {
        if (s === to) {
            return [s];
        }

        const rt = tracert(ns, to, s, seen);
        if (rt.length > 0) {
            return [s, ...rt];
        }
    };
    return [];
}
