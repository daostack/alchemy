import { Address, Arc } from "@daostack/client";
import { waitUntilTrue} from "lib/util";
import { NotificationStatus } from "reducers/notifications";
import { Observable } from "rxjs";
const Web3 = require("web3");
import Web3Connect from "web3connect";
import { IProviderInfo } from "web3connect/lib/helpers/types";
import { getNetworkName } from "./lib/util";

/**
 * This is only set after the user has selected a provider and enabled an account.
 * It is like window.ethereum, but has not necessarily been injected as such.
 */
let selectedProvider: any;

const web3ConnectProviderOptions =
    (process.env.NODE_ENV === "production") ?
      {
        portis: {
          id: "aae9cff5-6e61-4b68-82dc-31a5a46c4a86",
          network: "mainnet"
        },
        fortmatic: {
          key: "pk_live_38A2BD2B1D4E9912"
        }
      }
      : (process.env.NODE_ENV === "staging") ?
      {
        portis: {
          id: "aae9cff5-6e61-4b68-82dc-31a5a46c4a86",
          network: "rinkeby"
        },
        fortmatic: {
          key: "pk_test_659B5B486EF199E4"
        }
      } : {};

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
  // if we are in test mode, we'll do without - we should be connected to an unlocked ganache instance
  try {
    return await enableWeb3Provider();
  } catch (err) {
    const msg =  err.message;
    if (showNotification) {
      showNotification(NotificationStatus.Failure, msg);
    } else {
      alert(msg);
    }
  }
  return false;
}

/**
 * Get the current user from the web3.
 * @return [description]
 */
export async function getCurrentAccountAddress(): Promise<Address | null> {
  if (!selectedProvider) {
    /**
     * though an account may actually be available via injection, we're not going
     * to return it. The flow needs to start from a selected provider first,
     * only then then the account.
     */
    return null;
  }
  const web3 = getWeb3();
  if (!web3) {
    return null;
  }
  const accounts = await web3.eth.getAccounts();
  return accounts[0] ? accounts[0].toLowerCase() : null;
}

export async function gotoReadonly(): Promise<boolean> {
  selectedProvider = undefined;
  return true; // initializeArc();
}

/**
 * Given IWeb3ProviderInfo, get a web3Provider and InitializeArc with it.
 * Returns true if Arc is successfully initialized.
 * @param web3ProviderInfo required IWeb3ProviderInfo
 */
export async function setWeb3Provider(web3ProviderInfo: IWeb3ProviderInfo): Promise<boolean> {
  let provider: any;

  console.log(`****************************** connecting to: ${web3ProviderInfo.name}`);

  try {
    switch (web3ProviderInfo.type) {
      case "injected":
          provider = await Web3Connect.ConnectToInjected();
          break;
      case "qrcode":
          provider = await Web3Connect.ConnectToWalletConnect({});
          break;
      case "web":
        switch (web3ProviderInfo.name) {
          case "Portis":
            provider = await Web3Connect.ConnectToPortis(web3ConnectProviderOptions.portis);
            break;
          case "Fortmatic":
            provider = await Web3Connect.ConnectToFortmatic(web3ConnectProviderOptions.fortmatic);
            break;
        }
        break;
      }
    } catch (ex) {
      console.log(`****************************** unable to instantiate provider: ${ex.message}`);
    }
  /**
   * make sure the injected provider is the one we're looking for
   */
  if (provider && !provider[web3ProviderInfo.check]) {
    console.log(`****************************** instantiated provider is not the one requested: ${provider.name} != ${web3ProviderInfo.name}`);
    provider = null;
  }
  return provider ? enableWeb3Provider(provider) : Promise.resolve(false);
}

/**
 * Check if web3Provider account access is enabled, and if not, call the (async) function
 * that will ask the user to enable it.
 * Then InitializeArc with it.
 * Returns true if Arc is successfully initialized.
 */
async function enableWeb3Provider(provider?: any): Promise<boolean> {
  /**
   * Already got an already-selected provider?
   * We'll replace it if provider has been supplied.
   */
  if (selectedProvider && !provider) {
    return true;
  }

  if (!provider) {
    /**
     * if no provider then use web3Connect to obtain one
     */
    if (process.env.NODE_ENV === "development" && navigator.webdriver) {
      // in test mode, we have an unlocked ganache and we are not using any wallet
      console.log(`not using any wallet, because we are in automated test`);
      selectedProvider = new Web3(settings.dev.web3Provider);
      return true;
    }

    console.log(`****************************** instantiating web3Connect`);

    const web3Connect = new Web3Connect.Core({
      modal: true,
      providerOptions: web3ConnectProviderOptions
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

    if (!provider) {
      throw new Error(`A wallet is not found`);
    }
  }

  console.log(`****************************** provider:`);
  console.dir(provider);

  /**
   * now ensure that the user has logged in and enabled access to the account,
   * whatever the provider requires....
   */
  try {
    console.log(`****************************** calling enable`);
    // brings up the provider UI as needed
    await provider.enable();
  } catch (ex) {
    console.log(`****************************** failed to enable provider: ${ex.message}`);
    throw new Error(ex);
  }

  console.log(`****************************** enabled`);

  selectedProvider = provider;

  // const web3 = new Web3(provider);
  // // const accounts = await web3.eth.getAccounts();
  // // const defaultAccount = accounts[0] ? accounts[0].toLowerCase() : null;

  // console.log(`****************************** got web3: ${web3}`);

  // getArc().web3 = web3;

  // console.log(`****************************** default account: ${await getCurrentAccountAddress()}`);

  console.log(`****************************** initializeArc`);
  const success = await initializeArc(provider);

  // const networkName = await getNetworkName();
  // console.log(`****************************** initialized Arc against ${networkName}`);

  return success;
}

/**
 * Checks if the web3 provider is set to the required network.
 * Does not ensure we have access to the user's account.
 * throws an Error if no provider or wrong provider
 * @return the web3 provider if is OK
 */
async function checkWeb3Provider(web3Provider: any): Promise<string> {
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

  const networkName = await getNetworkName(web3Provider.networkVersion);
  return networkName === expectedNetworkName ? null : expectedNetworkName;
}

/**
 * Returns if an account is enabled in the selected web3Provider
 */
export function getAccountIsEnabled(): boolean {
  return !!selectedProvider;
  // const web3 = getWeb3();
  // const accounts = await web3.eth.getAccounts();
  // return !!accounts.length;
}

/**
 * Returns a IWeb3ProviderInfo when a provider has been selected and is fully available.
 * Does not know about the default read-only providers.
 */
export function getWeb3ProviderInfo(): IWeb3ProviderInfo {
  return selectedProvider ? Web3Connect.getProviderInfo(selectedProvider) : null;
}

/**
 * Check if a web3Provider has been selected and is fully available.
 * Does not know about the default read-only providers.
 */
// function getSelectedWeb3Provider(): any {
//   // we set this when we get a provider from Web3Connect
//   return selectedPovider;
// }

/**
 * Return a web3 if we already have one.  Create it if needed.
 */
function getWeb3(): any {
  const arc = (window as any).arc;
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
 * Initialize Arc with a web3 provider.  No guarantee at this point that we have
 * account access.  Readonly is OK here.
 */
export async function initializeArc(web3Provider?: any): Promise<boolean> {
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
        throw new Error("Error: Could not connect to Metamask (time out)");
      }
      throw new Error(err);
    }
  }

  if (web3Provider) {
    const expectedNetworkName = await checkWeb3Provider(web3Provider);
    if (expectedNetworkName) {
        const msg = `Please connect to "${expectedNetworkName}"`;
        throw new Error(msg);
    }
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
  const success = await arc.initialize();
  (window as any).arc = success ? arc : null;
  return success;
}

/**
 * Returns the Arc instance. Throws an exception when Arc hasn't yet been initialized!
 */
export function getArc(): Arc {
  const arc = (window as any).arc;
  if (!arc) {
    throw Error("window.arc is not defined - please call initializeArc first");
  }
  return arc;
}

// cf. https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md#ear-listening-for-selected-account-changes
// Polling is Evil!
// TODO: check if this (new?) function can replace polling:
// https://metamask.github.io/metamask-docs/Main_Concepts/Accessing_Accounts
export function pollForAccountChanges(currentAccountAddress: Address | null, interval: number = 2000) {
  console.log(`****************************** start polling for account changes from: ${currentAccountAddress}`);
  return Observable.create((observer: any) => {
    let prevAccount = currentAccountAddress;
    function emitIfNewAccount() {
      getCurrentAccountAddress()
        .then((account: Address | null) => {
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

export interface IWeb3ProviderInfo extends IProviderInfo {
}
