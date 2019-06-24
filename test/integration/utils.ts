export const chai = require("chai");
global.expect = chai.expect;
chai.Should();

export const LATEST_ARC_VERSION = "0.0.1-rc.19";

export function getContractAddresses() {
  // contract addresses for testing...
  const migration = require("@daostack/migration/migration.json")["private"];
  const contracts: {
    base: {[address: string]: string},
    dao: {[address: string]: string},
    test: {[address: string]: string},
  } = { base: {}, dao: {}, test: {}};
  const version = LATEST_ARC_VERSION;
  for (const name of Object.keys(migration.base[version])) {
    contracts.base[name] = migration.base[version][name];
  }
  for (const name of Object.keys(migration.test[version])) {
    contracts.test[name] = migration.test[version][name];
  }
  for (const name of Object.keys(migration.dao[version])) {
    contracts.dao[name] = migration.dao[version][name];
  }

  return contracts;
}

export const userAddresses = [
  "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1"
];
