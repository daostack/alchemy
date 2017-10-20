var GenesisScheme = require('arc/build/contracts/GenesisScheme.json');

const ethEnv = process.env.ETH_ENV

let currentChainId, currentChain = ethEnv;

switch (ethEnv) {
  case 'livenet':
    currentChainId = '1';
    break;
  case 'ropsten':
    currentChainId = '3'
    break;
  case 'kovan':
    currentChainId = '42'
    break;
  default:
    currentChain = 'testrpc';
    currentChainId = Object.keys(GenesisScheme.networks).pop();
}

export const CURRENT_CHAIN = currentChain
export const CURRENT_CHAIN_ID = currentChainId

export enum ActionTypes {
  WEB3_CONNECTED = "WEB3_CONNECTED",
  WEB3_CHANGE_ACCOUNT = "WEB3_CHANGE_ACCOUNT",
  OTHER_ACTION = "__any_other_action_type__"
}