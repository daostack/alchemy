import { Address, Arc } from "@daostack/client";
import { NotificationStatus } from "reducers/notifications";
import { Observable } from "rxjs";
import { getNetworkId, getNetworkName, getNetworkNameFromId } from "./lib/util";

const settings = {
  dev: {
    graphqlHttpProvider: "http://127.0.0.1:8000/subgraphs/name/daostack",
    graphqlWsProvider: "ws://127.0.0.1:8001/subgraphs/name/daostack",
    web3Provider: "ws://127.0.0.1:8545",
    web3ProviderRead: "ws://127.0.0.1:8545",
    ipfsProvider: "localhost",
  },
  staging: {
    graphqlHttpProvider: "https://rinkeby.subgraph.daostack.io/subgraphs/name/v23",
    graphqlWsProvider: "wss://ws.rinkeby.subgraph.daostack.io/subgraphs/name/v23",
    web3Provider: "wss://rinkeby.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2",
    web3ProviderRead: "wss://rinkeby.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2",
    ipfsProvider: {
      "host": "rinkeby.subgraph.daostack.io",
      "port": "443",
      "protocol": "https",
      "api-path": "/ipfs/api/v0/",
    },
  },
  production: {
    graphqlHttpProvider: "https://subgraph.daostack.io/subgraphs/name/v23",
    graphqlWsProvider: "wss://ws.subgraph.daostack.io/subgraphs/name/v23",
    web3Provider: "wss://mainnet.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2",
    web3ProviderRead: "wss://mainnet.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2",
    ipfsProvider: {
      "host": "subgraph.daostack.io",
      "port": "443",
      "protocol": "https",
      "api-path": "/ipfs/api/v0/",
    },
  },
};

export function getArc(): Arc {
  // store the Arc instance in the global namespace on the 'window' object
  // (this is not best practice)
  const arc = (window as any).arc;
  if (!arc) {
    throw Error("window.arc is not defined - please call initializeArc first");
  }
  return arc;
}

/**
 * check if a metamask instanse is available and an account is unlocked
 * @return [description]
 */
export function getMetaMask(): any {
  const ethereum = (window as any).ethereum;
  return ethereum;
}

export function getNetworkNameSync(id?: string): "main"|"rinkeby"|"private"|"unknown" {

  if (!id) {
    const web3Provider = getMetaMask();

    if (!web3Provider) {
      throw new Error("getNetworkNameSync: missing web3Provider");
    }

    id = web3Provider.__networkId;
  }
  
  return getNetworkNameFromId(id);
}

/**
 * Checks if the web3 Provider is ready to send transactions and configured as expected;
 * throws an Error if something is wrong, returns the web3 connection if that is ok
 * @return
 */
export async function checkWeb3Provider(): Promise<any> {

  const web3Provider = getMetaMask();

  if (!web3Provider) {
    const msg = "Please install or enable Metamask or Gnosis Safe";
    throw Error(msg);
  }

  const networkId = await getNetworkId(web3Provider);
  const networkName = await getNetworkName(networkId);

  let expectedNetworkName;
  switch (process.env.NODE_ENV) {
    case "development": {
      expectedNetworkName = networkName; // take what we get in development
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
      throw new Error(`Unknown NODE_ENV: ${process.env.NODE_ENV}`);
    }
  }

  if (networkName === expectedNetworkName) {
    // save for future reference
    web3Provider.__networkId = networkId;
    return web3Provider;
  } else {
    const msg = `Please connect to "${expectedNetworkName}"`;
    throw new Error(msg);
  }
}

/**
 * check if the web3 connection is ready to send transactions, and warn the user if it is not
 *
 * @param showNotification the warning will be sent using the showNotification function;
 *    it will use `alert()` if no such function is provided
 * @return the web3 connection, if everything is fine
 */
export async function checkWeb3ProviderAndWarn(showNotification?: any): Promise<boolean> {
  try {
    const web3Provider = await checkWeb3Provider();
    await web3Provider.enable();
    return web3Provider;
  } catch (err) {
    const msg =  err.message;
    if (msg.match(/enable metamask/i) && process.env.NODE_ENV === "development") {
      console.log( "No metamask connection found - we are in \"development\" environment, so this may be ok");
      return true;
    } else {
      if (showNotification) {
        showNotification(NotificationStatus.Failure, msg);
      } else {
        alert(msg);
      }
    }
  }
}


/**
 * get the current user from the web3 Provider
 * @return [description]
 */
export async function getCurrentAccountAddress(): Promise<Address> {
  const web3 = getArc().web3;
  const accounts = await web3.eth.getAccounts();
  return accounts[0] ? accounts[0].toLowerCase() : null;
}

export async function enableMetamask(): Promise<any> {
  // check if Metamask account access is enabled, and if not, call the (async) function
  // that will ask the user to enable it
  const ethereum = getMetaMask();
  if (!ethereum) {
    const msg = "Please install or enable metamask or Gnosis Safe";
    throw Error(msg);
  }
  await ethereum.enable();
  return ethereum;
}

/**
 * Return a web3 if we have one.
 */
export function getWeb3(): any {
  const arc = (window as any).arc;
  const web3 = arc ? arc.web3 : null;
  return web3;
}

// get appropriate Arc configuration for the given environment
async function getArcSettings(): Promise<any> {

  let arcSettings: any;

  switch (process.env.NODE_ENV || "development") {
    case "development": {
      const web3Provider = getMetaMask();
      if (web3Provider) {
        // take what would be consistent with how MM is set
        const networkId = await getNetworkId(web3Provider);
        switch(networkId) {
          case "1":
            arcSettings = settings.production;
            break;
          case "4":
            arcSettings = settings.staging;
            break;
          default:
            arcSettings = settings.dev;
            break;
        }
      } else {
        arcSettings = settings.dev;
      }
      break;
    }

    case "staging": {
      arcSettings = settings.staging;
      break;
    }
    case "production": {
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

export async function initializeArc(): Promise<Arc> {
  const arcSettings = await getArcSettings();

  try {
    arcSettings.web3Provider = await checkWeb3Provider();

  } catch (err) {
    // metamask is not correctly configured or available, so we use the default (read-only) web3 provider
    console.log(err);
  }

  // log some useful info
  // console.log(`Found NODE_ENV "${process.env.NODE_ENV}", using the following settings for Arc`);
  // console.log(arcSettings);
  // console.log(`alchemy-server (process.env.API_URL): ${process.env.API_URL}`);
  if (arcSettings.web3Provider.isSafe) {
    console.log("Using Gnosis Safe");
  } else if (arcSettings.web3Provider.isMetaMask) {
    console.log("Using MetaMask");
  } else {
    console.log("Using default Web3 (read-only) provider");
  }

  const arc: Arc = new Arc(arcSettings);
  // get contract information from the subgraph
  const contractInfos = await arc.getContractInfos();
  arc.setContractInfos(contractInfos);
  // save the object on a global window object (I know, not nice, but it works..)
  (window  as any).arc = arc;
  return arc;
}

// cf. https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md#ear-listening-for-selected-account-changes
export function pollForAccountChanges(currentAccountAddress?: string, interval: number = 2000) {
  console.log("start polling for account changes");
  return Observable.create((observer: any) => {
    let prevAccount = currentAccountAddress;
    function emitIfNewAccount() {
      getCurrentAccountAddress()
        .then((account) => {
          if (prevAccount !== account) {
            observer.next(account);
            prevAccount = account;
          }
        })
        .catch((err) => { console.warn(err.message); });
    }

    emitIfNewAccount();
    const timeout = setInterval(emitIfNewAccount, interval);
    return () => clearTimeout(timeout);
  });
}
