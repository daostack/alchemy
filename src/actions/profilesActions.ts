import Box = require("3box");

import { AsyncActionSequence, IAsyncAction } from "actions/async";
import { getWeb3Provider } from "arc";
import Analytics from "lib/analytics";
import * as Redux from "redux";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { ActionTypes, FollowType, newProfile } from "reducers/profilesReducer";
import { arrayRemove } from "lib/util";
import { IRootState } from "reducers/index";

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

export function getProfile(accountAddress: string, currentAccount = false) {
  return async (dispatch: Redux.Dispatch<any, any>): Promise<any> => {
    try {
      // Get profile data for this account
      const profile: any = await Box.getProfile(accountAddress);

      if (profile) {
        profile.ethereumAccountAddress = accountAddress;
        profile.socialURLs = await Box.getVerifiedAccounts(profile);
        const space = await Box.getSpace(accountAddress, "DAOstack");
        await space.syncDone;

        if (space.follows) {
          profile.follows = space.follows;
        } else {
          profile.follows = {
            daos: [],
            proposals: [],
            plugins: [],
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
      console.error(`Error getting profile from 3box (${e.message})`);
      dispatch({
        type: ActionTypes.GET_PROFILE_DATA,
        sequence: AsyncActionSequence.Failure,
        payload: e.message,
      });
    }
  };
}

export function threeBoxLogout() {
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

export function updateProfile(accountAddress: string, name: string, description: string) {
  return async (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState): Promise<boolean> => {
    dispatch({
      type: ActionTypes.UPDATE_PROFILE,
      sequence: AsyncActionSequence.Pending,
      meta: { accountAddress },
    } as UpdateProfileAction);

    const state = _getState();
    let threeBox;

    try {
      if (state.profiles.threeBox) {
        threeBox = state.profiles.threeBox;
      } else {
        const web3Provider = await getWeb3Provider();
        threeBox = await Box.openBox(accountAddress, web3Provider);
      }
      await threeBox.syncDone;
      await threeBox.public.setMultiple(["name", "description"], [name, description]);
    } catch (e) {
      const errorMsg = e.message;

      // eslint-disable-next-line no-console
      console.error("Error saving profile to 3box: ", errorMsg);

      dispatch({
        type: ActionTypes.UPDATE_PROFILE,
        sequence: AsyncActionSequence.Failure,
        meta: { accountAddress },
      } as UpdateProfileAction);

      dispatch(showNotification(NotificationStatus.Failure, `Saving profile to 3box failed: ${errorMsg}`));
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

    dispatch(showNotification(NotificationStatus.Success, "Profile data saved to 3box"));
    return true;
  };
}

export type FollowItemAction = IAsyncAction<"FOLLOW_ITEM", { accountAddress: string }, { type: FollowType; id: string; isFollowing: boolean}>;

export function toggleFollow(accountAddress: string, type: FollowType, id: string) {
  return async (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState): Promise<boolean> => {
    const state = _getState();
    let threeBox;
    let threeBoxSpace;

    try {
      if (state.profiles.threeBox) {
        threeBox = state.profiles.threeBox;
      } else {
        const web3Provider = await getWeb3Provider();
        threeBox = await Box.openBox(accountAddress, web3Provider);
      }

      await threeBox.syncDone;

      if (state.profiles.threeBoxSpace) {
        threeBoxSpace = state.profiles.threeBoxSpace;
      } else {
        threeBoxSpace = await threeBox.openSpace("DAOstack");
      }
      await threeBoxSpace.syncDone;
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
      payload: { type, id, isFollowing, threeBox, threeBoxSpace },
    } as FollowItemAction);

    dispatch(showNotification(NotificationStatus.Success, (isFollowing ? "Now following" : "No longer following") + ` ${type.slice(0, -1)} ${id.slice(0, 8)}...`));
  };
}
