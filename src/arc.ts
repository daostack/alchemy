import { Address, Arc } from "@daostack/client";
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import WalletConnectProvider from "@walletconnect/web3-provider";
import { NotificationStatus } from "reducers/notifications";
import { Observable } from "rxjs";
import Web3Connect from "web3connect";
import { IProviderInfo } from "web3connect/lib/helpers/types";
import BurnerConnectProvider from "@burner-wallet/burner-connect-provider";
import { settings } from "./settings";
import { getNetworkId, getNetworkName, isMobileBrowser } from "./lib/util";

const Portis = require("@portis/web3");
const Fortmatic = require("fortmatic");
const Web3 = require("web3");

/**
 * This is only set after the user has selected a provider and enabled an account.
 * It is like window.ethereum, but has not necessarily been injected as such.
 */
let selectedProvider: any;
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
let web3ConnectCore: Web3Connect.Core;
let initializedAccount: Address;

const web3ConnectProviderOptions =
    Object.assign({
    },
    (process.env.NODE_ENV === "production") ?
      {
        network: "mainnet",
        walletconnect: {
          package: isMobileBrowser() ? null : WalletConnectProvider,
          options: {
            infuraId: "e0cdf3bfda9b468fa908aa6ab03d5ba2",
          },
        },
        burnerconnect: {
          package: BurnerConnectProvider,
          options: { defaultNetwork: "1" },
        },
        portis: {
          package: Portis,
          options: {
            id: "aae9cff5-6e61-4b68-82dc-31a5a46c4a86",
          },
        },
        fortmatic: {
          package: Fortmatic,
          options: {
            key: "pk_live_38A2BD2B1D4E9912",
          },
        },
        squarelink: {
          options: {
            id: null,
          },
        },
      }
      : (process.env.NODE_ENV === "staging") ?
        {
          network: "rinkeby",
          walletconnect: {
            package: isMobileBrowser() ? null : WalletConnectProvider,
            options: {
              infuraId: "e0cdf3bfda9b468fa908aa6ab03d5ba2",
            },
          },
          burnerconnect: {
            package: BurnerConnectProvider,
            options: { defaultNetwork: "4" },
          },
          portis: {
            package: Portis,
            options: {
              id: "aae9cff5-6e61-4b68-82dc-31a5a46c4a86",
            },
          },
          fortmatic: {
            package: Fortmatic,
            options: {
              key: "pk_test_659B5B486EF199E4",
            },
          },
          squarelink: {
            options: {
              id: null,
            },
          },
        } : {});


/**
 * return the default Arc configuration given the execution environment
 */
export function getArcSettings(): any {
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

  // do not subscribe to any of the queries - we do all subscriptions manually
  arcSettings.graphqlSubscribeToQueries = false;
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
async function _getCurrentAccountFromProvider(web3?: any): Promise<string> {
  web3 = web3 || getWeb3();
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

async function getProviderNetworkName(provider?: any): Promise<string> {
  provider = provider || selectedProvider;
  if (!provider) { return null; }
  const networkId = await getNetworkId(provider);
  return getNetworkName(networkId);
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
      // eslint-disable-next-line no-console
      console.error(msg);
      throw new Error(msg);
    }
  }

  const networkName = await getProviderNetworkName(provider);
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
 * initialize Arc.  Does not throw exceptions, returns boolean success.
 * @param provider Optional web3Provider
 */
export async function initializeArc(provider?: any): Promise<boolean> {

  let success = false;
  let arc: any;

  try {
    const arcSettings = getArcSettings();

    if (provider) {
      arcSettings.web3Provider = provider;
    } else {
      provider = arcSettings.web3Provider;
    }

    const readonly = typeof provider === "string";

    // if there is no existing arc, we create a new one
    if ((window as any).arc) {
      arc = (window as any).arc;
      arc.web3 = new Web3(provider);
    } else {
      arc = new Arc(arcSettings);
    }

    // get contract information from the subgraph
    const contractInfos = await arc.fetchContractInfos();
    success = !!contractInfos;

    if (success) {
      initializedAccount = await _getCurrentAccountFromProvider(arc.web3);

      if (!initializedAccount) {
        // then something went wrong
        // eslint-disable-next-line no-console
        console.error("Unable to obtain an account from the provider");
        // success = false;
      }
    } else {
      initializedAccount = null;
    }

    if (success) {
      provider = arc.web3.currentProvider; // won't be a string, but the actual provider
      // save for future reference
      // eslint-disable-next-line require-atomic-updates
      provider.__networkId = await getNetworkId(provider);
      if ((window as any).ethereum) {
      // if this is metamask this should prevent a browser refresh when the network changes
        (window as any).ethereum.autoRefreshOnNetworkChange = false;
      }
      // eslint-disable-next-line no-console
      console.log(`Connected Arc to ${await getNetworkName(provider.__networkId)}${readonly ? " (readonly)" : ""} `);
    }
  } catch (reason) {
    // eslint-disable-next-line no-console
    console.error(reason ? reason.message : "unknown error");
  }

  (window as any).arc = success ? arc : null;

  return success;
}

async function ensureCorrectNetwork(provider: any): Promise<void> {

  /**
   * It is required that the provider be the correct one for the current platform
   */
  const correctNetworkErrorMsg = await checkWeb3ProviderIsForNetwork(provider);

  if (correctNetworkErrorMsg) {
    // eslint-disable-next-line no-console
    console.error(`connected to the wrong network, should be ${correctNetworkErrorMsg}`);
    throw new Error(`Please connect your wallet provider to ${correctNetworkErrorMsg}`);
  }
}

const ACCOUNT_STORAGEKEY = "currentAddress";

export function cacheWeb3Info(account: Address): void {
  if (account) {
    localStorage.setItem(ACCOUNT_STORAGEKEY, account);
  } else {
    localStorage.removeItem(ACCOUNT_STORAGEKEY);
  }
}

export function uncacheWeb3Info(accountToo = true): void {
  if (accountToo) {
    localStorage.removeItem(ACCOUNT_STORAGEKEY);
  }
  if (web3ConnectCore) {
    web3ConnectCore.clearCachedProvider();
  }
  /**
     * close is not yet a standard, but soon will be.
     * Sadly closing the connection is the only way to clear the WalletConnect cache.
     * But clearing its cache will ensure that
     * the user can rescan a qrcode when changing WalletConnect provider.
     */
  if (selectedProvider && selectedProvider.close) {
    selectedProvider.close(); // no need to await
  }
}

export function getCachedAccount(): Address | null {
  return localStorage.getItem(ACCOUNT_STORAGEKEY);
}

export interface IEnableWalletProviderParams {
  suppressNotifyOnSuccess?: boolean;
  showNotification: any;
}

function inTesting(): boolean {
  if (process.env.NODE_ENV === "development" && navigator.webdriver) {
    // in test mode, we have an unlocked ganache and we are not using any wallet
    // eslint-disable-next-line no-console
    console.log("not using any wallet, because we are in automated test");
    selectedProvider = new Web3(settings.dev.web3Provider);
    return true;
  }
  return false;
}

/**
 * Prompt user to select a web3Provider and enable their account.
 * Initializes Arc with the newly-selected web3Provider.
 * No-op if `selectedProvider` is already set (one can manually go to readonly mode to clear it)
 * Side-effect is that `selectedProvider` will be set on success.
 * @returns Throws exception on error.
 */
async function enableWeb3Provider(): Promise<void> {
  if (selectedProvider) {
    return;
  }

  let provider: any;
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  let web3Connect: Web3Connect.Core;

  if (!web3ConnectCore) {
    web3Connect = new Web3Connect.Core({
      cacheProvider: true,
      providerOptions: Object.assign(
        /**
         * This will hide the web3connect fallback ("Web3") button which currently
         * doesn't behave well when there is no available extension.  The fallback is
         * apparently "for injected providers that haven't been added to the library or
         * that don't support the normal specification. Opera is an example of it."
         */
        { disableInjectedProvider: !((window as any).web3 || (window as any).ethereum) },
        web3ConnectProviderOptions) as any,
    });

    // eslint-disable-next-line require-atomic-updates
    web3ConnectCore = web3Connect;
  } else {
    web3Connect = web3ConnectCore;
  }

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
    // eslint-disable-next-line no-console
    console.error(`web3Connect closed on error:  ${error ? error.message : "cancelled or unknown error"}`);
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
    // note this will load from its cache, if present
    web3Connect.toggleModal();
    // assuming reject will result in a throw exception caught below
    await onClosePromise;

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Unable to connect to web3 provider:  ${error ? error.message : "unknown error"}`);
    throw new Error("Unable to connect to web3 provider");
  }

  if (!provider) {
    // should only be cancelled, errors should have been handled above
    // eslint-disable-next-line no-console
    console.warn("uncaught error or user cancelled out");
    return;
  }

  /**
   * bail if provider is not correct for the current platform
   */
  await ensureCorrectNetwork(provider);

  /**
 * now ensure that the user has connected to a network and enabled access to the account,
 * whatever the provider requires....
 */
  try {
  // brings up the provider UI as needed
    await provider.enable();
    // eslint-disable-next-line no-console
    console.log(`Connected to network provider ${getWeb3ProviderInfo(provider).name}`);
  } catch (ex) {
  // eslint-disable-next-line no-console
    console.error(`Unable to enable provider: ${ex.message ? ex : "unknown error"}`);
    throw new Error("Unable to enable provider");
  }

  if (!await initializeArc(provider)) {
  // eslint-disable-next-line no-console
    console.error("Unable to initialize Arc");
    throw new Error("Unable to initialize Arc");
  }

  // eslint-disable-next-line require-atomic-updates
  selectedProvider = provider;
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
 * Logout, switch to readonly mode (effectively a logout).
 * Clear caches as every case where we're manually logging out
 * implies that the cache should be cleared
 */
export async function logout(showNotification?: any): Promise<boolean> {
  let success = false;

  uncacheWeb3Info();

  if (selectedProvider) {
    // clearing this, initializeArc will be made to use the default readonly web3Provider
    const networkName = await getNetworkName();
    // eslint-disable-next-line require-atomic-updates
    selectedProvider = undefined;

    success = await initializeArc();

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
 * @returns whether we have a current account
 */
export function getAccountIsEnabled(): boolean {
  /**
   * easy proxy for the presence of an account. selectedProvider cannot be set without an account.
   */
  return !!getWeb3Provider();
}

/**
 * Load web3 wallet provider, first trying from cache, otherwise prompting.
 * This is the only point of contact with the rest of the app for connecting to a wallet.
 * App.tsx invokes `initializeArc` on startup just to get a readonly web3.
 * @param options `IEnableWWalletProviderParams`
 * @returns Promise of true on success
 */
export async function enableWalletProvider(options: IEnableWalletProviderParams): Promise<boolean> {
  try {

    if (inTesting()) {
      return true;
    }

    if (!selectedProvider) {
      await enableWeb3Provider();
      if (!selectedProvider) {
        // something went wrong somewhere
        throw new Error("Unable to connect to a wallet");
      }
      /**
       * notify on success
       */
      if (!options.suppressNotifyOnSuccess && options.showNotification) {
        const web3ProviderInfo = getWeb3ProviderInfo();
        options.showNotification(NotificationStatus.Success, `Connected to ${web3ProviderInfo.name}`);
      }
    } else {
      /**
       * Bail if provider is not correct for the current platform. The user might have redirected
       * Metamask to a different network without us knowing.  Just in that case, check here.
       */
      try {
        await ensureCorrectNetwork(selectedProvider);
      } catch (ex) {
        /**
         * This will result in completely logging out the user and clearing the cached provider,
         * thus enabling them to have a choice of providers when they triy to log in again.
         */
        await logout(options.showNotification);
        throw new Error(ex);
      }
    }

  } catch(err) {
    let msg: string;
    msg = err ? err.message : "Unable to connect to the ethereum provider";
    if (msg.match(/response has no error or result for request/g)) {
      msg = "Unable to connect to ethereum provider, sorry :-(";
    }

    uncacheWeb3Info(false);

    if (options.showNotification) {
      options.showNotification(NotificationStatus.Failure, msg);
    } else {
      alert(msg);
    }
    return false;
  }
  return true;
}

// cf. https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md#ear-listening-for-selected-account-changes
// Polling is Evil!
// TODO: check if this (new?) function can replace polling:
// https://metamask.github.io/metamask-docs/Main_Concepts/Accessing_Accounts
export function pollForAccountChanges(currentAccountAddress: Address | null, interval = 2000): Observable<Address> {
  // eslint-disable-next-line no-console
  console.log(`start polling for account changes from: ${currentAccountAddress}`);
  return Observable.create((observer: any): () => void  => {
    let prevAccount = currentAccountAddress;
    let running = false;

    function poll(): void {

      if (!running) {
        running = true;
        try {
          getCurrentAccountFromProvider()
            .then(async (account: Address | null): Promise<void> => {
              if (prevAccount !== account) {
                if (account && initializedAccount && (account !== initializedAccount)) {
                  /**
                   * Handle when user changes account in MetaMask while already connected to Alchemy.
                   * Also handles how the Burner provider switches from a Fortmatic address to the 
                   * burner address at the time of connecting.
                   */
                  await initializeArc(selectedProvider);
                }
                observer.next(account);
                // eslint-disable-next-line require-atomic-updates
                prevAccount = account;
              }
            })
            // eslint-disable-next-line no-console
            .catch((err): void => {console.error(err ? err.message : "unknown error"); });
        } catch (ex) {
          // eslint-disable-next-line no-console
          console.error(ex ? ex.message : "unknown error");
        }
        finally {
          running = false;
        }
      }
    }

    poll();
    const timeout = setInterval(poll, interval);
    return (): void => { clearTimeout(timeout); };
  });
}

/**
 * extension of the Web3Connect IProviderInfo
 */
export interface IWeb3ProviderInfo extends IProviderInfo {
}
