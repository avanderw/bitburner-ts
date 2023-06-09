//https://github.com/kroitor/asciichart

// control sequences for coloring

export const black = "\x1b[30m";
export const red = "\x1b[31m";
export const green = "\x1b[32m";
export const yellow = "\x1b[33m";
export const blue = "\x1b[34m";
export const magenta = "\x1b[35m";
export const cyan = "\x1b[36m";
export const lightgray = "\x1b[37m";
export const adefault = "\x1b[39m";
export const darkgray = "\x1b[90m";
export const lightred = "\x1b[91m";
export const lightgreen = "\x1b[92m";
export const lightyellow = "\x1b[93m";
export const lightblue = "\x1b[94m";
export const lightmagenta = "\x1b[95m";
export const lightcyan = "\x1b[96m";
export const white = "\x1b[97m";
export const reset = "\x1b[0m";

interface Config {
    min?: number;
    max?: number;
    offset?: number;
    padding?: string;
    height?: number;
    colors?: string[];
    symbols?: string[];
    format?: (x: number) => string;
}

export function colored(char: string, color?: string) {
    return color === undefined ? char : color + char + reset;
}

export function plot(series: number[][], cfg?: Config) {
    cfg = cfg ? cfg : {};
    let min = cfg.min ? cfg.min : series[0][0];
    let max = cfg.max ? cfg.max : series[0][0];

    for (let j = 0; j < series.length; j++) {
        for (let i = 0; i < series[j].length; i++) {
            min = Math.min(min, series[j][i]);
            max = Math.max(max, series[j][i]);
        }
    }

    let defaultSymbols = ["┼", "┤", "╶", "╴", "─", "╰", "╭", "╮", "╯", "│"];
    let range = Math.abs(max - min);
    let offset = cfg.offset ? cfg.offset : 3;
    let padding = cfg.padding ? cfg.padding : "           ";
    let height = cfg.height ? cfg.height : range;
    let colors = cfg.colors ? cfg.colors : [];
    let ratio = range !== 0 ? height / range : 1;
    let min2 = Math.round(min * ratio);
    let max2 = Math.round(max * ratio);
    let rows = Math.abs(max2 - min2);
    let width = 0;
    for (let i = 0; i < series.length; i++) {
        width = Math.max(width, series[i].length);
    }
    width = width + offset;
    let symbols = cfg.symbols ? cfg.symbols : defaultSymbols;
    let format = cfg.format
        ? cfg.format
        : function (x: number) {
              return (padding + x.toFixed(2)).slice(-padding.length);
          };

    let result = new Array(rows + 1); // empty space
    for (let i = 0; i <= rows; i++) {
        result[i] = new Array(width);
        for (let j = 0; j < width; j++) {
            result[i][j] = " ";
        }
    }
    for (let y = min2; y <= max2; ++y) {
        // axis + labels
        let label = format(rows > 0 ? max - ((y - min2) * range) / rows : y); //potential bug, refer to original
        result[y - min2][Math.max(offset - label.length, 0)] = label;
        result[y - min2][offset - 1] = y == 0 ? symbols[0] : symbols[1];
    }

    for (let j = 0; j < series.length; j++) {
        let currentColor = colors[j % colors.length];
        let y0 = Math.round(series[j][0] * ratio) - min2;
        result[rows - y0][offset - 1] = colored(symbols[0], currentColor); // first value

        for (let x = 0; x < series[j].length - 1; x++) {
            // plot the line
            let y0 = Math.round(series[j][x + 0] * ratio) - min2;
            let y1 = Math.round(series[j][x + 1] * ratio) - min2;
            if (y0 == y1) {
                result[rows - y0][x + offset] = colored(symbols[4], currentColor);
            } else {
                result[rows - y1][x + offset] = colored(y0 > y1 ? symbols[5] : symbols[6], currentColor);
                result[rows - y0][x + offset] = colored(y0 > y1 ? symbols[7] : symbols[8], currentColor);
                let from = Math.min(y0, y1);
                let to = Math.max(y0, y1);
                for (let y = from + 1; y < to; y++) {
                    result[rows - y][x + offset] = colored(symbols[9], currentColor);
                }
            }
        }
    }
    return result
        .map(function (x) {
            return x.join("");
        })
        .join("\n");
}
