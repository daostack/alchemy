import { Address, Arc } from "@daostack/client";
import { NotificationStatus } from "reducers/notifications";
import { Observable } from "rxjs";

import Web3Connect from "@daostack/web3connect";
import { IProviderInfo } from "@daostack/web3connect/lib/helpers/types";
import { getNetworkId, getNetworkName, waitUntilTrue } from "./lib/util";

const Web3 = require("web3");

/**
 * This is only set after the user has selected a provider and enabled an account.
 * It is like window.ethereum, but has not necessarily been injected as such.
 */
let selectedProvider: any;

const web3ConnectProviderOptions =
    Object.assign({
      disableWalletConnect: true,
    },
    (process.env.NODE_ENV === "production") ?
      {
        portis: {
          id: "aae9cff5-6e61-4b68-82dc-31a5a46c4a86",
          network: "mainnet",
        },
        fortmatic: {
          key: "pk_live_38A2BD2B1D4E9912",
        },
      }
      : (process.env.NODE_ENV === "staging") ?
        {
          portis: {
            id: "aae9cff5-6e61-4b68-82dc-31a5a46c4a86",
            network: "rinkeby",
          },
          fortmatic: {
            key: "pk_test_659B5B486EF199E4",
          },
        } : {});

const settings = {
  dev: {
    graphqlHttpProvider: "http://127.0.0.1:8000/subgraphs/name/daostack",
    graphqlWsProvider: "ws://127.0.0.1:8001/subgraphs/name/daostack",
    web3Provider: "ws://127.0.0.1:8545",
    web3ProviderRead: "ws://127.0.0.1:8545",
    ipfsProvider: "localhost",
  },
  staging: {
    graphqlHttpProvider: "https://rinkeby.subgraph.daostack.io/subgraphs/name/v24",
    graphqlWsProvider: "wss://ws.rinkeby.subgraph.daostack.io/subgraphs/name/v24",
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
    graphqlHttpProvider: "https://subgraph.daostack.io/subgraphs/name/v24",
    graphqlWsProvider: "wss://ws.subgraph.daostack.io/subgraphs/name/v24",
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

/**
 * return the default Arc configuration given the execution environment
 */
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
      throw Error(`Unknown NODE_ENV environment: "${process.env.NODE_ENV}"`);
    }
  }
  return arcSettings;
}

/**
 * Return the web3 in current use by Arc.
 */
function getWeb3(): any {
  const arc = (window as any).arc;
  const web3 = arc ? arc.web3 : null;
  return web3;
}

/**
 * Return the default account, locked, in current use by Arc.
 */
async function _getCurrentLockedAccount(): Promise<string> {
  const web3 = getWeb3();
  if (!web3) {
    return null;
  }
  const accounts = await web3.eth.getAccounts();
  return accounts[0] ? accounts[0].toLowerCase() : null;
}

/**
 * Returns the Arc instance
 * Throws an exception when Arc hasn't yet been initialized!
 */
export function getArc(): Arc {
  const arc = (window as any).arc;
  if (!arc) {
    throw Error("window.arc is not defined - please call initializeArc first");
  }
  return arc;
}

/**
 * Return currently-selected and fully-enabled web3Provider (a
 * locked account can be presumed to exist).
 */
export function getWeb3Provider(): any | undefined {
  return selectedProvider;
}

/**
 * Checks if the web3 provider is set to the required network.
 * Does not ensure we have access to the user's account.
 * throws an Error if no provider or wrong provider
 * @param provider Optional web3Provider
 * @return the web3 provider if is OK
 */
async function checkWeb3Provider(provider?: any): Promise<any> {
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

  const web3Provider = provider ? provider : getWeb3Provider();

  if (!web3Provider) {
    const msg = "Please install or enable a wallet provider";
    throw Error(msg);
  }

  const networkId = await getNetworkId(web3Provider);
  const networkName = await getNetworkName(networkId);
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
 * initialize Arc.  
 * @param provider Optional web3Provider
 */
export async function initializeArc(provider?: any): Promise<boolean> {
  const arcSettings = getArcSettings();
  let correctNetwork = false;

  try {
    arcSettings.web3Provider = await checkWeb3Provider(provider);
    correctNetwork = true;
  } catch (err) {
    // metamask is not correctly configured or available, so we use the default (read-only) web3 provider
    console.log(err);
  }

  console.log(`Using provider ${arcSettings.web3Provider.name}`);

  // get contract information from the subgraph
  let success = false;
  let arc: Arc;
  try {
    arc = new Arc(arcSettings);
    const contractInfos = await arc.fetchContractInfos();
    success = !!contractInfos;
  } catch (ex) {
    console.log(ex.message);
  }
  (window as any).arc = success ? arc : null;
  return success && correctNetwork;
}

/**
 * Prompt user to select a web3Provider and enable their account.
 * Initializes Arc with the newly-selected web3Provider.
 * Is a no-op if already done.
 * @param provider Optional web3Provider
 * @returns whether Arc has been successfully initialized.
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
      console.log("not using any wallet, because we are in automated test");
      selectedProvider = new Web3(settings.dev.web3Provider);
      return true;
    }

    const web3Connect = new Web3Connect.Core({
      modal: false,
      providerOptions: web3ConnectProviderOptions,
    });

    let resolveOnClosePromise: () => void;
    let rejectOnClosePromise: (reason?: any) => void;

    const onClosePromise = new Promise(
      (resolve: () => void, reject: (reason?: any) => void): any => {
        resolveOnClosePromise = resolve;
        rejectOnClosePromise = reject;
        web3Connect.on("close", (): any => {
          return resolve();
        });
      });

    web3Connect.on("error", (error: Error): any => {
      console.log(`web3Connect closed on error:  ${error.message}`);
      return rejectOnClosePromise(error);
    });

    web3Connect.on("connect", (newProvider: any): any => {
      provider = newProvider;
      /**
       * Because we won't receive the "close" event in this case, even though
       * the window will have closed
       */
      return resolveOnClosePromise();
    });

    try {
      web3Connect.toggleModal();

      await onClosePromise;

    } catch (error) {
      console.log(`web3Connect closed on error:  ${error.message}`);
    }

    if (!provider) {
      console.log("error or user cancelled out");
      return false;
    }
  }

  /**
   * now ensure that the user has logged in and enabled access to the account,
   * whatever the provider requires....
   */
  try {
    // brings up the provider UI as needed
    await provider.enable();
  } catch (ex) {
    console.log(`unable to enable provider: ${ex.message}`);
    throw ex;
  }

  let success = false;
  try {
    success = await initializeArc(provider);
  } catch (ex) {
    console.log(`unable to initialize Arc: ${ex.message}`);
    throw ex;
  }

  if (!_getCurrentLockedAccount()) {
    // then something went wrong
    console.log("unable to lock an account");
    throw new Error("unable to lock an account");
  }

  if (success) {
    selectedProvider = provider;
    console.log("enabled provider, account locked");
  }

  return success;
}

/**
 * See `enableWeb3Provider`.  If that fails then issue a warning to the user.
 * 
 * @param provider Optional web3Provider
 * @return boolean whether Arc is successfully initialized.
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
 * @return the currently-locked account address from Arc. Ignores any injected
 * account unless Arc knows about the provider.
 */
export async function getCurrentAccountAddress(): Promise<Address | null> {
  if (!selectedProvider) {
    /**
     * though an account may actually be available via injection, we're not going
     * to return it. The flow needs to start from a selected provider first,
     * only then a locked account.
     */
    return null;
  }
  return _getCurrentLockedAccount();
}

/**
 * switch to readonly mode (effectively a logout)
 */
export async function gotoReadonly(): Promise<boolean> {
  // clearing this, initializeArc will be made to use the default web3Provider
  selectedProvider = undefined;
  return initializeArc();
}

/**
 * Given IWeb3ProviderInfo, get a web3Provider and InitializeArc with it.
 * 
 * This is meant to be used to bypass allowing the user to select a provider in the
 * case where we are initializing the app from a previously-cached (selected) provider.
 * @param web3ProviderInfo required IWeb3ProviderInfo
 * @returns whether Arc has been successfully initialized.
 */
export async function setWeb3Provider(web3ProviderInfo: IWeb3ProviderInfo): Promise<boolean> {
  let provider: any;

  console.log(`connecting to: ${web3ProviderInfo.name}`);

  try {
    switch (web3ProviderInfo.type) {
      case "injected":
        /**
           * Safe doesn't always inject itself in a timely manner
           */
        if (!(window as any).ethereum) {
          await waitUntilTrue((): boolean => !!(window as any).ethereum, 2000);
        }

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
    console.log(`unable to instantiate provider: ${ex.message}`);
  }
  /**
   * make sure the injected provider is the one we're looking for
   */
  if (provider && !provider[web3ProviderInfo.check]) {
    console.log(`instantiated provider is not the one requested: ${provider.name} != ${web3ProviderInfo.name}`);
    provider = null;
  }
  return provider ? enableWeb3Provider(provider) : Promise.resolve(false);
}

/**
 * @returns whether an account is enabled in a selected web3Provider
 */
export function getAccountIsEnabled(): boolean {
  /**
   * proxy for the presence of an account. selectedProvider cannot be set without a locked account.
   */
  return !!getWeb3Provider();
}

/**
 * Returns a IWeb3ProviderInfo when a provider has been selected and is fully available.
 * Does not know about the default read-only providers.
 */
export function getWeb3ProviderInfo(): IWeb3ProviderInfo {
  return selectedProvider ? Web3Connect.getProviderInfo(selectedProvider) : null;
}

// cf. https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md#ear-listening-for-selected-account-changes
// Polling is Evil!
// TODO: check if this (new?) function can replace polling:
// https://metamask.github.io/metamask-docs/Main_Concepts/Accessing_Accounts
export function pollForAccountChanges(currentAccountAddress: Address | null, interval: number = 2000): Observable<Address> {
  console.log(`start polling for account changes from: ${currentAccountAddress}`);
  return Observable.create((observer: any): () => void  => {
    let prevAccount = currentAccountAddress;
    function emitIfNewAccount(): void {
      getCurrentAccountAddress()
        .then((account: Address | null): void => {
          if (prevAccount !== account) {
            observer.next(account);
            prevAccount = account;
          }
        })
        .catch((err): void => { console.warn(err.message); });
    }

    emitIfNewAccount();
    const timeout = setInterval(emitIfNewAccount, interval);
    return (): void => { clearTimeout(timeout); };
  });
}

/**
 * extension of the Web3Connect IProviderInfo
 */
export interface IWeb3ProviderInfo extends IProviderInfo {
}
