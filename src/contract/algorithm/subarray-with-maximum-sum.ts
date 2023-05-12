
export function maxSubArraySum(data: number[]): number {
    let max_so_far = data[0];
    let curr_max = data[0];

    for (let i = 1; i < data.length; i++) {
        curr_max = Math.max(data[i], curr_max + data[i]);
        max_so_far = Math.max(max_so_far, curr_max);
    }

    return max_so_far;
}