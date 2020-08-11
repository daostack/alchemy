import Box = require("3box");
import { AsyncActionSequence, IAsyncAction } from "actions/async";
import { getWeb3Provider } from "arc";
import Analytics from "lib/analytics";
import * as Redux from "redux";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { ActionTypes, FollowType, newProfile, IFollowingPayload } from "reducers/profilesReducer";
import { arrayRemove } from "lib/util";
import { Address } from "@daostack/arc.js";
import { IRootState } from "reducers";
import i18next from "i18next";

// Load account profile data from our database for all the "members" of the DAO
// TODO: use this once 3box fixes getProfiles
export function getProfilesForAddresses(addresses: string[]) {
  return async (dispatch: Redux.Dispatch<any, any>): Promise<void> => {
    try {
      const results = await Box.getProfiles(addresses);
      dispatch({
        type: ActionTypes.GET_PROFILE_DATA,
        sequence: AsyncActionSequence.Success,
        payload: { profiles: results.data },
      });
    } catch (e) {
      dispatch({
        type: ActionTypes.GET_PROFILE_DATA,
        sequence: AsyncActionSequence.Failure,
        payload: e.message,
      });
    }
  };
}

interface IThreeBoxInfo {
  threeBox: any;
  threeBoxSpace: any;
}

const spaceName = "DAOstack";

/**
 * Returns an authorized 3Box instance and 3BoxSpace, ensures that the
 * account's 3Box space exists, and all account-specific data has
 * been fetched.  Updates state if needed.
 *
 * Caller is expected to handle exceptions.
 *
 * @param accountAddress
 */
async function get3Box(accountAddress: Address, dispatch: any, state: any, withSpace = false): Promise<IThreeBoxInfo> {
  let box;
  let space;
  let updateState = false;

  if (state.profiles.threeBox) {
    box = state.profiles.threeBox;
  } else {
    const web3Provider = getWeb3Provider();

    console.log("Box.create...");
    console.time("Box.create");
    box = await Box.create(web3Provider);
    console.timeEnd("Box.create");
    //box = await Box.openBox(accountAddress, web3Provider);

    console.log(`accountAddress for auth: ${accountAddress}`);

    console.log("box.auth...");
    console.time("box.auth");
    await box.auth([spaceName], { address: accountAddress });
    console.timeEnd("box.auth");

    console.log("box.syncDone...");
    console.time("box.syncDone");
    await box.syncDone;
    console.timeEnd("box.syncDone");
    updateState = true;
  }
  /**
   * this ensures that a space for the account exists
   */
  if (state.profiles.threeBoxSpace) {
    space = state.profiles.threeBoxSpace;
  }
  else if (withSpace) {
    /**
     * It is assumed here that the 3box admin space has already been created
     */
    console.log("box.openSpace");
    console.time("box.openSpace");
    space = await box.openSpace(spaceName);
    console.timeEnd("box.openSpace");

    console.log("space.syncDone");
    console.time("space.syncDone");
    await space.syncDone;
    console.timeEnd("space.syncDone");
    updateState = true;
  }

  const result = {
    threeBox: box,
    threeBoxSpace: space,
  };

  if (updateState) {
    /**
     * This is synchronous.
     */
    dispatch({
      type: ActionTypes.SAVE_THREEBOX,
      sequence: AsyncActionSequence.Success,
      payload: result,
    });
  }

  return result;
}

export function getProfile(accountAddress: string, currentAccount = false):
(dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => Promise<void> {

  return async (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState): Promise<void> => {
    if (accountAddress) {
      try {
        /**
         * Get profile data for this account.
         * Note accountAddress is case insensitive to `Box.getProfile`, but
         * we need to cast to lower because state.currentAccountAddress is cast to lower, thus
         * facilitating address comparisons, and array key matching.
         */
        accountAddress = accountAddress.toLowerCase();
        const profile: any = await Box.getProfile(accountAddress);

        if (profile) {
          profile.ethereumAccountAddress = accountAddress;
          profile.socialURLs = await Box.getVerifiedAccounts(profile);
          const space = await Box.getSpace(accountAddress, spaceName);
          await space.syncDone;

          if (space.follows) {
            profile.follows = space.follows;
          } else {
            profile.follows = {
              daos: [],
              proposals: [],
              users: [],
            };
          }

          dispatch({
            type: ActionTypes.GET_PROFILE_DATA,
            sequence: AsyncActionSequence.Success,
            payload: { profiles: { [accountAddress]: profile } },
          });

          if (currentAccount) {
            // If getting profile for the current account then update our analytics services with the profile data
            Analytics.people.set({
              Name: profile.name,
              Description: profile.description,
            });
          }
        } else {
          // Setup blank profile for the account
          dispatch({
            type: ActionTypes.GET_PROFILE_DATA,
            sequence: AsyncActionSequence.Success,
            payload: { profiles: { [accountAddress]: newProfile(accountAddress) } },
          });
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Error getting profile from 3box", e);
        dispatch({
          type: ActionTypes.GET_PROFILE_DATA,
          sequence: AsyncActionSequence.Failure,
          payload: e.message,
        });
      }
    }

    dispatch(showNotification(NotificationStatus.Success, i18next.t("3BoxLoginSuccess")));
    return true;
  };
}

export function threeboxLogin(accountAddress: string): (dispatch: any, _getState: any) => Promise<boolean> {
  return async (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState): Promise<boolean> => {
    const state = _getState();

    try {
      if (state.profiles.threeBox && state.profiles.threeBoxSpace) {
        return true;
      } else {
        await get3Box(accountAddress, dispatch, state, true);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error logging in to 3box: ", e);

      dispatch(showNotification(NotificationStatus.Failure, `Logging in to 3box failed: ${e.message}`));
      return false;
    }

    dispatch(showNotification(NotificationStatus.Success, i18next.t("3BoxLoginSuccess")));
    return true;
  };
}

export function threeBoxLogout(): (dispatch: any, _getState: any) => Promise<void> {
  return async (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState): Promise<void> => {
    const state = _getState();
    if (state.profiles.threeBox) {
      state.profiles.threeBox.logout();
      dispatch({
        type: ActionTypes.SAVE_THREEBOX,
        sequence: AsyncActionSequence.Success,
        payload: { threeBox: null, threeBoxSpace: null },
      });
    }
  };
}

export type UpdateProfileAction = IAsyncAction<"UPDATE_PROFILE", { accountAddress: string }, { description: string; name: string; socialURLs?: any }>;

export function updateProfile(accountAddress: string, name: string, description: string): (dispatch: any, _getState: any) => Promise<boolean> {
  return async (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState): Promise<boolean> => {
    dispatch({
      type: ActionTypes.UPDATE_PROFILE,
      sequence: AsyncActionSequence.Pending,
      meta: { accountAddress },
    } as UpdateProfileAction);

    let threeBox;

    try {
      threeBox = (await get3Box(accountAddress, dispatch, _getState())).threeBox;
      await threeBox.public.setMultiple(["name", "description"], [name, description]);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error saving profile to 3box: ", e);

      dispatch({
        type: ActionTypes.UPDATE_PROFILE,
        sequence: AsyncActionSequence.Failure,
        meta: { accountAddress },
      } as UpdateProfileAction);

      dispatch(showNotification(NotificationStatus.Failure, `Saving profile to 3box failed: ${e.message}`));
      return false;
    }

    dispatch({
      type: ActionTypes.UPDATE_PROFILE,
      sequence: AsyncActionSequence.Success,
      meta: { accountAddress },
      payload: { name, description, threeBox },
    } as UpdateProfileAction);

    Analytics.track("Update Profile", {
      Name: name,
      Description: description,
    });

    Analytics.people.set({
      Name: name,
      Description: description,
    });

    dispatch(showNotification(NotificationStatus.Success, i18next.t("3BoxProfileSuccess")));
    return true;
  };
}

export type FollowItemAction = IAsyncAction<"FOLLOW_ITEM", { accountAddress: string }, IFollowingPayload>;

export function toggleFollow(accountAddress: string, type: FollowType, id: string) {
  return async (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState): Promise<boolean> => {
    let threeBoxSpace;

    try {
      threeBoxSpace = (await get3Box(accountAddress, dispatch, _getState())).threeBoxSpace;
    } catch (e) {
      dispatch(showNotification(NotificationStatus.Failure, `Failed to connect to 3box: ${e.message}`));
      return false;
    }

    let follows = await threeBoxSpace.public.get("follows");
    if (!follows) {
      follows = {
        daos: [],
        proposals: [],
        users: [],
      };
    }
    if (!follows[type]) {
      follows[type] = [];
    }

    let isFollowing = true;

    if (follows[type].includes(id)) {
      follows[type] = arrayRemove(follows[type], id);
      isFollowing = false;
    } else {
      follows[type].push(id);
    }

    // TODO: check success?
    await threeBoxSpace.public.set("follows", follows);

    dispatch({
      type: ActionTypes.FOLLOW_ITEM,
      sequence: AsyncActionSequence.Success,
      meta: { accountAddress },
      payload: { type, id, isFollowing },
    } as FollowItemAction);

    dispatch(showNotification(NotificationStatus.Success, i18next.t((isFollowing ? "Following" : "UnFollowing")) + ` ${type.slice(0, -1)} ${id.slice(0, 8)}...`));
  };
}
