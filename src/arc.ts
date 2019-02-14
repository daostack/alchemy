import { Arc } from '@daostack/client'
import { Observable } from 'rxjs'

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

// Polling is Evil!
// cf. https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md#ear-listening-for-selected-account-changes
export function pollForAccountChanges(web3: any, interval: number = 2000) {
  return Observable.create((observer: any) => {
    let account: any
    let prevAccount: any
    let timeout = setInterval(() => {
      web3.eth.getAccounts().then((accounts: any) => {
        if (accounts) {
          account = accounts[0]
          if (prevAccount !== account && account) {
            if (prevAccount) {
              console.log(`ACCOUNT CHANGED; new account is ${account}`)
            }
            web3.eth.defaultAccount = account
            observer.next(account)
            prevAccount = account
          }
        }
      })
    }, interval)
    return() => clearTimeout(timeout)
  })
}

export function getWeb3Provider() {
  let web3Provider
  if (typeof window !== 'undefined' &&
    (typeof (window as any).ethereum !== 'undefined' || typeof (window as any).web3 !== 'undefined')
  ) {
    // Web3 browser user detected. You can now use the provider.
    web3Provider = (window as any).ethereum || (window as any).web3.currentProvider
  } else {
    web3Provider = Web3.givenProvider || web3WsProvider || web3HttpProvider
  }

  // print some info for developers
  if (web3Provider.isMetaMask) {
    console.log('Connected with Metamask')
  } else {
    // TODO: fallback on Portis
    console.warn(`NOT CONNECTED WITH METAMASK: using default connection at ${web3WsProvider}`)
  }
  if (web3Provider.networkVersion !== '1512051714758') {
    console.warn(`YOU ARE NOT CONNECTED TO GANACHE (but to ${web3Provider.networkVersion}) - please switch conection to localhost: 8545 to enable transactions`)
  } else {
    console.log(`Connected to Ganache - this is great in this test phase`)
  }
  return web3Provider
}

export function getArc(): Arc {
  // TODO: we store the arc object in the window object, but the react
  if ((<any> window).arc) {
    return (<any> window).arc
  } else {
    const web3Provider = getWeb3Provider()

    const arc: Arc = new Arc({
      graphqlHttpProvider,
      graphqlWsProvider,
      web3Provider,
      ipfsProvider,
      contractAddresses
    });
    (<any> window).arc = arc;

    return arc
  }
}

export { Arc }
