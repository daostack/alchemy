import { AsyncActionSequence, IAsyncAction } from "actions/async";
import { enableWalletProvider, getWeb3Provider } from "arc";
import axios from "axios";
import * as sigUtil from "eth-sig-util";
import * as ethUtil from "ethereumjs-util";
import { IRootState } from "reducers/index";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { ActionTypes, IProfileState, newProfile, profileDbToRedux } from "reducers/profilesReducer";
import { promisify } from "util";

const ACCESS_TOKEN_STORAGEKEY = "accessToken";

// Load account profile data from our database for all the "members" of the DAO
export function getProfilesForAllAccounts() {
  return async (dispatch: any, getState: () => IRootState) => {
    const accounts = getState().arc.accounts;
    const accountFilters = [];

    for (const accountKey of Object.keys(accounts)) {
      const account = accounts[accountKey];
      accountFilters.push("{\"ethereumAccountAddress\":\"" + account.address + "\"}");
    }

    try {
      const results = await axios.get(process.env.API_URL + "/api/accounts");
      dispatch({
        type: ActionTypes.GET_PROFILE_DATA,
        sequence: AsyncActionSequence.Success,
        payload: { profiles: results.data },
      });
    } catch (e) {
      dispatch({
        type: ActionTypes.GET_PROFILE_DATA,
        sequence: AsyncActionSequence.Failure,
        payload: e.toString(),
      });
    }
  };
}

export function getProfile(accountAddress: string) {
  return async (dispatch: any) => {
    const url = process.env.API_URL + "/api/accounts?filter={\"where\":{\"ethereumAccountAddress\":\"" + accountAddress + "\"}}";
    try {
      // Get profile data for this account
      const response = await axios.get(url);
      if (response.data.length > 0) {
        // Update profiles state with profile data for this account
        dispatch({
          type: ActionTypes.GET_PROFILE_DATA,
          sequence: AsyncActionSequence.Success,
          payload: { profiles: response.data },
        });
      } else {
        // Setup blank profile for the account
        dispatch({
          type: ActionTypes.GET_PROFILE_DATA,
          sequence: AsyncActionSequence.Success,
          payload: { profiles: [newProfile(accountAddress)] },
        });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Error getting ${url} (${e.message})`);
      dispatch({
        type: ActionTypes.GET_PROFILE_DATA,
        sequence: AsyncActionSequence.Failure,
        payload: e.toString(),
      });
    }
  };
}

export type UpdateProfileAction = IAsyncAction<"UPDATE_PROFILE", { accountAddress: string }, { description: string; name: string; socialURLs?: any }>;

export function updateProfile(accountAddress: string, name: string, description: string) {
  return async (dispatch: any, _getState: any) => {
    dispatch({
      type: ActionTypes.UPDATE_PROFILE,
      sequence: AsyncActionSequence.Pending,
      meta: { accountAddress },
    } as UpdateProfileAction);

    const accessToken = await dispatch(checkIfAuthenticated(accountAddress));
    if (!accessToken) {
      dispatch({
        type: ActionTypes.UPDATE_PROFILE,
        sequence: AsyncActionSequence.Failure,
        meta: { accountAddress },
      } as UpdateProfileAction);

      dispatch(showNotification(NotificationStatus.Failure, `Saving profile failed, not authenticated`));
      return false;
    }

    try {
      await axios.patch(process.env.API_URL + "/api/accounts", {
        ethereumAccountAddress: accountAddress,
        name,
        description
      }, { headers: { 'Authorization': accessToken} });
    } catch (e) {
      const errorMsg = e.response && e.response.data ? e.response.data.error.message : e.toString();
      // eslint-disable-next-line no-console
      console.error("Error saving profile to server: ", errorMsg);

      dispatch({
        type: ActionTypes.UPDATE_PROFILE,
        sequence: AsyncActionSequence.Failure,
        meta: { accountAddress },
      } as UpdateProfileAction);

      dispatch(showNotification(NotificationStatus.Failure, `Saving profile failed: ${errorMsg}`));
      return false;
    }

    dispatch({
      type: ActionTypes.UPDATE_PROFILE,
      sequence: AsyncActionSequence.Success,
      meta: { accountAddress },
      payload: { name, description },
    } as UpdateProfileAction);

    dispatch(showNotification(NotificationStatus.Success, "Profile data saved"));
    return true;
  };
}

export function verifySocialAccount(accountAddress: string, account: IProfileState) {
  return async (dispatch: any, _getState: any) => {
    dispatch({
      type: ActionTypes.UPDATE_PROFILE,
      sequence: AsyncActionSequence.Success,
      meta: { accountAddress },
      payload: profileDbToRedux(account),
    });
  };
}

/**
 *  See if we have a locally stored accessToken for a user to authenticate with
 *    otherwise go through the login procedure to get one
 *
 * @param accountAddress The address to log in
 * @return string the accessToken
 */
export function checkIfAuthenticated(accountAddress:string) {
  return async (dispatch: any, _getState: any) => {
    if (localStorage.getItem(ACCESS_TOKEN_STORAGEKEY)) {
      return localStorage.getItem(ACCESS_TOKEN_STORAGEKEY);
    }
    return await dispatch(serverLoginByEthSign(accountAddress));
  }
}

export function serverLoginByEthSign(accountAddress: string) {
  return async (dispatch: any, _getState: any) => {
    dispatch({
      type: ActionTypes.LOGIN,
      sequence: AsyncActionSequence.Pending,
      meta: { accountAddress },
    });

    if (!(await enableWalletProvider({ showNotification }))) { return false; }

    const response = await axios.get(process.env.API_URL + "/nonce?address=" + accountAddress);
    const nonce = response.data;

    const web3Provider = await getWeb3Provider();
    try {
      const timestamp = new Date().getTime().toString();
      const text = ("Please sign this message to prove your ownership of this account '" +
        accountAddress + "'. There's no gas cost to you. " + nonce);
      const msg = ethUtil.bufferToHex(Buffer.from(text, "utf8"));

      const method = "personal_sign";

      // Create promise-based version of send
      const send = promisify(web3Provider.sendAsync);
      const params = [msg, accountAddress];
      const result = await send({ method, params, from: accountAddress });
      if (result.error) {
        console.error("Signing canceled, data was not saved");
        showNotification(NotificationStatus.Failure, "Saving profile was canceled");
        return false;
      }
      const signature = result.result;

      const recoveredAddress: string = sigUtil.recoverPersonalSignature({ data: msg, sig: signature });
      if (recoveredAddress.toLowerCase() !== accountAddress) {
        showNotification(NotificationStatus.Failure, "Saving profile failed, please try again");
        return false;
      }

      try {
        const response = await axios.post(process.env.API_URL + "/loginByEthSign", {
          address: accountAddress,
          signature,
          nonce,
          timestamp,
          payload: text
        });
        localStorage.setItem(ACCESS_TOKEN_STORAGEKEY, response.data.token);
        return response.data.token;
      } catch (e) {
        const errorMsg = e.response && e.response.data ? e.response.data.error.message : e.toString();
        console.error("Error logging in: ", errorMsg);

        dispatch({
          type: ActionTypes.LOGIN,
          sequence: AsyncActionSequence.Failure,
          meta: { accountAddress },
        });

        dispatch(showNotification(NotificationStatus.Failure, `Login failed: ${errorMsg}`));
        return false;
      }

      dispatch({
        type: ActionTypes.LOGIN,
        sequence: AsyncActionSequence.Success,
        meta: { accountAddress }
      });

      dispatch(showNotification(NotificationStatus.Success, "Login succeeded!"));
      return true;
    } catch (error) {
      if (web3Provider.isSafe) {
        console.error(error.message);
        showNotification(NotificationStatus.Failure, "We're very sorry, but Gnosis Safe does not support message signing :-(");
      } else {
        showNotification(NotificationStatus.Failure, error.message);
      }
      return false
    }
  };
}

export function serverLogout() {
  localStorage.removeItem(ACCESS_TOKEN_STORAGEKEY);
}
