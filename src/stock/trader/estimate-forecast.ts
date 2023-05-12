import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    ns.clearLog();
    if (!ns.stock.hasTIXAPIAccess()) {
        ns.tprint("Stock market is not available.");
        return;
    }

    if (!ns.stock.has4SDataTIXAPI()) {
        ns.tprint("Stock market data is not available.");
        return;
    }

    const eForecastFn = estimateForecast01;
    const eVolatilityFn = estimateVolatility01;
    const stocks: {}[] = [];

    let falsePositives = 0;
    let forecastInsideError = 0;
    const minForecast = Math.min(...ns.stock.getSymbols().map(s => ns.stock.getForecast(s)));
    const maxForecast = Math.max(...ns.stock.getSymbols().map(s => ns.stock.getForecast(s)));
    const errForecast = (maxForecast - minForecast) * 0.05;

    let volatilityInsideError = 0;
    const minVolatility = Math.min(...ns.stock.getSymbols().map(s => ns.stock.getVolatility(s)));
    const maxVolatility = Math.max(...ns.stock.getSymbols().map(s => ns.stock.getVolatility(s)));
    const errVolatility = (maxVolatility - minVolatility) * 0.05;

    ns.stock.getSymbols().forEach(s => {
        const forecast = ns.stock.getForecast(s);
        const eForecast = eForecastFn(ns, s);
        const diffForecast = Math.abs(forecast - eForecast);
        if (diffForecast < errForecast) {
            forecastInsideError++;
        }
        if (forecast > 0.55 && eForecast < 0.45) {
            falsePositives++;
        }

        const volatility = ns.stock.getVolatility(s);
        const eVolatility = eVolatilityFn(ns, s);
        const diffVolatility = Math.abs(volatility - eVolatility);

        if (diffVolatility < errVolatility) {
            volatilityInsideError++;
        }
        stocks.push({
            SYM: s,
            F: "" + ns.formatNumber(forecast),
            "F≈": "" + ns.formatNumber(eForecast),
            FΔ: (diffForecast < errForecast ? "\x1b[38;5;2m" : "\x1b[38;5;1m") + ns.formatNumber(diffForecast) + "\x1b[0m",
            V: "" + ns.formatNumber(volatility),
            "V≈": "" + ns.formatNumber(eVolatility),
            VΔ: (diffVolatility < errVolatility ? "\x1b[38;5;2m" : "\x1b[38;5;1m") + ns.formatNumber(diffVolatility) + "\x1b[0m",
        });
    });

    const summary = {
        "Ffn": "" + eForecastFn.name,
        "FE": "" + ns.formatNumber(errForecast),
        "Fη": "" + ns.formatPercent(forecastInsideError / ns.stock.getSymbols().length) + "%",
        "-+": "" + ns.formatPercent(falsePositives/ ns.stock.getSymbols().length) + "%",
        "Vfn": "" + eVolatilityFn.name,
        "VE": "" + ns.formatNumber(errVolatility),
        "Vη": "" + ns.formatPercent(volatilityInsideError / ns.stock.getSymbols().length) + "%",
    }

    ns.printf(formatColum("\n"+formatTable(stocks), formatBox(formatForm(summary))));
}

// use increase count
function estimateForecast01(ns: NS, sym: string): number {
    const window = 64;
    const data: number[] = JSON.parse(ns.read("/stock/data/" + sym + ".txt").toString());
    const set = data.slice(Math.max(0, data.length - window));

    let incr = 0;
    for (let i = 0; i < set.length - 1; i++) {
        incr += set[i + 1] - set[i] > 0 ? 1 : 0;
    }

    const forecast = incr / set.length;
    return forecast;
}

// use rsi
function estimateForecast02(ns: NS, sym: string): number {
    const window = 64;
    const data: number[] = JSON.parse(ns.read("/stock/data/" + sym + ".txt").toString());
    const set = data.slice(Math.max(0, data.length - window));

    return rsi(set, 14) / 100;
}

// use rsi with increase count
function estimateForecast03(ns: NS, sym: string): number {
    const window = 32;
    const data: number[] = JSON.parse(ns.read("/stock/data/" + sym + ".txt").toString());
    const set = data.slice(Math.max(0, data.length - window));

    const rsi14 = rsi(set, 14);
    let incr = 0;
    for (let i = 0; i < set.length - 1; i++) {
        incr += set[i + 1] - set[i] > 0 ? 1 : 0;
    }

    return (incr / set.length + rsi14 / 100) / 2;
}

function rsi(data: number[], period: number): number {
    const gains: number[] = [];
    const losses: number[] = [];
    for (let i = 1; i < data.length; i++) {
        const diff = data[i] - data[i - 1];
        if (diff > 0) {
            gains.push(diff);
            losses.push(0);
        } else {
            gains.push(0);
            losses.push(-diff);
        }
    }
    const avgGain = ema(gains, period);
    const avgLoss = ema(losses, period);
    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    return rsi;
}

function ema(data: number[], period: number): number {
    const k = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
        ema = data[i] * k + ema * (1 - k);
    }
    return ema;
}

// use min max range
function estimateVolatility01(ns: NS, sym: string): number {
    const window = 5;
    const data: number[] = JSON.parse(ns.read("/stock/data/" + sym + ".txt").toString());
    const set = data.slice(Math.max(0, data.length - window));
    const min = Math.min(...set);
    const max = Math.max(...set);
    const range = max - min;
    const volatility = range / min;
    return volatility;
}

// use standard deviation
function estimateVolatility02(ns: NS, sym: string): number {
    const window = 24;
    const data: number[] = JSON.parse(ns.read("/stock/data/" + sym + ".txt").toString());
    const set = data.slice(Math.max(0, data.length - window));
    return stddev(set) / average(set);
}

function stddev(values: number[]): number {
    const avg = average(values);

    const squareDiffs = values.map(value => {
        const diff = value - avg;
        const sqrDiff = diff * diff;
        return sqrDiff;
    });

    const avgSquareDiff = average(squareDiffs);

    const stdDev = Math.sqrt(avgSquareDiff);
    return stdDev;
}

function average(data: number[]): number {
    const sum = data.reduce((sum, value) => {
        return sum + value;
    }, 0);
    return sum / data.length;
}

// v2023-04-07
function formatTable(obj: any[], limit = 0): string {
    if (obj.length === 0) {
        return "";
    }
    const NUMBER_FORMAT = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const colums = Object.keys(obj[0]);
    const rows = obj.map(o => Object.values(o));
    const widths = colums.map((c, i) => Math.max(c.length, Math.max(...rows.map(r => typeof r[i] === 'number'
        ? NUMBER_FORMAT.format(r[i] as number).length
        : stringLen((r[i] as object).toString())))));
    const borderTop = "┌" + widths.map(w => "─".repeat(w)).join("─┬─") + "┐";
    const header = "│" + colums.map((c, i) => c.toUpperCase().padEnd(widths[i])).join(" │ ") + "│";
    const divider = "├" + widths.map(w => "─".repeat(w)).join("─┼─") + "┤";
    const borderBottom = "└" + widths.map(w => "─".repeat(w)).join("─┴─") + "┘";
    const body = rows.slice(limit).map(
        r => "│" + r.map(
            (v, i) => typeof v === 'number' ? NUMBER_FORMAT.format(v).padStart(widths[i]) : (v as object).toString()
                .padStart((v as object).toString().indexOf("%%") !== -1 ? widths[i] + 1 : widths[i])
        ).join(" │ ") + "│"
    ).join("\n");
    const summary = `Showing ${limit === 0 ? rows.length : limit} of ${rows.length} rows`;
    return borderTop + "\n" + header + "\n" + divider + "\n" + body + "\n" + borderBottom + "\n" + summary;
}

// v2023-04-07
function stringLen(str: string): number {
    return str.replaceAll(/%%/g, " ")
        .replaceAll(/\x1b\[38;5;\d+m/g, "")
        .replaceAll(/\x1b\[0m/g, "")
        .length;
}

// v2023-04-07
function formatColum(left: string, right: string) {
    let result = "";
    const leftLines = left.split("\n");
    const rightLines = right.split("\n");
    const maxLeftLen = Math.max(...leftLines.map(l => stringLen(l)));
    const maxRightLen = Math.max(...rightLines.map(l => stringLen(l)));
    for (let i = 0; i < leftLines.length; i++) {
        if (rightLines[i] === undefined) {
            result = result + leftLines[i].padEnd(maxLeftLen) + "\n";
            continue;
        }

        if (leftLines[i] === undefined) {
            result = result + "".padStart(maxLeftLen) + rightLines[i].padEnd(maxRightLen) + "\n";
            continue;
        }

        result = result + leftLines[i].padEnd(maxLeftLen) + " " + rightLines[i].padEnd(maxRightLen) + "\n";
    }
    return result;
}

// version 1.0.0
function formatForm(obj: { [key: string]: any }) {
    const maxLabel = Math.max(...Object.keys(obj).map(k => k.length));
    const maxVal = Math.max(...Object.values(obj).map(v => v.toString().length));
    const labelPad = maxLabel + 2;
    const valPad = maxVal + 2;
    return Object.keys(obj).map(k => k.padStart(labelPad) + " : " + obj[k as keyof typeof obj].toString().padEnd(valPad)).join("\n");
}

// version 1.0.0
function formatBox(text: string, title: string = "") {
    const lines = text.split("\n");
    const maxLen = Math.max(...lines.map(l => l.indexOf("%%") !== -1 ? l.length - 1 : l.length));
    const top = "┌" + (title.length !== 0 ? (" " + title + " ") : title).padEnd(maxLen, "─") + "┐";
    const bottom = "└" + "─".repeat(maxLen) + "┘";
    const body = lines.map(l => "│" + l.padEnd(l.indexOf("%%") !== -1 ? maxLen + 1 : maxLen) + "│").join("\n");
    return top + "\n" + body + "\n" + bottom;
}
