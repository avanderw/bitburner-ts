export function stockTrader01(data: number[]): number {
    let max = 0;
    for (let i = 0; i < data.length; i++) {
        const buy = data[i];
        const sell = Math.max(...data.slice(i + 1));
        const profit = sell - buy;
        max = Math.max(profit, max);
    }
    return max;
}
