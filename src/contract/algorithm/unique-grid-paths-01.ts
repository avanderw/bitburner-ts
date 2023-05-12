

export function uniquePaths(data: number[]) {
    let n = data[0]; // Number of rows
    let m = data[1]; // Number of columns
    let currentRow = [];
    currentRow.length = n;
    for (let i = 0; i < n; i++) {
        currentRow[i] = 1;
    }
    for (let row = 1; row < m; row++) {
        for (let i = 1; i < n; i++) {
            currentRow[i] += currentRow[i - 1];
        }
    }
    return currentRow[n - 1];
}