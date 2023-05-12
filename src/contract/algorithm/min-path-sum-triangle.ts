
export function minPathSumTriangle(data: number[][]): number {
    let n = data.length;
    let dp = data[n - 1].slice();
    for (let i = n - 2; i > -1; --i) {
        for (let j = 0; j < data[i].length; ++j) {
            dp[j] = Math.min(dp[j], dp[j + 1]) + data[i][j];
        }
    }
    return dp[0];
}