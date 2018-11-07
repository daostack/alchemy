import axios from "axios";

import { IAsyncAction, AsyncActionSequence } from "actions/async";
import { IRootState } from "reducers/index";
import { ActionTypes } from "reducers/profilesReducer";

// Load account profile data from our database for all the "members" of the DAO
export function getProfilesForAllAccounts() {
  return async (dispatch: any, getState: () => IRootState) => {
    const accounts = getState().arc.accounts;

    let accountFilters = [];
    for (let accountKey in accounts) {
      const account = accounts[accountKey];
      accountFilters.push('{"ethereumAccountAddress":"' + account.address + '"}');
    }

    try {
      const results = await axios.get(process.env.API_URL + '/api/accounts?filter={"where":{"or":[' + accountFilters.join(",") + ']}}');
      console.log("got all profiles = ", results.data);
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

export type UpdateProfileAction = IAsyncAction<'UPDATE_PROFILE', { accountAddress: string }, { name: string }>

export function updateProfile(accountAddress: string, name: string, description: string, signature: string) {
  return async (dispatch: any, getState: any) => {
    dispatch({
      type: ActionTypes.UPDATE_PROFILE,
      sequence: AsyncActionSequence.Pending,
      meta: { accountAddress }
    } as UpdateProfileAction);

    let serverAccount: any = false;
    try {
      const response = await axios.put(process.env.API_URL + "/api/accounts", {
        ethereumAccountAddress: accountAddress,
        name,
        description,
        signature
      });

      if (response.data.length > 0) {
        serverAccount = response.data[0];
      }
    } catch (e) {
      console.error(e);

      return dispatch({
        type: ActionTypes.UPDATE_PROFILE,
        sequence: AsyncActionSequence.Failure,
        meta: { accountAddress },
      } as UpdateProfileAction);
    }

    dispatch({
      type: ActionTypes.UPDATE_PROFILE,
      sequence: AsyncActionSequence.Success,
      meta: { accountAddress },
      payload: { name, description }
    } as UpdateProfileAction);
  };
}