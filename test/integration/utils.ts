const chai = require("chai");

global.expect = chai.expect;
chai.Should();

const Web3 = require("web3");
// uppercase W cause its a constructor used to create instances of web3 library.
const web3 = new Web3("http://127.0.0.1:8545");

export const LATEST_ARC_VERSION = "0.0.1-rc.19";
// because we do not have a "real" dutchX test, we'll just choose one (older) version
// not thtat the correct address (migration.private.base[VERSION_FOR_DUTCHX_TEST]. GEenericScheme)
// needs to be set in the generiscEhemeRegiststry/dutchx.json file for the tests to pass
// (ie.e. for version 0.0.1-rc.17 this is 0xa6f8431c9eee4ac2859207af4004f7a948924c30)
export const VERSION_FOR_DUTCHX_TEST = "0.0.1-rc.17";

export function getContractAddresses() {
  // contract addresses for testing...
  const migration = require("@daostack/migration/migration.json")["private"];
  const contracts: {
    base: {[address: string]: string};
    dao: {[address: string]: string};
    test: {[address: string]: string};
    dutchx: {[address: string]: string};
  } = { base: {}, dao: {}, test: {}, dutchx: {} };
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

  for (const name of Object.keys(migration.base[VERSION_FOR_DUTCHX_TEST])) {
    contracts.dutchx[name] = migration.base[VERSION_FOR_DUTCHX_TEST][name];
  }
  for (const name of Object.keys(migration.test[VERSION_FOR_DUTCHX_TEST])) {
    contracts.dutchx[name] = migration.test[VERSION_FOR_DUTCHX_TEST][name];
  }

  return contracts;
}

export const userAddresses = [
  "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
];

export async function timeTravel(seconds: number) {
  await advanceTime(seconds);
  await advanceBlock();
}

const advanceTime = (time: number) => {
  return web3.currentProvider.send({
    jsonrpc: "2.0",
    method: "evm_increaseTime",
    params: [time],
    id: new Date().getTime(),
  });
};

const advanceBlock = () => {
  return web3.currentProvider.send({
    jsonrpc: "2.0",
    method: "evm_mine",
    id: new Date().getTime(),
  });
};

// const jsonrpc = '2.0'
// const id = 0
// const send = (method, params = []) =>
//   web3.currentProvider.send({ id, jsonrpc, method, params })

// const timeTravel = async seconds => {
//   await send('evm_increaseTime', [seconds])
//   await send('evm_mine')
// }
// module.exports = timeTravel
