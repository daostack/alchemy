import * as update from "immutability-helper";
import { AsyncActionSequence } from "actions/async";

export enum ActionTypes {
  GET_PROFILE_DATA = "GET_PROFILE_DATA",
  UPDATE_PROFILE = "UPDATE_PROFILE",
  FOLLOW_ITEM = "FOLLOW_ITEM",
  SAVE_THREEBOX = "SAVE_THREEBOX",
}

export type FollowType = "daos" | "proposals" | "users";

export interface IFollowsCollections {
  daos: Array<string>,
  proposals: Array<string>,
  users: Array<string>,
}

export interface IProfileState {
  description: string;
  ethereumAccountAddress: string;
  follows: IFollowsCollections;
  image?: any;
  name: string;
  socialURLs: any;
}

export interface I3BoxState {
  threeBox?: any; // To store the opened 3box box so we dont have to wait to open it every time we want to update data in it
  threeBoxSpace?: any; // To store the opened 3box DAOstack space so we dont have to wait to open it every time we want to update data in it
}

export interface IProfilesState extends I3BoxState {
  [accountAddress: string]: IProfileState;
}

export interface IProfilesPayload {
  profiles: Record<string, IProfileState>;
}

export interface IFollowingPayload {
  type: FollowType;
  id: string;
  isFollowing: boolean;
}

export function newProfile(ethereumAccountAddress: string): IProfileState {
  return {
    description: "",
    ethereumAccountAddress, // assumed already cast to lowercase
    follows: {
      daos: [],
      proposals: [],
      users: [],
    },
    name: "",
    socialURLs: {},
  };
}

const profilesReducer = (
  state: IProfilesState = {},
  action: {
    payload: IFollowingPayload | I3BoxState | IProfilesPayload | IProfileState,
    meta: { accountAddress: string },
    type: ActionTypes,
    sequence: AsyncActionSequence
  }): IProfilesState | I3BoxState | IProfileState => {

  const { meta } = action;

  switch (action.type) {
    case ActionTypes.SAVE_THREEBOX: {
      const threeBoxPayload = action.payload as I3BoxState;
      let newState: I3BoxState;
      if (threeBoxPayload && threeBoxPayload.threeBox) {
        Object.assign(newState, update(state, { threeBox: { $set: threeBoxPayload.threeBox } }));
      }

      if (threeBoxPayload && threeBoxPayload.threeBoxSpace) {
        Object.assign(newState, update(newState, { threeBoxSpace: { $set: threeBoxPayload.threeBoxSpace } }));
      }

  switch (action.type) {
    case ActionTypes.SAVE_THREEBOX: {
      const threeBoxPayload = action.payload as I3BoxState;
      let newState: I3BoxState;
      if (threeBoxPayload && threeBoxPayload.threeBox) {
        Object.assign(newState, update(state, { threeBox: { $set: threeBoxPayload.threeBox } }));
      }

      if (threeBoxPayload && threeBoxPayload.threeBoxSpace) {
        Object.assign(newState, update(newState, { threeBoxSpace: { $set: threeBoxPayload.threeBoxSpace } }));
      }

      return newState;
    }

    case ActionTypes.UPDATE_PROFILE: {
      switch (action.sequence) {
        case AsyncActionSequence.Success: {
          const profilePayload = action.payload as IProfileState;
          const accountAddress = meta.accountAddress?.toLowerCase();
          return update(state, {
            [accountAddress]: (profile: any) => {
              return update(profile || newProfile(accountAddress), { $merge: profilePayload });
            },
          });
        }
        default: {
          return state;
        }
      }
    }

    case ActionTypes.FOLLOW_ITEM: {
      switch (action.sequence) {
        case AsyncActionSequence.Success: {
          const { type, id, isFollowing } = action.payload as IFollowingPayload;
          const profilesState = state as IProfilesState;
          const accountAddress = meta.accountAddress?.toLowerCase();

          if (!profilesState[accountAddress]) {
            state = update(state, { [accountAddress]: { $set: newProfile(accountAddress) } });
          }

          if (isFollowing && !profilesState[accountAddress].follows[type].includes(id)) {
            return update(state, { [accountAddress]: { follows: { [type]: { $push: [id] } } } });
          } else if (!isFollowing && profilesState[accountAddress].follows[type].includes(id)) {
            return update(state, { [accountAddress]: { follows: { [type]: (arr: string[]) => arr.filter((item) => item !== id) } } });
          }
          return state;
        }
        default: {
          return state;
        }
      }
    }

    case ActionTypes.GET_PROFILE_DATA: {
      switch (action.sequence) {
        case AsyncActionSequence.Success: {
          const profiles = (action.payload as IProfilesPayload).profiles;
          for (const address of Object.keys(profiles)) {
            state = update(state, { [address]: { $set: profiles[address] } });
          }
          return state;
        }
        case AsyncActionSequence.Failure: {
          // eslint-disable-next-line no-console
          console.error(`ERROR: ${state}`);
          return state;
        }
      }
    }
      break;

    default: {
      return state;
    }
  }
};

export default profilesReducer;
