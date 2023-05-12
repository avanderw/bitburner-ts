import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    if (ns.args.length !== 1) {
        ns.tprint("Usage: reset-script <script>");
        return;
    }

    const script = ns.args[0] as string;
    const args = ns.args.slice(1);
    if (ns.scriptRunning(script, "home")) {
        const killed = ns.kill(script, "home", ...args);
        if (!killed) {
            ns.tprint("Failed to kill script");
            ns.tail();
            return;
        }
        ns.tprint("Killed script");
    }

    let pid = ns.run(script, 1, ...args);
    if (pid === 0) {
        ns.tprint("Failed to run script");
        ns.tail();
        return;
    }
    let cache = checksum(ns.read(script));
    ns.tail(pid);

    while (ns.isRunning(pid, "home")) {
        await ns.sleep(4000);
        const newCache = checksum(ns.read(script));
        if (newCache !== cache) {
            const killed = ns.kill(script, "home", ...args);
            if (!killed) {
                ns.tprint("Failed to kill script");
                ns.tail();
                return;
            }
            pid = ns.run(script, 1, ...args);
            if (pid === 0) {
                ns.tprint("Failed to run script");
                ns.tail();
                return;
            }
            cache = newCache;
            ns.tail(pid);
        }
    }
}

function checksum(str: string): string {
    let chk = 0x12345678;
    for (let i = 0; i < str.length; i++) {
        chk += (str.charCodeAt(i) * (i + 1));
    }

    return (chk & 0xffffffff).toString(16);
}