/**
 * You are located in the top-left corner of the following grid:

  [[0,0,0,0,1,0,0,1,1,0,1],
   [0,0,0,1,0,0,1,0,1,0,0],
   [0,0,0,0,0,0,0,1,0,0,1],
   [0,0,1,0,1,0,1,0,0,1,1],
   [0,1,0,0,0,0,1,1,0,0,0],
   [0,0,0,0,0,0,0,1,0,1,0],
   [0,0,0,0,0,1,0,0,0,0,0],
   [0,0,1,1,1,0,1,0,0,0,0],
   [1,1,0,0,0,0,0,0,0,0,0]]

You are trying to find the shortest path to the bottom-right corner of the grid, but there are obstacles on the grid that you cannot move onto. These obstacles are denoted by '1', while empty spaces are denoted by 0.

Determine the shortest path from start to finish, if one exists. The answer should be given as a string of UDLR characters, indicating the moves along the path

NOTE: If there are multiple equally short paths, any of them is accepted as answer. If there is no path, the answer should be an empty string.
NOTE: The data returned for this contract is an 2D array of numbers representing the grid.

Examples:

    [[0,1,0,0,0],
     [0,0,0,1,0]]

Answer: 'DRRURRD'

    [[0,1],
     [1,0]]

Answer: ''

 */

import { NS } from "@ns";

export function main(ns: NS): void {
    let grid = [
        [0, 1, 0, 0, 0],
        [0, 0, 0, 1, 0]];

    let path = findShortestPath(grid);
    ns.print(`Expect 'DRRURRD', got '${path}'`);

    grid = [
        [0, 1],
        [1, 0]];
    path = findShortestPath(grid);
    ns.print(`Expect '', got '${path}'`);
}

export function findShortestPath(grid: number[][]): string {
    let path = '';
    let visited: number[][] = [];
    let queue: { x: number, y: number, path: string }[] = [{ x: 0, y: 0, path: '' }];
    while (queue.length > 0) {
        let current = queue.shift()!;
        if (current.x == grid.length - 1 && current.y == grid[0].length - 1) {
            path = current.path;
            break;
        }
        visited.push([current.x, current.y]);
        let neighbors = getNeighbors(current.x, current.y, grid);
        for (let neighbor of neighbors) {
            if (!visited.some(v => v[0] == neighbor.x && v[1] == neighbor.y)) {
                queue.push({ x: neighbor.x, y: neighbor.y, path: current.path + neighbor.direction });
            }
        }
    }
    return path;
}

function getNeighbors(x: number, y: number, grid: number[][]): { x: number, y: number, direction: string }[] {
    let neighbors: { x: number, y: number, direction: string }[] = [];
    if (x > 0 && grid[x - 1][y] == 0) {
        neighbors.push({ x: x - 1, y: y, direction: 'U' });
    }
    if (x < grid.length - 1 && grid[x + 1][y] == 0) {
        neighbors.push({ x: x + 1, y: y, direction: 'D' });
    }
    if (y > 0 && grid[x][y - 1] == 0) {
        neighbors.push({ x: x, y: y - 1, direction: 'L' });
    }
    if (y < grid[0].length - 1 && grid[x][y + 1] == 0) {
        neighbors.push({ x: x, y: y + 1, direction: 'R' });
    }
    return neighbors;
}