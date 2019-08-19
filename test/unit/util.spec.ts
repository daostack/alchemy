import { formatTokens } from "lib/util";

const BN = require("bn.js");

describe("Redemptions page", () => {

  it("formatTokens should work as expected", async () => {
    expect(formatTokens(new BN(0))).toEqual("0");
    expect(formatTokens(new BN(1))).toEqual("+0");
    expect(formatTokens(new BN("1000000000000000000"))).toEqual("1");
    expect(formatTokens(new BN("1100000000000000000"))).toEqual("1.1");
    expect(formatTokens(new BN("2345000000000000000"))).toEqual("2.34");
    expect(formatTokens(new BN("2345000000000000000000"))).toEqual("2.34k");
    expect(formatTokens(new BN("2345000000000000000000000"))).toEqual("2.34M");
    expect(formatTokens(new BN("2222345000000000000000000000"))).toEqual("2,222.34M");
    expect(formatTokens(new BN("0999999999999999999"))).toEqual("0.99");
    expect(formatTokens(new BN("0099999999999999999"))).toEqual("0.09");
    expect(formatTokens(new BN("0009999999999999999"))).toEqual("+0");
    expect(formatTokens(new BN("123456789223456789333456789444456789"))).toEqual("123,456,789.22B");
  });
});
