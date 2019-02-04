import { Arc } from '@daostack/client'
// import { getLocalContractAddresses } from './lib/util'

const graphqlHttpProvider: string = 'http://127.0.0.1:8000/subgraphs/name/daostack'
const graphqlWsProvider: string = 'ws://127.0.0.1:8001/subgraphs/name/daostack'
const web3HttpProvider: string = 'http://127.0.0.1:8545'
const web3WsProvider: string = 'ws://127.0.0.1:8545'
// must use localhost here because of cors issues
// const ipfsProvider: string = '/ip4/localhost/tcp/5001'
const ipfsProvider: string = 'localhost'

function getLocalContractAddresses() {
  const deployedContractAddresses = require(`../config/migration.json`)

  const addresses = {
      ...deployedContractAddresses.private,
   }
  if (!addresses || addresses === {}) {
      throw Error(`No addresses found, does the file at ${'../../config/migration.json'} exist?`)
    }
  return addresses
}
const contractAddresses = getLocalContractAddresses()

export const arc = new Arc({
  graphqlHttpProvider,
  graphqlWsProvider,
  web3HttpProvider,
  web3WsProvider,
  ipfsProvider,
  contractAddresses
})
