import { Address, Arc } from "@daostack/client";
import { NotificationStatus } from "reducers/notifications";
import { Observable } from "rxjs";
import Util from "./lib/util";

const settings = {
  dev: {
    graphqlHttpProvider: "http://127.0.0.1:8000/subgraphs/name/daostack",
    graphqlWsProvider: "ws://127.0.0.1:8001/subgraphs/name/daostack",
    web3Provider: "ws://127.0.0.1:8545",
    ipfsProvider: "localhost",
    contractAddresses: getContractAddresses("private")
  },
  staging: {
    graphqlHttpProvider: "https://rinkeby.subgraph.daostack.io/subgraphs/name/v16-without-uc",
    graphqlWsProvider: "wss://ws.rinkeby.subgraph.daostack.io/subgraphs/name/v16-without-uc",
    web3Provider: `wss://rinkeby.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2`,
    ipfsProvider: {
      "host": "rinkeby.subgraph.daostack.io",
      "port": "443",
      "protocol": "https",
      "api-path": "/ipfs/api/v0/"
    },
    contractAddresses: getContractAddresses("rinkeby")
  },
  production: {
    graphqlHttpProvider: "https://subgraph.daostack.io/subgraphs/name/v16-without-uc",
    graphqlWsProvider: "wss://ws.subgraph.daostack.io/subgraphs/name/v16-without-uc",
    web3Provider: `wss://mainnet.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2`,
    ipfsProvider: {
      "host": "subgraph.daostack.io",
      "port": "443",
      "protocol": "https",
      "api-path": "/ipfs/api/v0/"
    },
    contractAddresses: getContractAddresses("mainnet")
  }
};

export function getContractAddresses(key: "private"|"rinkeby"|"mainnet") {
  const deployedContractAddresses = require("@daostack/migration/migration.json");

  const addresses = {
      ...deployedContractAddresses[key]
   };
  if (!addresses || addresses === {}) {
    throw Error(`No addresses found, does the file at "@daostack/migration/migration.json" exist?`);
  }
  return addresses.base;
}

// cf. https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md#ear-listening-for-selected-account-changes
// Polling is Evil!
// TODO: check if this (new?) function can replace polling: https://metamask.github.io/metamask-docs/Main_Concepts/Accessing_Accounts
export function pollForAccountChanges(web3: any, currentAccountAddress?: string, interval: number = 2000) {
  return Observable.create((observer: any) => {
    let account: any;
    let prevAccount = currentAccountAddress;
    const timeout = setInterval(() => {
      web3.eth.getAccounts().then((accounts: any) => {
        if (accounts) {
          account = accounts[0];
        } else if (web3.eth.accounts) {
          account = web3.eth.accounts[0].address;
        }
        account = account ? account.toLowerCase() : account;
        if (prevAccount !== account) {
          console.log(`ACCOUNT CHANGED; new account is ${account}`);
          observer.next(account);
          prevAccount = account;
        }
      });
    }, interval);
    return() => clearTimeout(timeout);
  });
}

/**
 * Checks if the web3 provider is as expected; throw an Error if it is not
 * @return
 */
export async function checkNetwork() {
  const web3: any = getArc().web3;
  const web3Provider = web3.currentProvider;
  if (web3Provider && web3Provider.isMetaMask) {
    const network = await web3.eth.net.getNetworkType();
    const networkName = Util.networkName(network);
    let expectedNetworkName;
    switch (process.env.NODE_ENV) {
      case "development": {
        expectedNetworkName = "ganache";
        break;
      }
      case "staging": {
        expectedNetworkName = "rinkeby";
        break;
      }
      case  "production": {
        expectedNetworkName = "main";
        break;
      }
      default: {
        throw new Error(`Uknown NODE_ENV: ${process.env.NODE_ENV}`);
      }

    }

    if (networkName === expectedNetworkName) {
      console.log(`Connected to ${networkName} in ${process.env.NODE_ENV} environment - this is great`);
    } else {
      const msg = `Please connect to "${expectedNetworkName}" (you are connected to "${networkName}" now)`;
      throw new Error(msg);
    }

  } else {
    // no metamask - we are perhaps testing? Anyway, we let this pass when the environment is development
    if (process.env.NODE_ENV === "development") {
      const msg = `No metamask connection found - you may not be able to do transactions`;
      console.warn(msg);
    } else {
      throw new Error(`No metamask instance found.`);
    }
  }
}

/**
 * get the current user from the web3 provider (metamask)
 * this function will throw an Error if there is anything wrong with the connection
 * (when no provider is available, or the provider is not the expected provider)
 * which need to be handled by the caller of the function
 * @return [description]
 */
export async function getCurrentUser(): Promise<Address> {
  await checkNetwork();
  const web3: any = getArc().web3;
  const accounts = await web3.eth.getAccounts();
  const address = accounts[0];
  return address ? address.toLowerCase() : address;
}

export function enableMetamask() {
  // check if Metamask account access is enabled, and if not, call the (async) function
  // that will ask the user to enable it
  const ethereum = (<any> window).ethereum;
  if (!ethereum) {
    const msg = `Please install or enable metamask`;
    throw Error(msg);
  }
  if (!ethereum.selectedAddress) {
    ethereum.enable().catch((err: Error) => {
      throw err;
    });
  }
}

/**
 * check if the web3 connection is ready to send transactions, and warn the user if it is not
 * @return true if things are fine, false if not
 */
export async function checkNetworkAndWarn(showNotification?: any): Promise<boolean> {
  try {
    await checkNetwork();
    return true;
  } catch (err) {
    // TODO: this should of course not be an alert, but a Modal
    const msg =  `Cannot send transction: ${err.message}`;
    if (showNotification) {
      showNotification(NotificationStatus.Failure, msg);
    } else {
      alert(msg);
    }
    return false;
  }
}

// get appropriate Arc configuration for the given environment
function getArcSettings(): any {
  let arcSettings: any;
  switch (process.env.NODE_ENV || "development") {
    case "development": {
      arcSettings = settings.dev;
      break;
    }
    case "staging" : {
      arcSettings = settings.staging;
      break;
    }
    case "production" : {
      arcSettings = settings.production;
      break;
    }
    default: {
      console.log(process.env.NODE_ENV === "development");
      throw Error(`Unknown NODE_ENV environment: "${process.env.NODE_ENV}"`);
    }
  }
  return arcSettings;
}

export function getArc(): Arc {
  // store the Arc instance in the global namespace on the 'window' object
  // (this is not best practice)
  if (typeof(window) !== "undefined" && (<any> window).arc) {
    return (<any> window).arc;
  } else {

    const arcSettings = getArcSettings();
    console.log(`Found NODE_ENV "${process.env.NODE_ENV}", using the following settings for Arc`);
    console.log(arcSettings);
    console.log(`alchemy-server (process.env.API_URL): ${process.env.API_URL}`);
    const arc: Arc = new Arc(arcSettings);
    if (typeof(window) !== "undefined") {
      (<any> window).arc = arc;
    }
    return arc;
  }
}

export { Arc };
