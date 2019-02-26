import { Arc } from "@daostack/client";
import Util from "lib/util";
import { Observable } from "rxjs";

const Web3 = require("web3");

const INFURA_KEY = "16bDz7U53RbXysQiYOyc";

const providers = {
  dev: {
    graphqlHttpProvider: "http://127.0.0.1:8000/subgraphs/name/daostack",
    graphqlWsProvider: "ws://127.0.0.1:8001/subgraphs/name/daostack",
    web3Provider: "ws://127.0.0.1:8545",
    ipfsProvider: "localhost",
    contractAddresses: getContractAddresses("private")
  },
  staging: {
    graphqlHttpProvider: "",
    graphqlWsProvider: "",
    web3Provider: `https://rinkeby.infura.io/${INFURA_KEY}`,
    ipfsProvider: "ipfs.infura.io",
    contractAddresses: getContractAddresses("rinkeby")
  },
  production: {
    graphqlHttpProvider: "",
    graphqlWsProvider: "",
    web3WsProvide: "",
    ipfsProvider: "",
    contractAddresses: getContractAddresses("main")
  }
};
// default values for providers. This should be manageed depending on the deployment location
// const graphqlHttpProvider: string = "http://127.0.0.1:8000/subgraphs/name/daostack";
// const graphqlWsProvider: string = "ws://127.0.0.1:8001/subgraphs/name/daostack";
const web3WsProvider: string = "ws://127.0.0.1:8545";
// must use "localhost" here because of cors issues
// const ipfsProvider: string = '/ip4/localhost/tcp/5001'
// const ipfsProvider: string = "localhost";

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
          if (prevAccount) {
            console.log(`ACCOUNT CHANGED; new account is ${account}`);
          }
          web3.eth.defaultAccount = account;
          observer.next(account);
          prevAccount = account;
        }
      });
    }, interval);
    return() => clearTimeout(timeout);
  });
}

export function getWeb3Provider() {
  let web3Provider;

  // get the web3 provider from the browser, fall back to any explicitly provided Web3 connection
  if (typeof window !== "undefined" &&
    (typeof (window as any).ethereum !== "undefined" || typeof (window as any).web3 !== "undefined")
  ) {
    // Web3 browser user detected. You can now use the provider.
    web3Provider = (window as any).ethereum || (window as any).web3.currentProvider;
  } else {
    web3Provider = Web3.givenProvider;
  }

  // print some info for developers

  if (web3Provider && web3Provider.isMetaMask) {
    console.log("Connected with Metamask");
  } else {
    // TODO: fallback on Portis
    console.warn(`NO WEB3 PROVIDER PROVIDED BY BROWSER: using default connection at ${web3WsProvider}`);
    if (process.env.NODE_ENV === "dev") {
      web3Provider = web3WsProvider;
    } else {
      // TODO: provide read-only web3 provider (like infura) for staging and production environments
      web3Provider = web3WsProvider;
    }
  }

  // if we are connect to metamask, we check if our Arc instance uses the same connection
  // if not, we ????
  if (web3Provider && web3Provider.isMetaMask) {
    console.log(web3Provider);
    const networkName = Util.networkName(web3Provider.networkVersion);
    if (networkName === "ganache") {
      console.log(`Connected to ${networkName} - this is great`);
    } else if (networkName === "rinkeby") {
      console.log(`Connected to ${networkName} - this is not working yet but will soon`);
    } else {
      console.warn(`YOU ARE NOT CONNECTED TO GANACHE (but to ${networkName}) - please switch your metamask connection to Kovan or Private network`);
    }
  }
  return web3Provider;
}

export function getArc(): Arc {
  // store the Arc instance in the global namespace on the 'window' object
  // (this is not best practice)
  if (typeof(window) !== "undefined" && (<any> window).arc) {
    return (<any> window).arc;
  } else {
    const web3Provider = getWeb3Provider();

    // if we are connected with metamask, we find the right settings
    let arcSettings: any;
    if (web3Provider && web3Provider.isMetaMask) {
      const networkName = Util.networkName(web3Provider.networkVersion);
      if (networkName === "ganache") {
        console.log(`Connected to ${networkName} - this is great`);
        arcSettings = providers.dev;
        console.log(arcSettings);
      } else if (networkName === "rinkeby") {
        console.log(`Connected to ${networkName} - this is great`);
        arcSettings = providers.staging;
        console.log(arcSettings);
      } else {
        const msg = `YOU ARE NOT CONNECTED TO GANACHE (but to ${networkName}) - please switch your metamask connection to Kovan or Private network`;
        console.warn(msg);
        throw Error(msg);
      }
    } else {
      const msg = `No metamask connection found - you may not be able to do transactions`;
      arcSettings = providers.dev;
    }

    const arc: Arc = new Arc(arcSettings);

    if (typeof(window) !== "undefined") {
      (<any> window).arc = arc;
    }

    return arc;
  }
}

export { Arc };
