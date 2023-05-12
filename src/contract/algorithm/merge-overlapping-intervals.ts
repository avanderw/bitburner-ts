
export function mergeOverlappingIntervals(intervals: number[][]): number[][] {
    intervals.sort((a, b) => a[0] - b[0]);
    let result: number[][] = [];
    let start = intervals[0][0];
    let end = intervals[0][1];
    for (const interval of intervals) {
        if (interval[0] <= end) {
            end = Math.max(end, interval[1]);
        } else {
            result.push([start, end]);
            start = interval[0];
            end = interval[1];
        }
    }
    result.push([start, end]);
    return result;
}