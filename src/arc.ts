import { NotificationStatus } from "reducers/notifications";
import { getNetworkId, getNetworkName, targetedNetwork, Networks } from "./lib/util";
import { settings } from "./settings";
import { RetryLink } from "apollo-link-retry";
import { Address, Arc } from "@daostack/arc.js";
import Web3Modal, { getProviderInfo, IProviderInfo } from "web3modal";
import { Observable } from "rxjs";
import gql from "graphql-tag";

const Web3 = require("web3");

/**
 * This is only set after the user has selected a provider and enabled an account.
 * It is like window.ethereum, but has not necessarily been injected as such.
 */
let selectedProvider: any;
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
let web3Modal: Web3Modal;
let initializedAccount: Address;



/**
 * return the default Arc configuration given the execution environment
 */
export function getArcSettings(network?: Networks): any {
  const networks = network || targetedNetwork();
  const arcSettings = settings[networks];
  return arcSettings;
}

/**
 * Return the web3 in current use by Arc.
 */
function getWeb3(network: Networks): any {
  const arc = (window as any).arcs[network];
  const web3 = arc ? arc.web3 : null;
  return web3;
}

/**
 * Return the default account in current use by Arc.
 */
async function _getCurrentAccountFromProvider(network: Networks, web3?: any): Promise<string> {
  web3 = web3 || getWeb3(network as Networks);
  if (!web3) {
    return null;
  }
  const accounts = await web3.eth.getAccounts();
  return accounts[0] ? accounts[0].toLowerCase() : null;
}

/**
 * Returns an Arc instance by Netowrk.
 * Throws an exception when Arc hasn't yet been initialized!
 * @param {Networks} network
 * @returns {Arc}
 */
export function getArc(network: Networks): Arc {
  const arc = (window as any).arcs[network];
  if (!arc) {
    throw Error(`window.arc is not defined for ${network} - please call initializeArc first`);
  }
  return arc;
}

/**
 * Returns the arcs object
 */
export function getArcs(): any {
  const arcs = (window as any).arcs;
  if (!arcs) {
    throw Error("window.arcs is not defined - please call initializeArc first");
  }
  return arcs;
}

/**
 * Returns daos object (which hold all daos from all networks)
 */
export function getDAOs(): any {
  const daos = (window as any).daos;
  if (!daos) {
    throw Error("window.daos is not defined - please call initializeArc first");
  }
  return daos;
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
 * Returns a IWeb3ProviderInfo when a provider has been selected and is fully available.
 * Does not know about the default read-only providers.
 */
export function getWeb3ProviderInfo(provider?: any): IWeb3ProviderInfo {
  provider = provider || selectedProvider;
  return provider ? getProviderInfo(provider) : null;
}

export function providerHasConfigUi(provider?: any): any | undefined {
  provider = provider || selectedProvider;
  return provider && provider.isTorus;
}

/**
 * initialize Arc.  Does not throw exceptions, returns boolean success.
 * @param provider Optional web3Provider
 */
export async function initializeArc(network: Networks, provider?: any): Promise<boolean> {
  let success = false;
  let arc: any;

  try {

    const arcSettings = getArcSettings(network);

    if (provider) {
      arcSettings.web3Provider = provider;
    } else {
      provider = arcSettings.web3Provider;
    }

    const readonly = typeof provider === "string";

    // https://www.apollographql.com/docs/link/links/retry/
    const retryLink = new RetryLink({
      attempts: (count) => {
        return (count !== 10);
      },
      delay: () => {
        // This will give a random delay between retries between the range of 5 to 30 seconds.
        return Math.floor(Math.random() * (30000 - 5000 + 1) + 5000);
      },
    });

    arcSettings.graphqlRetryLink = retryLink;

    // if there is no existing arc, we create a new one
    if ((window as any).arcs[network]) {
      arc = (window as any).arcs[network];
      arc.web3 = new Web3(provider);
    }
    else {
      arc = new Arc(arcSettings);
    }

    let contractInfos;

    try {
      contractInfos = await arc.fetchContractInfos();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Error fetching contractinfos: ${err.message}`);
    }

    const query = gql`query AllDaos {
     daos (first: 1000) {
       id
     }
    }`;
    const daos = await arc.sendQuery(query, {});

    if (daos !== undefined) {
      const daosMap = {} as any;
      for (const dao of daos.data.daos) {
        daosMap[dao.id] = network;
      }
      (window as any).daos[network] = daosMap;
    } else {
      // eslint-disable-next-line no-console
      console.error(`Error fetching daos from: ${network}`);
    }

    success = !!contractInfos && !!daos;

    if (success) {
      initializedAccount = await _getCurrentAccountFromProvider(network, arc.web3);

      if (!initializedAccount) {
      // then something went wrong
      // eslint-disable-next-line no-console
        console.error(`Unable to obtain an account from the provider in ${network}`);
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

  (window as any).arcs[network] = success ? arc : null;

  return success;
}


/**
 * Checks if the web3 provider is set to the required network.
 * Does not ensure we have access to the user's account.
 * throws an Error if no provider or wrong provider
 * @param provider web3Provider
 * @return the expected network nameif not correct
*/
async function ensureCorrectNetwork(provider: any, network?: Networks): Promise<void> {

  /**
   * It is required that the provider be the correct one for the current platform
   */
  const expectedNetworkName = network || targetedNetwork();

  // TODO: we should not use the network NAME but the network ID to identify the network...
  const networkName = await getProviderNetworkName(provider);

  if (networkName !== expectedNetworkName) {
    if (expectedNetworkName === "xdai") {
      // TODO: xdai is reporting network 'unknown (100)` , it seems
      if (networkName === "unknown (100)") {
        // we are fine, mayby
        return;
      }
    }
    // eslint-disable-next-line no-console
    console.error(`connected to the wrong network, should be ${expectedNetworkName} (instead of "${networkName}")`);
    throw new Error(`Please connect your wallet provider to ${expectedNetworkName}`);
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
  if (web3Modal) {
    web3Modal.clearCachedProvider();
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
  if (process.env.NODE_ENV === "development" && (global as any).inAlchemyTests) {
    // in test mode, we have an unlocked ganache and we are not using any wallet
    // eslint-disable-next-line no-console
    console.log("not using any wallet, because we are in automated test");
    selectedProvider = new Web3(settings.ganache.web3Provider);
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
async function enableWeb3Provider(network?: Networks): Promise<void> {
  if (selectedProvider) {
    return;
  }

  let provider: any;
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  let _web3Modal: Web3ConnectModal;

  if (!web3Modal) {
    _web3Modal = new Web3Modal({
      cacheProvider: true,
      providerOptions: getArcSettings().web3ConnectProviderOptions,
    });

    // eslint-disable-next-line require-atomic-updates
    web3Modal = _web3Modal;
  } else {
    _web3Modal = web3Modal;
  }

  let resolveOnClosePromise: () => void;
  let rejectOnClosePromise: (reason?: any) => void;

  const onClosePromise = new Promise(
    (resolve: () => void, reject: (reason?: any) => void): any => {
      resolveOnClosePromise = resolve;
      rejectOnClosePromise = reject;
      _web3Modal.on("close", (): any => {
        return resolve();
      });
    });

  _web3Modal.on("error", (error: Error): any => {
    // eslint-disable-next-line no-console
    console.error(`web3Connect closed on error:  ${error ? error.message : "cancelled or unknown error"}`);
    return rejectOnClosePromise(error);
  });

  _web3Modal.on("connect", (newProvider: any): any => {
    provider = newProvider;
    /**
     * Because we won't receive the "close" event in this case, even though
     * the window will have closed
     */
    return resolveOnClosePromise();
  });

  try {
    // note this will load from its cache, if present
    _web3Modal.toggleModal();
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
  await ensureCorrectNetwork(provider, network);

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

  if (!await initializeArc(await getNetworkName(provider.chainId), provider)) {
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
  return _getCurrentAccountFromProvider(await getNetworkName(selectedProvider.chainId));
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

    success = await initializeArc(networkName);

    if (!success) {
      const msg = `Unable to disconnect from : ${networkName}`;
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
export async function enableWalletProvider(options: IEnableWalletProviderParams, network = "xdai" as Networks): Promise<boolean> {
  try {

    if (inTesting()) {
      return true;
    }

    /**
     * If not MetaMask or other injected web3 and on ganache then try to connect to local ganache directly.
     * Note we're going to ignore any injected web3 in favor of using our own preferred version of Web3.
     */
    if (!selectedProvider && (targetedNetwork() === "ganache" && !(window as any).ethereum)) {
      selectedProvider = new Web3(settings.ganache.web3Provider);
    }

    if (!selectedProvider) {
      await enableWeb3Provider(network);
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
        await ensureCorrectNetwork(selectedProvider, network);
      } catch (ex) {
        /**
         * This will result in completely logging out the user and clearing the cached provider,
         * thus enabling them to have a choice of providers when they triy to log in again.
         */
        await logout(options.showNotification);
        throw new Error(ex);
      }
    }

  } catch (err) {
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
  return Observable.create((observer: any): () => void => {
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
                  await initializeArc(await getNetworkName(selectedProvider.chainId), selectedProvider);
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
 * extension of the Web3Modal IProviderInfo
 */
export interface IWeb3ProviderInfo extends IProviderInfo {
}
