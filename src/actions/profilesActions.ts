import axios from "axios";

import { IAsyncAction, AsyncActionSequence } from "actions/async";
import { IRootState } from "reducers/index";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { ActionTypes, IProfileState, newProfile, profileDbToRedux } from "reducers/profilesReducer";

// Load account profile data from our database for all the "members" of the DAO
export function getProfilesForAllAccounts() {
  return async (dispatch: any, getState: () => IRootState) => {
    const accounts = getState().arc.accounts;

    let accountFilters = [];
    for (const accountKey of Object.keys(accounts)) {
      const account = accounts[accountKey];
      accountFilters.push('{"ethereumAccountAddress":"' + account.address + '"}');
    }

    try {
      const results = await axios.get(process.env.API_URL + '/api/accounts');
      dispatch({
        type: ActionTypes.GET_PROFILE_DATA,
        sequence: AsyncActionSequence.Success,
        payload: { profiles: results.data }
      });
    } catch (e) {
      dispatch({
        type: ActionTypes.GET_PROFILE_DATA,
        sequence: AsyncActionSequence.Failure,
        payload: e.toString()
      });
    }
  }
}

export function getProfile(accountAddress: string) {
  return async (dispatch: any, getState: () => IRootState) => {
    try {
      // Get profile data for this account
      const response = await axios.get(process.env.API_URL + '/api/accounts?filter={"where":{"ethereumAccountAddress":"' + accountAddress + '"}}');
      if (response.data.length > 0) {
        // Update profiles state with profile data for this account
        dispatch({
          type: ActionTypes.GET_PROFILE_DATA,
          sequence: AsyncActionSequence.Success,
          payload: { profiles: response.data }
        });
      } else {
        // Setup blank profile for the account
        dispatch({
          type: ActionTypes.GET_PROFILE_DATA,
          sequence: AsyncActionSequence.Success,
          payload: { profiles: [newProfile(accountAddress)] }
        });
      }
    } catch (e) {
      dispatch({
        type: ActionTypes.GET_PROFILE_DATA,
        sequence: AsyncActionSequence.Failure,
        payload: e.getMessage()
      });
    }
  }
}

export type UpdateProfileAction = IAsyncAction<'UPDATE_PROFILE', { accountAddress: string }, { description: string, name: string, socialURLs?: any }>

export function updateProfile(accountAddress: string, name: string, description: string, timestamp: string, signature: string) {
  return async (dispatch: any, getState: any) => {
    dispatch({
      type: ActionTypes.UPDATE_PROFILE,
      sequence: AsyncActionSequence.Pending,
      meta: { accountAddress }
    } as UpdateProfileAction);

    let serverAccount: any = false;
    try {
      const response = await axios.patch(process.env.API_URL + "/api/accounts", {
        ethereumAccountAddress: accountAddress,
        name,
        description,
        timestamp,
        signature
      });

      if (response.data.length > 0) {
        serverAccount = response.data[0];
      }
    } catch (e) {
      console.error("Error saving profile to server: ", e.response.data.error.message);

      dispatch({
        type: ActionTypes.UPDATE_PROFILE,
        sequence: AsyncActionSequence.Failure,
        meta: { accountAddress },
      } as UpdateProfileAction);

      dispatch(showNotification(NotificationStatus.Failure, `Saving profile failed: ${e.response.data.error.message}`));
      return false;
    }

    dispatch({
      type: ActionTypes.UPDATE_PROFILE,
      sequence: AsyncActionSequence.Success,
      meta: { accountAddress },
      payload: { name, description }
    } as UpdateProfileAction);

    dispatch(showNotification(NotificationStatus.Success, `Profile data saved`));
    return true;
  };
}

export function verifySocialAccount(accountAddress: string, account: IProfileState) {
  return async (dispatch: any, getState: any) => {
    dispatch({
      type: ActionTypes.UPDATE_PROFILE,
      sequence: AsyncActionSequence.Success,
      meta: { accountAddress },
      payload: profileDbToRedux(account)
    });
  }
}
