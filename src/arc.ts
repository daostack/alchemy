import { Address, Arc } from "@daostack/client";
import { NotificationStatus } from "reducers/notifications";
import { Observable } from "rxjs";
import Util from "./lib/util";

const providers = {
  dev: {
    graphqlHttpProvider: "http://127.0.0.1:8000/subgraphs/name/daostack",
    graphqlWsProvider: "ws://127.0.0.1:8001/subgraphs/name/daostack",
    web3Provider: "ws://127.0.0.1:8545",
    ipfsProvider: "localhost",
    contractAddresses: getContractAddresses("private")
  },
  staging: {
    graphqlHttpProvider: "https://rinkeby.subgraph.daostack.io/subgraphs/name/daostack-alchemy-rinkeby",
    graphqlWsProvider: "wss://ws.rinkeby.subgraph.daostack.io/subgraphs/name/daostack-alchemy-rinkeby",
    web3Provider: `wss://rinkeby.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2`,
    ipfsProvider: {
       host: "ipfs.infura.io",
       port: "5001",
       protocol: "https"
    },
    contractAddresses: getContractAddresses("rinkeby")
  },
  production: {
    graphqlHttpProvider: "https://subgraph.daostack.io/subgraphs/name/daostack-alchemy-mainnet",
    graphqlWsProvider: "wss://subgraph.daostack.io/subgraphs/name/daostack-alchemy-mainnet",
    web3Provider: `wss://mainnet.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2`,
    ipfsProvider: {
       host: "ipfs.infura.io",
       port: "5001",
       protocol: "https"
    },
    contractAddresses: getContractAddresses("main")
  }
};

export function getContractAddresses(key: "private"|"rinkeby"|"main") {
  const deployedContractAddresses = require("@daostack/migration/migration.json");

  const addresses = {
      ...deployedContractAddresses[key],
   };
  if (!addresses || addresses === {}) {
      throw Error(`No addresses found, does the file at "@daostack/migration/migration.json" exist?`);
    }
  return addresses;
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
        if (prevAccount !== account && account) {
          console.log(`ACCOUNT CHANGED; new account is ${account}`);
          observer.next(account);
          prevAccount = account;
        }
      });
    }, interval);
    return() => clearTimeout(timeout);
  });
}

export function subscribeToAccountChanges(web3: any, currentAccountAddress?: Address) {
  let prevAccount = currentAccountAddress;
  return Observable.create((observer: any) => {
    const sub = web3.on("accountsChanged", (accounts: Address[]) => {
      const account = accounts[0];
      if (prevAccount !== account && account) {
          console.log(`ACCOUNT CHANGED; new account is ${account}`);
          observer.next(account);
          prevAccount = account;
        }
      }
    );
    return () => sub.unsubscribe();
  });
}

/**
 * Checks if the web3 provider is as expected; throw an Error if it is not
 * @return
 */
export function checkNetwork() {
  const web3: any = getArc().web3;
  const web3Provider = web3.currentProvider;
  if (web3Provider && web3Provider.isMetaMask) {
    // we are interacting with Metamask, let's just use window.ethereum to interact with MM
    const ethereum = (<any> window).ethereum;
    const networkName = Util.networkName(ethereum.networkVersion);
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
      // TODO: error message is for developers, need to write something more user friendly here
      const msg = `Please connect to "${expectedNetworkName}" (you are connected to "${networkName}" now)`;
      throw new Error(msg);
    }

    // check if Metamask account access is enabled, and if not, ask to enable it
    enableMetamask();
  } else {
    // no metamask - we are perhaps testing? Anyway, we let this pass when the environment is development
    if (process.env.NODE_ENV === "development") {
      const msg = `No metamask connection found - you may not be able to do transactions`;
      console.warn(msg);
    } else {
      throw new Error(`No metamask instance found - you may want to install that.`);
    }
  }
}

export function enableMetamask() {
  // check if Metamask account access is enabled, and if not, call the (async) function
  // that will ask the user to enable it
  const ethereum = (<any> window).ethereum;
  if (!ethereum) {
    const msg = `Please install metamask`;
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
export function checkNetworkAndWarn(showNotification?: any): boolean {
  try {
    checkNetwork();
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
      arcSettings = providers.dev;
      break;
    }
    case "staging" : {
      arcSettings = providers.staging;
      break;
    }
    case "production" : {
      throw Error("No settings for production NODE_ENV==\"production\" avaiable (yet)");
    //   arcSettings = providers.production;
      // break;
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
