/**
 * @file daemon.ts
 * @description Daemon script for running other scripts in the background.
 * @version 2023-04-11
 * @license MIT
 */
import { NS } from "@ns";

const colors = ["\x1b[38;5;242m", "\x1b[38;5;250m"];
let colorIdx = 0;

export async function main(ns: NS): Promise<void> {
    const [script, delay, ...args] = ns.args;
    const clear = ns.args.includes("--clear");
    const showWarn = !ns.args.includes("--no-warning");

    if (!script) {
        ns.tprint("Usage: daemon <script> [delay]");
        return;
    }

    if (!delay) {
        ns.tprint("No delay specified, using 1 second");
    }

    ns.clearLog();
    ns.disableLog("ALL");
    ns.print(`Running ${script} every ${delay} seconds...`);
    if (!showWarn) {
        ns.print("\x1b[38;5;3m--no-warning specified\x1b[0m");
    }

    const delayMs = (delay as number || 1) * 1000;
    while (true) {
        const pid = ns.run(script as string, 1, ...args.filter(a => a !== "--clear").filter(a => a !== "--silent"));
        if (pid === 0) {
            ns.printf("\x1b[38;5;1mFailed to run script: %s\x1b[0m", script);
        }

        const logDelayMs = Math.min(delayMs, 1000);
        await ns.sleep(logDelayMs);
        if (clear) {
            ns.clearLog();
        }
        let s = ns.getRecentScripts().find(s => s.pid === pid);
        if (!s) {
            if (showWarn) {
                if (ns.getRunningScript(pid)) {
                    ns.printf("\x1b[38;5;3m%s still running...\x1b[0m", script);
                }
            } else {
                ns.printf("\x1b[38;5;1m%s not in recent, extend setting in options!\x1b[0m", script);
            }
        } else if (s.logs.length > 1) {
            s.logs.slice(0, s.logs.length - 1)
                .map(s => s.replaceAll("%", "%%"))
                .map(s => s.replaceAll(/^\[\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d\] /g, ""))
                .map(s => s.replaceAll(/^\[\d\d:\d\d:\d\d\] /g, ""))
                .map(s => colors[colorIdx] + s + "\x1b[0m")
                .forEach(ns.printf);

            colorIdx = (colorIdx + 1) % colors.length;
        } else {
            if (showWarn) {
                ns.printf("\x1b[38;5;3m%s has no logs.\x1b[0m", script);
            }
        }

        if (delayMs > logDelayMs) {
            await ns.sleep(delayMs - logDelayMs);
        }
    }
}