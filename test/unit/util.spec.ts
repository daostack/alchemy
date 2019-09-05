import { formatTokens, isValidUrl } from "lib/util";

const BN = require("bn.js");

describe("Redemptions page", () => {

  it("formatTokens should work as expected", async () => {
    expect(formatTokens(new BN(0))).toEqual("0");
    expect(formatTokens(new BN(1))).toEqual("+0");
    expect(formatTokens(new BN("1000000000000000000"))).toEqual("1");
    expect(formatTokens(new BN("10000000000000000000"))).toEqual("10");
    expect(formatTokens(new BN("100000000000000000000"))).toEqual("100");
    expect(formatTokens(new BN("1100000000000000000"))).toEqual("1.1");
    expect(formatTokens(new BN("2345000000000000000"))).toEqual("2.34");
    expect(formatTokens(new BN("10000000000000000000000"))).toEqual("10k");
    expect(formatTokens(new BN("2345000000000000000000"))).toEqual("2.34k");
    expect(formatTokens(new BN("2345000000000000000000000"))).toEqual("2.34M");
    expect(formatTokens(new BN("2222345000000000000000000000"))).toEqual("2,222.34M");
    expect(formatTokens(new BN("0999999999999999999"))).toEqual("0.99");
    expect(formatTokens(new BN("0099999999999999999"))).toEqual("0.09");
    expect(formatTokens(new BN("0009999999999999999"))).toEqual("+0");
    expect(formatTokens(new BN("123456789223456789333456789444456789"))).toEqual("123,456,789.22B");
  });
});

describe("isValidUrl", () => {

  it("isValidUrl should work as expected", async () => {
    expect(isValidUrl("toot.com")).toEqual(true);
    expect(isValidUrl("www.toot.com")).toEqual(true);
    expect(isValidUrl("http://toot.com")).toEqual(true);
    expect(isValidUrl("http://www.tank.com")).toEqual(true);
    expect(isValidUrl("https://toot.com")).toEqual(true);
    expect(isValidUrl("http://toot.com:3000")).toEqual(true);
    expect(isValidUrl("http://toot.com?m=1")).toEqual(true);
    expect(isValidUrl("http://toot.com:4000?m")).toEqual(true);
    expect(isValidUrl("http://toot.com:4000?m=1")).toEqual(true);
    expect(isValidUrl("http://toot.com:4000?m=1&n")).toEqual(true);
    expect(isValidUrl("http://toot.com:4000?m=1&n=flarg")).toEqual(true);
    expect(isValidUrl("http://t.ca")).toEqual(true);
    expect(isValidUrl("http://t.amsterdam")).toEqual(true);
    expect(isValidUrl("http://t.ca?")).toEqual(true);
    expect(isValidUrl("http://t.ca/flank")).toEqual(true);
    expect(isValidUrl("http://t.ca/flank/tank")).toEqual(true);
    expect(isValidUrl("http://t.ca/flank/tank.html")).toEqual(true);
    expect(isValidUrl("http://toot.com:4000?m=1&n,flarg")).toEqual(true);
    expect(isValidUrl("http://toot.com:4000?m=1&n#20flarg")).toEqual(true);

    expect(isValidUrl("http://t.c")).toEqual(false);
    expect(isValidUrl("http://t,c")).toEqual(false);
    expect(isValidUrl("http://toot com")).toEqual(false);
    expect(isValidUrl(" http://toot com")).toEqual(false);
    expect(isValidUrl(" http://toot.com")).toEqual(false);
    expect(isValidUrl("httpb://toot.com")).toEqual(false);
    expect(isValidUrl("http://toot^com")).toEqual(false);
    // the caller is responsible for trimming
    expect(isValidUrl("http://toot.com ")).toEqual(false);
  });
});
