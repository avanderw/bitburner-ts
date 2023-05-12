export function stockTrader02(data: number[]): number {
    let profit = 0;
    for (let i = 1; i < data.length; i++) {
        let sub = data[i] - data[i - 1];
        if (sub > 0) {
            profit += sub;
        }
    }
    return profit;
}
