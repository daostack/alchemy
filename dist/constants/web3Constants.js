"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var GenesisScheme = require('arc/build/contracts/GenesisScheme.json');
const ethEnv = process.env.ETH_ENV;
let currentChainId, currentChain = ethEnv;
switch (ethEnv) {
    case 'livenet':
        currentChainId = '1';
        break;
    case 'ropsten':
        currentChainId = '3';
        break;
    case 'kovan':
        currentChainId = '42';
        break;
    default:
        currentChain = 'testrpc';
        currentChainId = Object.keys(GenesisScheme.networks).pop();
}
exports.CURRENT_CHAIN = currentChain;
exports.CURRENT_CHAIN_ID = currentChainId;
var ActionTypes;
(function (ActionTypes) {
    ActionTypes["WEB3_CONNECTED"] = "WEB3_CONNECTED";
    ActionTypes["WEB3_CHANGE_ACCOUNT"] = "WEB3_CHANGE_ACCOUNT";
    ActionTypes["OTHER_ACTION"] = "__any_other_action_type__";
})(ActionTypes = exports.ActionTypes || (exports.ActionTypes = {}));
//# sourceMappingURL=web3Constants.js.map