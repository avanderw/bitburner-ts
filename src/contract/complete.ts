/**
 * FIX: compression-02-LZ-decompression
 */
import { NS } from "@ns";

import { stockTrader01 } from "/contract/algorithm/algorithmic-stock-trader-01";
import { stockTrader02 } from "/contract/algorithm/algorithmic-stock-trader-02";
import { stockTrader03 } from "/contract/algorithm/algorithmic-stock-trader-03";
import { stockTrader04 } from "/contract/algorithm/algorithmic-stock-trader-04";
import { minJumps } from "/contract/algorithm/array-jumping-02"
import { rle as compressionRLE } from "/contract/algorithm/compression-01-RLE-compression";
import { caesarCipher } from "/contract/algorithm/encryption-01-caesar-cipher";
import { vigenereCipher } from "/contract/algorithm/encryption-02-vigenere-cipher"
import { largestPrimeFactor } from "/contract/algorithm/largest-prime-factor";
import { generateIpAddresses } from "/contract/algorithm/generate-ip-addresses";
import { mergeOverlappingIntervals } from "/contract/algorithm/merge-overlapping-intervals";
import { minPathSumTriangle } from "/contract/algorithm/min-path-sum-triangle";
import { spiralMatrix } from "/contract/algorithm/spiral-matrix";
import { maxSubArraySum } from "/contract/algorithm/subarray-with-maximum-sum";
import { graphColoring } from "/contract/algorithm/graph-color-2"
import { totalWaysToSum } from "/contract/algorithm/total-ways-to-sum";
import { totalWaysToSum as totalWaysToSum2 } from "/contract/algorithm/total-ways-to-sum-02";
import { uniquePaths as uniqueGridPaths01 } from "/contract/algorithm/unique-grid-paths-01";
import { uniquePaths as uniqueGridPaths02 } from "/contract/algorithm/unique-grid-paths-02";
import { encodeHammingFromInteger } from "/contract/algorithm/hamming-codes-from-integer";
import { findShortestPath } from "/contract/algorithm/shortest-path";
import { decode as lzDecompress } from "/contract/algorithm/compression-02-LZ-decompression";
import { sanitizeParenthesis } from "/contract/algorithm/sanitize-parenthesis";
import { minJumps as array01 } from "/contract/algorithm/array-jumping-01";

const ALGORITHMS: { [name: string]: (data: any) => any } = {
    "Algorithmic Stock Trader I": stockTrader01,
    "Algorithmic Stock Trader II": stockTrader02,
    "Algorithmic Stock Trader III": stockTrader03,
    "Algorithmic Stock Trader IV": stockTrader04,
    "Array Jumping Game": array01,
    "Array Jumping II": minJumps,
    "Compression I: RLE Compression": compressionRLE,
    "Compression II: LZ Decompression": lzDecompress,
    "Encryption I: Caesar Cipher": caesarCipher,
    "Encryption II: Vigenère Cipher": vigenereCipher,
    "Find Largest Prime Factor": largestPrimeFactor,
    "Generate IP Addresses": generateIpAddresses,
    "HammingCodes: Integer to Encoded Binary": encodeHammingFromInteger,
    "Merge Overlapping Intervals": mergeOverlappingIntervals,
    "Minimum Path Sum in a Triangle": minPathSumTriangle,
    "Proper 2-Coloring of a Graph": graphColoring,
    "Sanitize Parentheses in Expression": sanitizeParenthesis,
    "Shortest Path in a Grid": findShortestPath,
    "Spiralize Matrix": spiralMatrix,
    "Subarray with Maximum Sum": maxSubArraySum,
    "Total Ways to Sum": totalWaysToSum,
    "Total Ways to Sum II": totalWaysToSum2,
    "Unique Paths in a Grid I": uniqueGridPaths01,
    "Unique Paths in a Grid II": uniqueGridPaths02,
};

export async function main(ns: NS) {
    const failures:any[] = [];
    const successes:any = [];
    const contracts = findContracts(ns);
    contracts.forEach(contract => {
        const type = ns.codingcontract.getContractType(contract.file, contract.server);
        const data = ns.codingcontract.getData(contract.file, contract.server);
        if (ALGORITHMS[type]) {
            const reward = ns.codingcontract.attempt(ALGORITHMS[type](data), contract.file, contract.server);
            if (reward === "") {
                failures.push({...contract, reward: reward});
            } else {
                successes.push({...contract, reward: reward});
            }
        }
    });

    if (failures.length !== 0) {
        let displayLimit = Math.min(13, failures.length);
        ns.printf("\n"+formatTable(failures.slice(0, displayLimit)));
        ns.printf("Showing %s of %s failures", displayLimit, failures.length);

        const typeBucket = frequency(failures, "type");
        displayLimit = Math.min(8, Object.keys(typeBucket).length);
        ns.printf("\n"+formatTable(Object.keys(typeBucket).map(k => ({ type: k, count: typeBucket[k], example: path(contracts.find(c=>c.type === k)) })).sort((a, b) => a.type.localeCompare(b.type)).slice(0, displayLimit)));
        ns.printf("Showing %s of %s types", displayLimit, Object.keys(typeBucket).length);
    }

    if (successes.length !== 0) {
        let displayLimit = Math.min(5, successes.length);
        ns.printf("\n"+formatTable(successes.slice(0, displayLimit)));
        ns.printf("Showing %s of %s successes", displayLimit, successes.length);

        const typeBucket = frequency(successes, "type");
        displayLimit = Math.min(3, Object.keys(typeBucket).length);
        ns.printf("\n"+formatTable(Object.keys(typeBucket).map(k => ({ type: k, count: typeBucket[k]})).sort((a, b) => a.type.localeCompare(b.type)).slice(0, displayLimit)));
        ns.printf("Showing %s of %s types", displayLimit, Object.keys(typeBucket).length);
    }

    if (failures.length === 0 && successes.length === 0) {
        ns.printf("No contracts attempted");
    }
}

function findContracts(ns: NS): any[] {
    const contracts: any[] = [];
    traverseNet(ns).forEach(server => ns.ls(server).filter(file => file.endsWith(".cct")).forEach(file => {
        const contract = {
            file: file,
            server: server,
            type: ns.codingcontract.getContractType(file, server),
            guesses: ns.codingcontract.getNumTriesRemaining(file, server),
        };
        contracts.push(contract);
    }));
    return contracts;
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


function formatTable(objArr: any[]): string {
    if (objArr.length === 0) return "";
    const NUMBER_FORMAT = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const colums = Object.keys(objArr[0]);
    const rows = objArr.map(o => Object.values(o));
    const widths = colums.map((c, i) => Math.max(c.length, Math.max(...rows.map(r => typeof r[i] === 'number' ? NUMBER_FORMAT.format(r[i] as number).length : (r[i] as object).toString().length))));
    const borderTop = widths.map(w => "─".repeat(w)).join("─┬─");
    const header = colums.map((c, i) => c.padEnd(widths[i])).join(" │ ");
    const divider = widths.map(w => "─".repeat(w)).join("─┼─");
    const borderBottom = widths.map(w => "─".repeat(w)).join("─┴─");
    const body = rows.map(
        r => r.map(
            (v, i) => typeof v === 'number' ? NUMBER_FORMAT.format(v).padStart(widths[i]) : (v as object).toString().padEnd(widths[i])
        ).join(" │ ")
    ).join("\n");
    return borderTop + "\n" + header + "\n" + divider + "\n" + body + "\n" + borderBottom;
}

function frequency(items: any[], key: string): { [key: string]: number } {
    return items.reduce((acc, item) => {
        if (acc[item[key]] === undefined) {
            acc[item[key]] = 0;
        }
        acc[item[key]] += 1;
        return acc;
    }, {} as { [key: string]: number });
}

function path(contract: any): string {
    return "//" + contract.server + "/" + contract.file;
}