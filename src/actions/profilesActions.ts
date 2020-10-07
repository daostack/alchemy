import Box = require("3box");
import { AsyncActionSequence, IAsyncAction } from "actions/async";
import { getWeb3Provider } from "arc";
import Analytics from "lib/analytics";
import * as Redux from "redux";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { ActionTypes, FollowType, newProfile, IFollowingPayload, IProfilesState, I3BoxThread, IProfileState, I3BoxThreadPost } from "reducers/profilesReducer";
import { arrayRemove } from "lib/util";
import { Address } from "@daostack/arc.js";
import { IRootState } from "reducers";
import i18next from "i18next";
import moment = require("moment");
import { THREEBOXTHREADSMODERATOR } from "../settings";
import { Resolver } from "did-resolver";
import { getResolver } from "3id-resolver";

interface IThreeBoxInfo {
  threeBox: any;
  threeBoxSpace: any;
}

const spaceName = "DAOstack";
let unauthorizedBox: typeof Box;
let didResolver: any;
let initPromise: Promise<void>;

async function assert3Box(): Promise<void> {
  if (initPromise) {
    return initPromise;
  } else {
    return initPromise = new Promise((resolve) => {
      console.log("create");
      return Box.create().then((box: typeof Box) => {
        console.log("getIPFS");
        return Box.getIPFS().then((ipfs: any) => {
          const threeboxDidResolver = getResolver(ipfs);
          didResolver = new Resolver(threeboxDidResolver);
          unauthorizedBox = box;
          resolve();
        });
      });
    });
  }
}
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
  let authorizedBox;
  let space;
  let updateState = false;

  if (!accountAddress) {
    throw new Error("get3Box: accountAddress is not set");
  }

  if (state.profiles.threeBox) {
    authorizedBox = state.profiles.threeBox;
  } else {
    const web3Provider = getWeb3Provider();
    if (!web3Provider) {
      throw new Error("get3Box: web3Provider is not set");
    }

    await assert3Box();
    console.log("auth");
    await unauthorizedBox.auth([], { address: accountAddress, provider: web3Provider });
    await unauthorizedBox.syncDone;
    /**
     * A bit silly as this is the same box, authorized or not. But we will only store
     * it in the redux state once it is authorized.
     */
    authorizedBox = unauthorizedBox;
    updateState = true;
  }
  /**
   * this ensures that a space for the account exists
   */
  if (withSpace) {
    if (state.profiles.threeBoxSpace) {
      space = state.profiles.threeBoxSpace;
    } else {
      /**
       * It is assumed here that the 3box admin space has already been created
       */
      space = await authorizedBox.openSpace(spaceName);
      await space.syncDone;
      updateState = true;
    }
  }

  const result = {
    threeBox: authorizedBox,
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

async function addressForDid(did: string): Promise<Address> {
  const doc = await didResolver.resolve(did);
  return doc.publicKey[2].ethereumAddress.toLowerCase();
}

/**
 * get thread without joining
 * @param threadName
 */
export async function getThread(threadName?: string): Promise<I3BoxThread> {
  try {
    await assert3Box();
    console.info("getting thread");
    return unauthorizedBox.openThread(spaceName, threadName, {firstModerator: THREEBOXTHREADSMODERATOR, members: false});
  }
  catch (ex) {
    // eslint-disable-next-line no-console
    console.error(`error getting 3box thread: ${ex}`);
    return null;
  }
}

/**
 * Get the thread posts
 * @param thread
 */
export async function getPosts(thread?: I3BoxThread): Promise<Array<I3BoxThreadPost>> {
  try {
    await assert3Box();
    console.info("getting posts");
    const posts = (await thread.getPosts()) as Array<I3BoxThreadPost>;

    for (const post of posts) {
      post.createDate = moment.unix(post.timestamp);
      post.author = await addressForDid(post.author);
    }
    return posts;
  }
  catch (ex) {
    // eslint-disable-next-line no-console
    console.error(`error retrieving 3box posts: ${ex}`);
    return null;
  }
}

/**
 * Join the thread given by threadName to enable posting and watching
 * for updates.
 * Must've called threeboxLogin or get3Box
 * @param accountAddress
 * @param threadName
 * @param profilesState
 */
export async function joinThread(
  threadName: string,
  accountAddress: Address,
  profilesState: IProfilesState): Promise<I3BoxThread | null> {

  if (!profilesState.threeBoxSpace) {
    // eslint-disable-next-line no-console
    console.error("Unable to join the thread: no space");
    return null;
  }

  const profileState = profilesState[accountAddress];

  if (!profileState) {
    // eslint-disable-next-line no-console
    console.error("Unable to join the thread: no 3box profile");
    return null;
  }

  if (!profileState.joinedThreads) {
    profileState.joinedThreads = {};
  }
  else if (profileState.joinedThreads[threadName]) {
    console.info(`already joined thread ${profileState.joinedThreads[threadName]}`);
    return profileState.joinedThreads[threadName];
  }
  console.info("joining thread");
  /**
     * this will create the thread if it doesn't already exist.
     */
  const thread = await profilesState.threeBoxSpace.joinThread(threadName, {
    firstModerator: THREEBOXTHREADSMODERATOR,
    members: false,
  });

  profileState.joinedThreads[threadName] = thread;

  console.info(`joined thread ${profileState.joinedThreads[threadName]}`);

  return thread;
}

/**
 * call thread.getPosts when you receive the callback
 * @param thread
 */
export function subcribeToThread(thread: I3BoxThread, handler: () => void): void {
  thread.onUpdate(handler);
}

export async function addPost(thread: I3BoxThread, message: string): Promise<void> {
  try {
    console.info(`posting message ${message}`);
    thread.post(message);
  }
  catch (ex) {
    // eslint-disable-next-line no-console
    console.error(`error posting 3box comment: ${ex}`);
  }
}

async function _getProfile(
  accountAddress: string,
  currentAccount = false,
  dispatch?: Redux.Dispatch<any, any>): Promise<IProfileState> {
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

        profile.joinedThreads = {};

        if (currentAccount) {
          // If getting profile for the current account then update our analytics services with the profile data
          Analytics.people.set({
            Name: profile.name,
            Description: profile.description,
          });
        }

        if (dispatch) {
          dispatch({
            type: ActionTypes.GET_PROFILE_DATA,
            sequence: AsyncActionSequence.Success,
            payload: { profiles: { [accountAddress]: profile } },
          });
        }
      } else {
        if (dispatch) {
          // Setup blank profile for the account
          dispatch({
            type: ActionTypes.GET_PROFILE_DATA,
            sequence: AsyncActionSequence.Success,
            payload: { profiles: { [accountAddress]: newProfile(accountAddress) } },
          });
        }
      }
      return profile;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error getting profile from 3box", e);
      if (dispatch) {
        dispatch({
          type: ActionTypes.GET_PROFILE_DATA,
          sequence: AsyncActionSequence.Failure,
          payload: e.message,
        });
      }
      return null;
    }
  }
}
/**
 * @param accountAddress
 * @param currentAccount
 */
export function getProfile(accountAddress: string, currentAccount = false):
(dispatch: Redux.Dispatch<any, any>, getState: () => IRootState) => Promise<void> {

  return async (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState): Promise<void> => {
    _getProfile(accountAddress, currentAccount, dispatch);
  };
}

/**
 * `addresses` can be a set of all addresses or all dids.  In any case,
 * the profile will be cached by address.
 *
 * @param addresses
 */
export function getProfilesForAddresses(addresses: string[]) {
  return async (dispatch: Redux.Dispatch<any, any>, getState: () => IRootState): Promise<void> => {
    if (!addresses?.length) {
      return null;
    }
    await assert3Box();
    try {
      const state = getState();
      /**
       * Would be better if we could use `Box.getProfiles`, but it is busted
       * See: https://github.com/3box/3box-js/issues/649
       * const results = await Box.getProfiles(addresses);
       */
      const isDids = addresses[0].startsWith("did:");
      const newProfiles: IProfilesState = {};

      for (let address of addresses) {
        if (isDids) {
          address = await addressForDid(address);
        }
        if (!state.profiles[address]) {
          /**
           * intentionally not awaiting this because it takes too long when there are a lot of profiles to download
           * but they show up pretty quickly when not running serially.
           */
          const profile = await _getProfile(address, false);
          if (profile) {
            newProfiles[profile.ethereumAccountAddress] = profile;
          }
        }
      }

      dispatch({
        type: ActionTypes.GET_PROFILE_DATA,
        sequence: AsyncActionSequence.Success,
        payload: { profiles: newProfiles },
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

export function threeboxLogin(accountAddress: string): (dispatch: any, getState: any) => Promise<boolean> {
  return async (dispatch: Redux.Dispatch<any, any>, getState: () => IRootState): Promise<boolean> => {
    const state = getState();

    try {
      if (state.profiles.threeBox && state.profiles.threeBoxSpace) {
        return true;
      } else {
        await get3Box(accountAddress, dispatch, state, true);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error logging in to 3box: ", e);

      dispatch(showNotification(NotificationStatus.Failure, `Logging in to 3box failed: ${e?.message ?? "unknown error"}`));
      return false;
    }

    dispatch(showNotification(NotificationStatus.Success, i18next.t("3BoxLoginSuccess")));
    return true;
  };
}

export function threeBoxLogout(): (dispatch: any, getState: any) => Promise<void> {
  return async (dispatch: Redux.Dispatch<any, any>, getState: () => IRootState): Promise<void> => {
    const state = getState();
    if (state.profiles.threeBox) {
      // eslint-disable-next-line no-console
      console.info("logging out of 3Box");
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

export function updateProfile(accountAddress: string, name: string, description: string): (dispatch: any, getState: any) => Promise<boolean> {
  return async (dispatch: Redux.Dispatch<any, any>, getState: () => IRootState): Promise<boolean> => {
    dispatch({
      type: ActionTypes.UPDATE_PROFILE,
      sequence: AsyncActionSequence.Pending,
      meta: { accountAddress },
    } as UpdateProfileAction);

    let threeBox;

    try {
      threeBox = (await get3Box(accountAddress, dispatch, getState())).threeBox;
      await threeBox.public.setMultiple(["name", "description"], [name, description]);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error saving profile to 3box: ", e);

      dispatch({
        type: ActionTypes.UPDATE_PROFILE,
        sequence: AsyncActionSequence.Failure,
        meta: { accountAddress },
      } as UpdateProfileAction);

      dispatch(showNotification(NotificationStatus.Failure, `Saving profile to 3box failed: ${e?.message ?? "unknown error"}`));
      return false;
    }

    dispatch({
      type: ActionTypes.UPDATE_PROFILE,
      sequence: AsyncActionSequence.Success,
      meta: { accountAddress },
      payload: { name, description },
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
  return async (dispatch: Redux.Dispatch<any, any>, getState: () => IRootState): Promise<boolean> => {
    let threeBoxSpace;
    let isFollowing = true;

    try {
      threeBoxSpace = (await get3Box(accountAddress, dispatch, getState(), true)).threeBoxSpace;

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

    } catch (e) {
      console.error("Error (un)following: ", e);
      dispatch(showNotification(NotificationStatus.Failure, `Failed to (un)follow: ${e?.message ?? "unknown error"}`));
      return false;
    }

    dispatch(showNotification(NotificationStatus.Success, i18next.t((isFollowing ? "Following" : "UnFollowing")) + ` ${type.slice(0, -1)} ${id.slice(0, 8)}...`));
    return true;
  };
}
