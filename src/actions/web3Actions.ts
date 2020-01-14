import * as Sentry from "@sentry/browser";
import { getProfile } from "actions/profilesActions";
import { getWeb3ProviderInfo } from "arc";
import Analytics from "lib/analytics";
import { ActionTypes, IWeb3State } from "reducers/web3Reducer";

import * as Redux from "redux";
import { IAsyncAction } from "./async";

export type ConnectAction = IAsyncAction<"WEB3_CONNECT", void, IWeb3State>;

export function setCurrentAccount(accountAddress: string) {
  return async (dispatch: Redux.Dispatch<any, any>, _getState: Function) => {
    const payload = {
      currentAccountAddress: accountAddress,
    };

    const action = {
      type: ActionTypes.WEB3_SET_ACCOUNT,
      payload,
    };
    dispatch(action);

    if (process.env.NODE_ENV === "production") {
      Sentry.configureScope((scope) => {
        scope.setUser({ id: accountAddress || "" });
      });
    }

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
      wallet: web3ProviderInfo.name,
    });
    Analytics.people.set({
      address: accountAddress,
      wallet: web3ProviderInfo.name,
    });

    dispatch(getProfile(accountAddress, true));
  };
}
