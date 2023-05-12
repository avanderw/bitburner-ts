export function spiralMatrix(matrix: number[][]): number[] {
    let dY = 0;
    let dX = 1;
    let y = 0;
    let x = 0;
    const ans = [];
    const rowLen = matrix.length;
    const colLen = matrix[0].length;
    const visited = [];
    for (let r = 0; r < rowLen; r++) {
        const row = [];
        for (let c = 0; c < colLen; c++) {
            row.push(false);
        }
        visited.push(row);
    }

    while (visited.some(r => r.some(c => !c))) {
        visited[y][x] = true;
        ans.push(matrix[y][x]);

        console.log(`[${x},${y}] ${ans}`);

        const nX = x + dX;
        const nY = y + dY;
        if (nX === colLen || (dX === 1 && visited[nY][nX])) {
            dY = 1;
            dX = 0;
        } else if (nY === rowLen || (dY === 1 && visited[nY][nX])) {
            dY = 0;
            dX = -1;
        } else if (nX < 0 || (dX === -1 && visited[nY][nX])) {
            dY = -1;
            dX = 0;
        } else if (nY < 0 || (dY === -1 && visited[nY][nX])) {
            dY = 0;
            dX = 1;
        }

        y += dY;
        x += dX;
    }

    return ans;
}