/* eslint-disable no-console */
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
    graphqlHttpProvider: process.env.ARC_GRAPHQLHTTPPROVIDER || "https://rinkeby.subgraph.daostack.io/subgraphs/name/v26",
    graphqlWsProvider:  process.env.ARC_GRAPHQLWSPROVIDER || "wss://ws.rinkeby.subgraph.daostack.io/subgraphs/name/v26",
    web3Provider:  process.env.ARC_WEB3PROVIDER || "wss://rinkeby.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2",
    web3ProviderRead:  process.env.ARC_WEB3PROVIDERREAD || "wss://rinkeby.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2",
    ipfsProvider: process.env.ARC_IPFSPROVIDER || {
      "host": process.env.ARC_IPFSPROVIDER_HOST || "rinkeby.subgraph.daostack.io",
      "port": process.env.ARC_IPFSPROVIDER_PORT || "443",
      "protocol": process.env.ARC_IPFSPROVIDER_PROTOCOL || "https",
      "api-path": process.env.ARC_IPFSPROVIDER_API_PATH || "/ipfs/api/v0/",
    },
  },
  production: {
    graphqlHttpProvider: process.env.ARC_GRAPHQLHTTPPROVIDER || "https://subgraph.daostack.io/subgraphs/name/v24",
    graphqlWsProvider: process.env.ARC_GRAPHQLWSPROVIDER || "wss://ws.subgraph.daostack.io/subgraphs/name/v24",
    web3Provider: process.env.ARC_WEB3PROVIDER || "wss://mainnet.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2",
    web3ProviderRead: process.env.ARC_WEB3PROVIDERREAD || "wss://mainnet.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2",
    ipfsProvider: process.env.ARC_IPFSPROVIDER || {
      "host": process.env.ARC_IPFSPROVIDER_HOST || "subgraph.daostack.io",
      "port": process.env.ARC_IPFSPROVIDER_PORT || "443",
      "protocol": process.env.ARC_IPFSPROVIDER_PROTOCOL || "https",
      "api-path": process.env.ARC_IPFSPROVIDER_API_PATH || "/ipfs/api/v0/",
    },
  },
};

/**
 * return the default Arc configuration given the execution environment
 */
function getArcSettings(): any {
  let arcSettings: any;
  switch (process.env.NODE_ENV || "development") {
    case "test": {
      arcSettings = settings.dev;
      break;
    }
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
 * Return the default account in current use by Arc.
 */
async function _getCurrentAccountFromProvider(): Promise<string> {
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
 * Return currently-selected and fully-enabled web3Provider (an account can be presumed to exist).
 */
export function getWeb3Provider(): any | undefined {
  return selectedProvider;
}

/**
 * Checks if the web3 provider is set to the required network.
 * Does not ensure we have access to the user's account.
 * throws an Error if no provider or wrong provider
 * @param provider web3Provider
 * @return the expected network nameif not correct
 */
async function checkWeb3ProviderIsForNetwork(provider: any): Promise<string> {
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
      const msg = `Unknown NODE_ENV: ${process.env.NODE_ENV}`;
      console.log(msg);
      throw new Error(msg);
    }
  }

  const networkId = await getNetworkId(provider);
  const networkName = await getNetworkName(networkId);
  return (networkName === expectedNetworkName) ?  null : expectedNetworkName;
}

/**
 * Returns a IWeb3ProviderInfo when a provider has been selected and is fully available.
 * Does not know about the default read-only providers.
 */
export function getWeb3ProviderInfo(provider?: any): IWeb3ProviderInfo {
  provider = provider ? provider : selectedProvider;
  return provider ? Web3Connect.getProviderInfo(provider) : null;
}

/**
 * initialize Arc.
 * @param provider Optional web3Provider
 */
export async function initializeArc(provider?: any): Promise<boolean> {
  const arcSettings = getArcSettings();

  if (provider) {
    arcSettings.web3Provider = provider;
  } else {
    provider = arcSettings.web3Provider;
  }

  const readonly = typeof provider === "string";

  // get contract information from the subgraph
  let success = false;
  let arc: Arc;
  try {
    arc = new Arc(arcSettings);
    const contractInfos = await arc.fetchContractInfos();
    success = !!contractInfos;
  } catch (reason) {
    console.log(reason.message);
  }

  if (success) {
    provider = arc.web3.currentProvider; // won't be a string, but the actual provider
    // save for future reference
    provider.__networkId = await getNetworkId(provider);
    if ((window as any).ethereum) {
      // if this is metamask this should prevent a browser refresh when the network changes
      (window as any).ethereum.autoRefreshOnNetworkChange = false;
    }
    console.log(`Connected Arc to ${await getNetworkName(provider.__networkId)}${readonly ? " (readonly)" : ""} `);
  }

  (window as any).arc = success ? arc : null;
  return success;
}

/**
 * Prompt user to select a web3Provider and enable their account.
 * Initializes Arc with the newly-selected web3Provider.
 * Is a no-op if already done.
 * @param provider Optional web3Provider, supplied when using a cached provider
 * @param blockOnWrongNetwork if true, throw exception if is wrong network
 * @returns whether Arc has been successfully initialized.
 */
async function enableWeb3Provider(provider?: any, blockOnWrongNetwork = true): Promise<boolean> {
  let success = false;

  /**
   * Already got an already-selected provider?
   * We'll replace it if provider has been supplied.
   */
  if (selectedProvider && !provider) {
    provider = selectedProvider;
    success = true;
  } else if (!provider) {
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
      providerOptions: Object.assign(
        /**
         * This will hide the web3connect fallback ("Web3") button which currently
         * doesn't behave well when there is no available extension.  The fallback is
         * apparently "for injected providers that haven't been added to the library or
         * that don't support the normal specification. Opera is an example of it."
         */
        { disableInjectedProvider: !((window as any).web3 || (window as any).ethereum) },
        web3ConnectProviderOptions),
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
      // assuming reject will result in a throw exception caught below
      await onClosePromise;

    } catch (error) {
      console.log(`Unable to connect to web3 provider:  ${error.message}`);
      throw new Error("Unable to connect to web3 provider");
    }

    if (!provider) {
      // should only be cancelled, errors should have been handled above
      console.log("uncaught error or user cancelled out");
      return false;
    }
  }

  /**
   * note the thrown exceptions will be reported as notifications to the user
   */
  const correctNetworkErrorMsg = await checkWeb3ProviderIsForNetwork(provider);

  if (correctNetworkErrorMsg) {
    console.log(`connected to the wrong network, should be ${correctNetworkErrorMsg}`);
    if (blockOnWrongNetwork) {
      throw new Error(`Please connect to ${correctNetworkErrorMsg}`);
    }
  }

  if (provider !== selectedProvider) {
    /**
     * now ensure that the user has connected to a network and enabled access to the account,
     * whatever the provider requires....
     */
    try {
      // brings up the provider UI as needed
      await provider.enable();
      console.log(`Connected to network provider ${getWeb3ProviderInfo(provider).name}`);
    } catch (ex) {
      console.log(`Unable to enable provider: ${ex.message}`);
      throw new Error("Unable to enable provider");
    }

    try {
      success = await initializeArc(provider);

      if (!_getCurrentAccountFromProvider()) {
      // then something went wrong
        console.log("Unable to obtain an account from the provider");
        throw new Error("Unable to obtain an account from the provider");
      }

    } catch (ex) {
      console.log(`Unable to initialize Arc: ${ex.message}`);
      throw new Error("Unable to initialize Arc");
    }
  }

  if (success) {
    selectedProvider = provider;
  }

  return success;
}

/**
 * See `enableWeb3Provider`.  If that fails then issue a warning to the user.
 *
 * @param provider Optional web3Provider
 * @return boolean whether Arc is successfully initialized.
 */
export async function enableWeb3ProviderAndWarn(showNotification?: any, blockOnWrongNetwork = true): Promise<boolean> {
  let success = false;
  let msg: string;
  try {
    success = await enableWeb3Provider(null, blockOnWrongNetwork);
  } catch(err) {
    msg = err.message;
  }

  if (!success  && msg) {
    msg = msg ? msg : "Unable to connect to the web3 provider";
    if (showNotification) {
      showNotification(NotificationStatus.Failure, msg);
    } else {
      alert(msg);
    }
  }
  return success;
}

/**
 * @return the current account address from Arc. Ignores any injected
 * account unless Arc knows about the provider.
 */
async function getCurrentAccountFromProvider(): Promise<Address | null> {
  if (!selectedProvider) {
    /**
     * though an account may actually be available via injection, we're not going
     * to return it. The flow needs to start from a selected provider first,
     * only then the current account.
     */
    return null;
  }
  return _getCurrentAccountFromProvider();
}

/**
 * switch to readonly mode (effectively a logout)
 */
export async function gotoReadonly(showNotification?: any): Promise<boolean> {
  let success = false;
  if (selectedProvider) {
    // clearing this, initializeArc will be made to use the default web3Provider
    const networkName = await getNetworkName();
    selectedProvider = undefined;
    try {
      success = await initializeArc();
    } catch(err) {
      console.log(err);
    }

    if (!success) {
      const msg =  `Unable to disconnect from : ${networkName}`;
      if (showNotification) {
        showNotification(NotificationStatus.Failure, msg);
      } else {
        alert(msg);
      }
    }
  }
  else {
    success = true;
  }

  return success;
}

/**
 * Given IWeb3ProviderInfo, get a web3Provider and InitializeArc with it.
 *
 * This is meant to be used to bypass allowing the user to select a provider in the
 * case where we are initializing the app from a previously-cached (selected) provider.
 * @param web3ProviderInfo required IWeb3ProviderInfo
 * @returns whether Arc has been successfully initialized.
 */
export async function setWeb3ProviderAndWarn(web3ProviderInfo: IWeb3ProviderInfo, showNotification?: any): Promise<boolean> {
  let provider: any;

  /**
   * note the thrown exceptions will be reported as notifications to the user
   */

  let success = false;
  let msg: string;

  try {

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
      console.log(`Unable to instantiate provider: ${ex.message}`);
      throw new Error("Unable to instantiate provider");
    }
    /**
   * make sure the injected provider is the one we're looking for
   */
    if (provider && !provider[web3ProviderInfo.check]) {
      console.log(`instantiated provider is not the one requested: ${provider.name} != ${web3ProviderInfo.name}`);
      throw new Error("Unable to instantiate provider");
    }

    success = provider ? await enableWeb3Provider(provider, false) : false;

  } catch(err) {
    console.log(err);
    msg = err.message;
  }

  if (!success && msg) {
    msg =  msg ? msg : `Unable to connect to: ${web3ProviderInfo.name}`;
    if (showNotification) {
      showNotification(NotificationStatus.Failure, msg);
    } else {
      alert(msg);
    }
  }
  return success;
}

/**
 * @returns whether we have a current account
 */
export function getAccountIsEnabled(): boolean {
  /**
   * easy proxy for the presence of an account. selectedProvider cannot be set without an account.
   */
  return !!getWeb3Provider();
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
      getCurrentAccountFromProvider()
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
