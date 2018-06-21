// TODO: how to get ganache chain id? var GenesisScheme = require('arc/build/contracts/GenesisScheme.json');

const ethEnv = process.env.ETH_ENV;

let currentChainId, currentChain = ethEnv;

switch (ethEnv) {
  case "livenet":
    currentChainId = "1";
    break;
  case "ropsten":
    currentChainId = "3";
    break;
  case "kovan":
    currentChainId = "42";
    break;
  default:
    currentChain = "ganache";
    currentChainId = "0"; // TODO: do we need this? Object.keys(GenesisScheme.networks).pop();
}

export const CURRENT_CHAIN = currentChain;
export const CURRENT_CHAIN_ID = currentChainId;

export enum ActionTypes {
  WEB3_CONNECT = "WEB3_CONNECT",
  WEB3_SET_ACCOUNT = "WEB3_SET_ACCOUNT",
  WEB3_ON_ETH_BALANCE_CHANGE = "WEB3_ON_ETH_BALANCE_CHANGE",
  WEB3_ON_GEN_BALANCE_CHANGE = "WEB3_ON_GEN_BALANCE_CHANGE",
  WEB3_ON_GEN_STAKING_ALLOWANCE_CHANGE = "WEB3_ON_GEN_STAKING_ALLOWANCE_CHANGE",
  APPROVE_STAKING_GENS = "APPROVE_STAKING_GENS",
  OTHER_ACTION = "__any_other_action_type__",
}
