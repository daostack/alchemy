import * as Sentry from "@sentry/browser";
import { getProfile } from "actions/profilesActions";
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
      return;
    }

    dispatch(getProfile(accountAddress));
  };
}
