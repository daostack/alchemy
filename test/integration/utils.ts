export const chai = require("chai");
global.expect = chai.expect;
chai.Should();

export function getContractAddresses() {
  const path = "@daostack/migration/migration.json";
  const addresses = { ...require(path).private.base, ...require(path).private.dao };
  if (!addresses || addresses === {}) {
    throw Error(`No addresses found, does the file at ${path} exist?`);
  }
  return addresses;
}

export const userAddresses = [
  "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1"
];
