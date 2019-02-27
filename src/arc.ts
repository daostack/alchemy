import { Arc } from "@daostack/client";
import Util from "lib/util";
import { Observable } from "rxjs";

const Web3 = require("web3");

const providers = {
  dev: {
    graphqlHttpProvider: "http://127.0.0.1:8000/subgraphs/name/daostack",
    graphqlWsProvider: "ws://127.0.0.1:8001/subgraphs/name/daostack",
    web3Provider: "ws://127.0.0.1:8545",
    ipfsProvider: "localhost",
    contractAddresses: getContractAddresses("private")
  },
  staging: {
    graphqlHttpProvider: "https://subgraph.daostack.io/subgraphs/name/daostack",
    graphqlWsProvider: "wss://ws.subgraph.daostack.io/subgraphs/name/daostack",
    web3Provider: `https://rinkeby.infura.io/16bDz7U53RbXysQiYOyc`,
    ipfsProvider: {
       host: "ipfs.infura.io",
       port: "5001",
       protocol: "https"
    },
    contractAddresses: getContractAddresses("rinkeby")
  },
  production: {
    graphqlHttpProvider: "",
    graphqlWsProvider: "",
    web3WsProvide: "",
    ipfsProvider: {
       host: "ipfs.infura.io",
       port: "5001",
       protocol: "https"
    },
    contractAddresses: getContractAddresses("main")
  }
};

function getContractAddresses(key: "private"|"rinkeby"|"main") {

  const deployedContractAddresses = require(`../config/migration.json`);

  const addresses = {
      ...deployedContractAddresses[key],
   };
  if (!addresses || addresses === {}) {
      throw Error(`No addresses found, does the file at ${"../../config/migration.json"} exist?`);
    }
  return addresses;
}

// TODO: move pollforAccountChanges to client lib? (as an currentAddres(): Observable<Address>)
// Polling is Evil!
// cf. https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md#ear-listening-for-selected-account-changes
export function pollForAccountChanges(web3: any, interval: number = 2000) {
  return Observable.create((observer: any) => {
    let account: any;
    let prevAccount: any;
    let timeout = setInterval(() => {
      web3.eth.getAccounts().then((accounts: any) => {
        if (accounts) {
          account = accounts[0];
        } else if (web3.eth.accounts) {
          account = web3.eth.accounts[0].address;
        }
        if (prevAccount !== account && account) {
          console.log(`ACCOUNT CHANGED; new account is ${account}`);
          web3.eth.defaultAccount = account;
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
export function checkNetwork(web3: any) {
  // if we are connected with metamask, we find the right settings
  const web3Provider = web3.currentProvider;
  if (web3Provider && web3Provider.isMetaMask) {
    const networkName = Util.networkName(web3Provider.networkVersion);
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
      return true;
    } else {
      // TODO: error message is for developers, need to write something more user friendly here
      const msg = `YOU ARE NOT CONNECTED to "${expectedNetworkName})" (you are connected to "${networkName}" instead; in "${process.env.NODE_ENV}" environment). PLEASE SWITCH`;
      throw new Error(msg);
    }
  } else {
    // no metamask - we are perhaps testing? Anyway, we let this pass when the environment is development
    if (process.env.NODE_ENV === "development") {
      const msg = `No metamask connection found - you may not be able to do transactions`;
      console.warn(msg);
    }
  }
}
/**
 * try to get the web3 provider from the browser; if we cannnot return a sane default value
 * @return A Web3 provider
 */
export function getWeb3Provider() {
  let web3Provider;

  // get the web3 provider from the browser or from the Web3 object
  if (typeof window !== "undefined" &&
    (typeof (window as any).ethereum !== "undefined" || typeof (window as any).web3 !== "undefined")
  ) {
    // Web3 browser user detected. You can now use the provider.
    web3Provider = (window as any).ethereum || (window as any).web3.currentProvider;
  } else {
    web3Provider = Web3.givenProvider;
  }

  if (!web3Provider) {
    // TODO: fallback on Portis
    let fallbackWeb3Provider: string;
    if (process.env.NODE_ENV === "development") {
      fallbackWeb3Provider = providers.dev.web3Provider;
    } else {
      // TODO: provide read-only web3 provider (like infura) for staging and production environments
      fallbackWeb3Provider = providers.staging.web3Provider;
    }
    console.warn(`NO WEB3 PROVIDER PROVIDED BY BROWSER: using ${fallbackWeb3Provider}`);
  }
  return web3Provider;
}

// get appropriate Arc configuration for the given environment
function getArcSettings(): any {
  let arcSettings: any;
  switch (process.env.NODE_ENV) {
    case "development": {
      arcSettings = providers.dev;
      break;
    }
    case "staging" : {
      arcSettings = providers.staging;
      break;
    }
    // case "production" : {
    //   arcSettings = providers.production;
    //   break;
    // }
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
    console.log(`Using the following settings for Arc`);
    console.log(arcSettings);
    const arc: Arc = new Arc(arcSettings);
    if (typeof(window) !== "undefined") {
      (<any> window).arc = arc;
    }
    return arc;
  }
}

export { Arc };
