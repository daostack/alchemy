import { Address, Arc } from "@daostack/client";
import { waitUntilTrue} from "lib/util";
import { NotificationStatus } from "reducers/notifications";
import { Observable } from "rxjs";
// const Web3 = require("web3");
import Web3Connect from "web3connect";
import { getNetworkName } from "./lib/util";

let selectedPovider: any;

const settings = {
  dev: {
    graphqlHttpProvider: "http://127.0.0.1:8000/subgraphs/name/daostack",
    graphqlWsProvider: "ws://127.0.0.1:8001/subgraphs/name/daostack",
    web3Provider: "ws://127.0.0.1:8545",
    ipfsProvider: "localhost",
  },
  staging: {
    graphqlHttpProvider: "https://rinkeby.subgraph.daostack.io/subgraphs/name/v23",
    graphqlWsProvider: "wss://ws.rinkeby.subgraph.daostack.io/subgraphs/name/v23",
    web3Provider: `wss://rinkeby.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2`,
    ipfsProvider: {
      "host": "rinkeby.subgraph.daostack.io",
      "port": "443",
      "protocol": "https",
      "api-path": "/ipfs/api/v0/"
    },
  },
  production: {
    graphqlHttpProvider: "https://subgraph.daostack.io/subgraphs/name/v23",
    graphqlWsProvider: "wss://ws.subgraph.daostack.io/subgraphs/name/v23",
    web3Provider: `wss://mainnet.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2`,
    ipfsProvider: {
      "host": "subgraph.daostack.io",
      "port": "443",
      "protocol": "https",
      "api-path": "/ipfs/api/v0/"
    },
  }
};

/**
 * check if the web3 connection is ready to send transactions, and warn the user if it is not
 *
 * @param showNotification the warning will be sent using the showNotification function;
 *    it will use `alert()` if no such function is provided
 * @return the web3 connection, if everything is fine
 */
export async function enableWeb3ProviderAndWarn(showNotification?: any): Promise<boolean> {
  try {
    return enableWeb3Provider();
  } catch (err) {
    const msg =  err.message;
    if (msg.match(/enable metamask/i) && process.env.NODE_ENV === "development") {
      console.log( `No metamask connection found - we are in "development" environment, so this may be ok`);
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
 * Checks if the web3 provider exists and is set to the required network.
 * Does not ensure we have access to the user's account.
 * throws an Error if no provider or wrong provider
 * @return the web3 provider if is OK
 */
export async function checkWeb3Provider() {
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
      throw new Error(`Unknown NODE_ENV: ${process.env.NODE_ENV}`);
    }
  }

  const web3Provider = getSelectedWeb3Provider();
  if (!web3Provider) {
    const msg = `A wallet is not found`;
    throw Error(msg);
  }

  const networkName = await getNetworkName(web3Provider.networkVersion);
  if (networkName === expectedNetworkName) {
    return web3Provider;
  } else {
    const msg = `Please connect to "${expectedNetworkName}"`;
    throw new Error(msg);
  }
}

/**
 * Get the current user from the web3.
 * @return [description]
 */
export async function getCurrentAccountAddress(): Promise<Address> {
  const web3 = getWeb3();
  if (!web3) {
    return null;
  }
  const accounts = await web3.eth.getAccounts();
  return accounts[0] ? accounts[0].toLowerCase() : null;
}

/**
 * Check if web3Provider account access is enabled, and if not, call the (async) function
 * that will ask the user to enable it
 */
export async function enableWeb3Provider(): Promise<any> {
  /**
   * get an already-selected provider
   */
  /**
   * if no provider then use web3Connect to obtain one
   */
  console.log(`****************************** instantiating web3Connect`);

  let provider: any;
  let providerOptions: any = {};

  if (process.env.NODE_ENV === "production") {
    providerOptions = {
      portis: {
        id: "aae9cff5-6e61-4b68-82dc-31a5a46c4a86",
        network: "mainnet"
      },
      fortmatic: {
        key: "pk_live_38A2BD2B1D4E9912"
      }
    };
  } else if (process.env.NODE_ENV === "staging") {
    providerOptions = {
      portis: {
        id: "aae9cff5-6e61-4b68-82dc-31a5a46c4a86",
        network: "rinkeby"
      },
      fortmatic: {
        key: "pk_test_659B5B486EF199E4"
      }
    };
  }

  const web3Connect = new Web3Connect.Core({
    modal: true,
    providerOptions
  });

  let resolveOnClosePromise: () => void;

  const onClosePromise = new Promise(
    (resolve: () => void) => {

    resolveOnClosePromise = resolve;
    web3Connect.on("close", () => {
      resolve();
    });
  });

  web3Connect.on("connect", (newProvider: any) => {
    provider = newProvider;
    /**
     * Because we won't receive the "close" event in this case, even though
     * the window will have closed
     */
    resolveOnClosePromise();
  });

  console.log(`****************************** fire up modal`);

  web3Connect.toggleModal();

  await onClosePromise;

  console.log(`****************************** provider: ${provider}`);

  if (!provider) {
    const msg = `A wallet is not found`;
    throw Error(msg);
  }

  /**
   * now ensure that the user has logged in and enabled access to the account,
   * whatever the provider requires....
   */
  try {
    console.log(`****************************** calling enable`);
    // brings up the provider UI as needed
    await provider.enable();
  } catch (ex) {
    console.log(`failed to enable provider: ${ex.message}`);
    throw new Error(ex);
  }

  selectedPovider  = provider;

  // const web3 = new Web3(provider);
  // // const accounts = await web3.eth.getAccounts();
  // // const defaultAccount = accounts[0] ? accounts[0].toLowerCase() : null;

  // console.log(`****************************** got web3: ${web3}`);

  // getArc().web3 = web3;

  // console.log(`****************************** default account: ${await getCurrentAccountAddress()}`);

  return initializeArc(provider);
}

export async function gotoReadonly(): Promise<any> {
  selectedPovider = undefined;
  return initializeArc();
}

/**
 * Returns if an account is enabled
 */
// export async function getAccountIsEnabled(): Promise<boolean> {
//   const web3 = getWeb3();
//   const accounts = await web3.eth.getAccounts();
//   return !!accounts.length;
// }

/**
 * Check if an injected web3Provider is available.
 * Does not imply that an account is unlocked.
 * Does not know about the default read-only providers.
 * @return [description]
 */
function getSelectedWeb3Provider(): any {
  // we set the when we get a provider from Web3Connect
  return selectedPovider;
}

/**
 * Return a web3 if we already have one.  Create it if needed.
 */
function getWeb3(): any {
  const arc = (global as any).arc;
  let web3 = arc ? arc.web3 : null;
  // if (!web3) {
  //   const provider = getInjectedWeb3Provider();
  //   if (provider) {
  //     web3 = new Web3(provider);
  //   }
  // }
  return web3;
}

// returns appropriate Arc configuration for the given environment
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

/**
 * Returns the Arc instance. Throws an exception when Arc hasn't yet been initialized!
 */
export function getArc(): Arc {
  const arc = (global as any).arc;
  if (!arc) {
    throw Error("global.arc is not defined - please call initializeArc first");
  }
  return arc;
}

/**
 * Initialize Arc with a web3 provider.  No guarantee at this point that we have
 * account access.  Readonly is OK here.
 */
export async function initializeArc(web3Provider?: any): Promise<Arc> {
  // clone because we may write to it
  const arcSettings = Object.assign({}, getArcSettings());
  // const web3Provider = getInjectedWeb3Provider();
  if (web3Provider && web3Provider.isMetaMask) {
    console.log("waiting for Metamask to initialize");
    try {
      await waitUntilTrue(() => web3Provider.networkVersion, 1000);
      console.log(`Metamask is ready, and connected to ${web3Provider.networkVersion}`);
    } catch (err) {
      if (err.message.match(/timed out/)) {
        console.log("Error: Could not connect to Metamask (time out)");
      }
      console.log(err);
    }
  }

  // try {
  //   arcSettings.web3Provider = await checkWeb3Provider();
  // } catch (err) {
  //   // web3Provider is not correctly configured or available, so we use the default (read-only) web3 provider
  //   console.log(err);
  // }

  if (web3Provider)
  {
    arcSettings.web3Provider = web3Provider;
  }

  // log some useful info
  console.log(`Found NODE_ENV "${process.env.NODE_ENV}", using the following settings for Arc`);
  console.log(arcSettings);
  console.log(`alchemy-server (process.env.API_URL): ${process.env.API_URL}`);
  // if (web3Provider) {
  //   console.log("Using injected Web3 provider");
  // } else {
  //   console.log("Using default Web3 provider");
  // }

  const arc: Arc = new Arc(arcSettings);
  await arc.initialize();
  return (global as any).arc = arc;
}

// cf. https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md#ear-listening-for-selected-account-changes
// Polling is Evil!
// TODO: check if this (new?) function can replace polling:
// https://metamask.github.io/metamask-docs/Main_Concepts/Accessing_Accounts
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
