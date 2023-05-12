
export function largestPrimeFactor(num: number): number {
    const factors = [];
    let d = 2;
    let n = num;
    while (n > 1) {
        while (n % d == 0) {
            factors.push(d);
            n /= d;
        }
        d++;
    }

    return Math.max(...factors);
}
