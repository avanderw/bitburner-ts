import {NS} from "@ns";

export async function main(ns: NS): Promise<void> {
    let out = "";
    for (let i = 0 ; i < 256; i++) {
        if (i % 16 === 0 && i !== 0) {
            out += "\n";
        }

        out += ansiColor(ns, i);
    }
    ns.tprintf("\n"+out);
    ns.tprintf("Escape code: \\x1b[38;5;?m");
    ns.tprintf(" Reset code: \\x1b[0m");
}

function ansiColor(ns:NS, color: number): string {
    return ns.sprintf(`\x1b[38;5;${color}m%4s\x1b[0m`, color);
}