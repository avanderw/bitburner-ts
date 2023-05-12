
export function generateIpAddresses(data: string): string[] {
    let ret = [];
    for (let a = 1; a <= 3; ++a) {
        for (let b = 1; b <= 3; ++b) {
            for (let c = 1; c <= 3; ++c) {
                for (let d = 1; d <= 3; ++d) {
                    if (a + b + c + d === data.length) {
                        let A = parseInt(data.substring(0, a), 10);
                        let B = parseInt(data.substring(a, a + b), 10);
                        let C = parseInt(data.substring(a + b, a + b + c), 10);
                        let D = parseInt(data.substring(a + b + c, a + b + c + d), 10);
                        if (A <= 255 && B <= 255 && C <= 255 && D <= 255) {
                            let ip = [A.toString(), ".", B.toString(), ".", C.toString(), ".", D.toString()].join("");
                            if (ip.length === data.length + 3) {
                                ret.push(ip);
                            }
                        }
                    }
                }
            }
        }
    }
    return ret;
}
