import { getWeb3ProviderInfo, getProviderNetworkName } from "arc";
import * as Redux from "redux";

import Analytics from "lib/analytics";

import { IAsyncAction } from "@store/async";
import { getProfile } from "@store/profiles/profilesActions";
import { ActionTypes, IWeb3State } from "@store/web3/web3Reducer";

export type ConnectAction = IAsyncAction<"WEB3_CONNECT", void, IWeb3State>;

export function setCurrentAccount(accountAddress: string, network?: string) {
  return async (dispatch: Redux.Dispatch<any, any>, _getState: Function) => {
    const payload = {
      currentAccountAddress: accountAddress,
      networkName: network || await getProviderNetworkName(),
    };

    const action = {
      type: ActionTypes.WEB3_SET_ACCOUNT,
      payload,
    };
    dispatch(action);

    // if the accountAddress is undefined, we are done
    if (accountAddress === undefined) {
      Analytics.reset();
      return;
    }

    // TODO: call alias? https://help.mixpanel.com/hc/en-us/articles/115004497803#avoid-calling-mixpanelalias-on-a-user-more-than-once
    Analytics.identify(accountAddress);

    const web3ProviderInfo = getWeb3ProviderInfo();
    Analytics.register({
      address: accountAddress,
      wallet: web3ProviderInfo ? web3ProviderInfo.name : "none",
    });
    Analytics.people.set({
      address: accountAddress,
      wallet: web3ProviderInfo ? web3ProviderInfo.name : "none",
    });

    dispatch(getProfile(accountAddress, true));
  };
}
