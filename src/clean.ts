import { NS } from "@ns";

export async function main(ns: NS) {
    for (const filename of ns.ls("home", ".js")) {
        ns.rm(filename);
    }
}