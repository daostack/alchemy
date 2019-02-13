import { Arc } from '@daostack/client'

const Web3 = require('web3')

// default values for providers. This should be manageed depending on the deployment location
const graphqlHttpProvider: string = 'http://127.0.0.1:8000/subgraphs/name/daostack'
const graphqlWsProvider: string = 'ws://127.0.0.1:8001/subgraphs/name/daostack'
const web3HttpProvider: string = 'http://127.0.0.1:8545'
const web3WsProvider: string = 'ws://127.0.0.1:8545'
// must use "localhost" here because of cors issues
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

export function getArc(): Arc {

  if ((<any> window).arc) {
    return (<any> window).arc
  } else {
    let web3Provider
    if (typeof window !== 'undefined' &&
      (typeof (window as any).ethereum !== 'undefined' || typeof (window as any).web3 !== 'undefined')
    ) {
      // Web3 browser user detected. You can now use the provider.
      web3Provider = (window as any).ethereum || (window as any).web3.currentProvider
    } else {
      web3Provider = Web3.givenProvider || web3WsProvider || web3HttpProvider
    }

    // print some warnings for developers
    if (web3Provider.isMetaMask) {
      // TODO: start polling for a connection to become availabe
      // TODO: fallback on Portis
      console.warn(`NOT CONNECTED TO METAMASK: using default connection at ${web3WsProvider}`)
    }
    if (web3Provider.networkVersion !== '1512051714758') {
      console.warn(`YOU ARE NOT CONNECTED TO GANACHE - please switch conection to localhost:8545 for this development version`)
    }

    const arc: Arc = new Arc({
      graphqlHttpProvider,
      graphqlWsProvider,
      web3Provider,
      ipfsProvider,
      contractAddresses
    });
    if (!arc.web3.eth.defaultAccount) {
      console.warn(`NO ACCOUNT WAS SET - you will not be able to see your balance or do transactions`)
    }
    (<any> window).arc = arc
    return arc
  }
}

export { Arc }
