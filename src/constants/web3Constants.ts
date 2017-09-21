var GenesisScheme = require('arc/build/contracts/GenesisScheme.json');

let currentChainId = Object.keys(GenesisScheme.networks).pop()
let currentChain = 'testrpc'

const ethEnv = process.env.ETH_ENV

if (ethEnv === 'ropsten') {
  currentChain = 'ropsten'
  currentChainId = '3'
}
if (ethEnv === 'kovan') {
  currentChain = 'kovan'
  currentChainId = '42'
}
if (ethEnv === 'livenet') {
  currentChain = 'livenet'
  currentChainId = '1'
}

export const CURRENT_CHAIN = currentChain
export const CURRENT_CHAIN_ID = currentChainId
