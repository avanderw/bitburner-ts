/**
 * You are given the following data, representing a graph:
 * [10,[[3,8],[0,4],[5,7],[1,5],[2,7],[6,7],[0,5],[4,7],[2,8],[3,4]]]
 * Note that "graph", as used here, refers to the field of graph theory, and has no relation to statistics or plotting. The first element of the data represents the number of vertices in the graph. Each vertex is a unique number between 0 and 9. The next element of the data represents the edges of the graph. Two vertices u,v in a graph are said to be adjacent if there exists an edge [u,v]. Note that an edge [u,v] is the same as an edge [v,u], as order does not matter. You must construct a 2-coloring of the graph, meaning that you have to assign each vertex in the graph a "color", either 0 or 1, such that no two adjacent vertices have the same color. Submit your answer in the form of an array, where element i represents the color of vertex i. If it is impossible to construct a 2-coloring of the given graph, instead submit an empty array.
 * 
 * Examples:
 * 
 * Input: [4, [[0, 2], [0, 3], [1, 2], [1, 3]]]
 * Output: [0, 0, 1, 1]
 * 
 * Input: [3, [[0, 1], [0, 2], [1, 2]]]
 * Output: []
 */
import { NS } from "@ns";

export async function main(ns: NS) {
    let data = [10, [[3, 8], [0, 4], [5, 7], [1, 5], [2, 7], [6, 7], [0, 5], [4, 7], [2, 8], [3, 4]]];
    let expect = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1];
    let result = graphColoring(data);
    ns.tprintf(`Expect: ${expect}, Result: ${result}`);

    data = [4, [[0, 2], [0, 3], [1, 2], [1, 3]]];
    expect = [0, 0, 1, 1];
    result = graphColoring(data);
    ns.tprintf(`Expect: ${expect}, Result: ${result}`);

    data = [3, [[0, 1], [0, 2], [1, 2]]];
    expect = [];
    result = graphColoring(data);
    ns.tprintf(`Expect: ${expect}, Result: ${result}`);
}

export function graphColoring(data: (number | number[][])[]): number[] {
    let n = data[0] as number;
    let edges = data[1] as number[][];
    let adj = new Array(n);
    for (let i = 0; i < n; i++) {
        adj[i] = [];
    }
    for (const edge of edges) {
        let u = edge[0];
        let v = edge[1];
        adj[u].push(v);
        adj[v].push(u);
    }
    let colors = new Array(n);
    for (let i = 0; i < n; i++) {
        colors[i] = -1;
    }
    let color = 0;
    for (let i = 0; i < n; i++) {
        if (colors[i] == -1) {
            if (!dfs(adj, colors, i, color)) {
                return [];
            }
            color = 1 - color;
        }
    }
    return colors;
}

function dfs(adj: number[][], colors: number[], u: number, color: number): boolean {
    colors[u] = color;
    for (const v of adj[u]) {
        if (colors[v] == -1) {
            if (!dfs(adj, colors, v, 1 - color)) {
                return false;
            }
        } else if (colors[v] == color) {
            return false;
        }
    }
    return true;
}
