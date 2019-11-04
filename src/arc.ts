import { Address, Arc } from "@daostack/client";
// @ts-ignore
import WalletConnectProvider from "@walletconnect/web3-provider";
import { NotificationStatus } from "reducers/notifications";
import { Observable } from "rxjs";
import Web3Connect from "web3connect";
import { IProviderInfo } from "web3connect/lib/helpers/types";
import { settings } from "./settings";
import { getNetworkId, getNetworkName, waitUntilTrue, isMobileBrowser } from "./lib/util";

const Portis = require("@portis/web3");
const Fortmatic = require("fortmatic");
const Web3 = require("web3");

/**
 * This is only set after the user has selected a provider and enabled an account.
 * It is like window.ethereum, but has not necessarily been injected as such.
 */
let selectedProvider: any;
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
      console.log(`Connected Arc to ${await getNetworkName(provider.__networkId)}${readonly ? " (readonly)" : ""} `);
    }
  } catch (reason) {
    console.error(reason.message);
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
    console.error(`connected to the wrong network, should be ${correctNetworkErrorMsg}`);
    throw new Error(`Please connect your wallet provider to ${correctNetworkErrorMsg}`);
  }
}

function inTesting(): boolean {
  if (process.env.NODE_ENV === "development" && navigator.webdriver) {
    // in test mode, we have an unlocked ganache and we are not using any wallet
    console.log("not using any wallet, because we are in automated test");
    selectedProvider = new Web3(settings.dev.web3Provider);
    return true;
  }
  return false;
}

/**
 * Prompt user to select a web3Provider and enable their account.
 * Initializes Arc with the newly-selected web3Provider.
 * Is a no-op if already done.
 * Side-effect is that `selectedProvider` will be set on success.
 * @param provider Optional web3 provider, supplied when using a cached provider
 * @returns Throws exception on error.
 */
async function enableWeb3Provider(provider?: any): Promise<void> {
  /**
   * Already got a selected provider, and is the same as the requested provider?
   * We'll replace it if a  differen provider has been supplied.
   * Otherwise we'll swing with selectedProvider, and this becomes mostly a no-op.
   */
  if (selectedProvider && (!provider || (selectedProvider === provider))) {
    return;
  } else if (!provider) {

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
        web3ConnectProviderOptions) as any,
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
      console.error(`web3Connect closed on error:  ${error.message}`);
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
      console.error(`Unable to connect to web3 provider:  ${error.message}`);
      throw new Error("Unable to connect to web3 provider");
    }

    if (!provider) {
      // should only be cancelled, errors should have been handled above
      console.warn("uncaught error or user cancelled out");
      return;
    }
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
    console.log(`Connected to network provider ${getWeb3ProviderInfo(provider).name}`);
  } catch (ex) {
    console.error(`Unable to enable provider: ${ex.message}`);
    throw new Error("Unable to enable provider");
  }

  if (!await initializeArc(provider)) {
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
 * switch to readonly mode (effectively a logout)
 */
export async function gotoReadonly(showNotification?: any): Promise<boolean> {
  let success = false;
  if (selectedProvider) {
    // clearing this, initializeArc will be made to use the default web3Provider
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
 * Given IWeb3ProviderInfo, get a web3Provider and InitializeArc with it.
 * Throws exception on any failure.
 *
 * This is meant to be used to bypass allowing the user to select a provider in the
 * case where we are initializing the app from a previously-cached (selected) provider.
 * @param web3ProviderInfo required IWeb3ProviderInfo
 */
async function setWeb3Provider(web3ProviderInfo: IWeb3ProviderInfo): Promise<void> {
  let provider: any;

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
        provider = await Web3Connect.ConnectToWalletConnect(
          web3ConnectProviderOptions.walletconnect.package,
          Object.assign(web3ConnectProviderOptions.walletconnect.options, { network: web3ConnectProviderOptions.network }));
        break;
      case "web":
        switch (web3ProviderInfo.name) {
          case "Portis":
            provider = await Web3Connect.ConnectToPortis(
              web3ConnectProviderOptions.portis.package,
              Object.assign(web3ConnectProviderOptions.portis.options, { network: web3ConnectProviderOptions.network }));
            break;
          case "Fortmatic":
            provider = await Web3Connect.ConnectToFortmatic(
              web3ConnectProviderOptions.fortmatic.package,
              Object.assign(web3ConnectProviderOptions.fortmatic.options, { network: web3ConnectProviderOptions.network }));
            break;
        }
        break;
    }

    if (!provider) {
      throw new Error("Uncaught error or user cancelled out");
    }

  } catch (ex) {
    console.error(`Unable to instantiate provider: ${ex.message}`);
    throw new Error("Unable to instantiate provider");
  }
  /**
   * make sure the provider is the one we're looking for
   */
  if (!provider[web3ProviderInfo.check]) {
    throw new Error(`instantiated provider is not the one requested: ${provider.name} != ${web3ProviderInfo.name}`);
  }

  await enableWeb3Provider(provider);
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

const ACCOUNT_STORAGEKEY = "currentAddress";
const WALLETCONNECT_STORAGEKEY = "walletconnect";
const PROVIDER_STORAGEKEY = "currentWeb3ProviderInfo";

export function cacheWeb3Info(account: Address): void {
  if (account) {
    localStorage.setItem(ACCOUNT_STORAGEKEY, account);
  } else {
    localStorage.removeItem(ACCOUNT_STORAGEKEY);
  }
  const providerInfo = getWeb3ProviderInfo();
  if (providerInfo) {
    localStorage.setItem(PROVIDER_STORAGEKEY, JSON.stringify(providerInfo));
  } else {
    localStorage.removeItem(PROVIDER_STORAGEKEY);
    // hack until fixed by WalletConnect (so after logging out, can rescan the QR code)
    localStorage.removeItem(WALLETCONNECT_STORAGEKEY);
  }
}

export function uncacheWeb3Info(): void {
  localStorage.removeItem(ACCOUNT_STORAGEKEY);
  localStorage.removeItem(PROVIDER_STORAGEKEY);
  // hack until fixed by WalletConnect (so after logging out, can rescan the QR code)
  localStorage.removeItem(WALLETCONNECT_STORAGEKEY);
}

export function getCachedAccount(): Address | null {
  return localStorage.getItem(ACCOUNT_STORAGEKEY);
}

export function getCachedWeb3ProviderInfo(): IWeb3ProviderInfo | null {
  const cached = localStorage.getItem(PROVIDER_STORAGEKEY);
  return cached ? JSON.parse(cached) : null;
}


/**
 * fully enable a cached provider, if available.  Noop is nothing is cached or
 * current provider is the same as the given one.
 * Exception if cached provider can't be fully enabled.
 * @param showNotification
 */
async function loadCachedWeb3Provider(): Promise<void> {

  const cachedWeb3ProviderInfo = getCachedWeb3ProviderInfo();
  if (cachedWeb3ProviderInfo) {

    try {
      await setWeb3Provider(cachedWeb3ProviderInfo);
      console.log("using cached web3Provider");
    } catch(ex) {
      console.error("failed to instantiate cached web3Provider");
      uncacheWeb3Info();
      throw new Error(ex);
    }
  }
}

export interface IEnableWalletProviderParams {
  suppressNotifyOnSuccess?: boolean;
  showNotification: any;
}

/**
 * Load web3 wallet provider, first trying from cache, otherwise prompting.
 * This is the only point of contact with the rest of the app for connecting to a wallet.
 * App.tsx invokes `initializeArc` on startup just to get a readonly web3.
 * @param options `IEnableWWalletProviderParams`
 * @returns Promise of true on success
 */
export async function enableWalletProvider(options: IEnableWalletProviderParams): Promise<boolean> {
  let msg: string;
  try {

    if (inTesting()) {
      return true;
    }

    if (!selectedProvider) {
      await loadCachedWeb3Provider();
      if (!selectedProvider)
      {
        await enableWeb3Provider();
      }
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
        await gotoReadonly(options.showNotification);
        throw new Error(ex);
      }
    }

  } catch(err) {
    msg = err.message || "Unable to connect to the web3 provider";
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
                 * handle when user changes account in MetaMask while already connected to Alchemy, thus
                 * having bypassed `enableWeb3Provider` and not having called `initializeArc`.
                 */
                  await initializeArc(selectedProvider);
                }
                observer.next(account);
                // eslint-disable-next-line require-atomic-updates
                prevAccount = account;
              }
            })
            .catch((err): void => {console.error(err.message); });
        } catch (ex) {
          console.error(ex.message);
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
