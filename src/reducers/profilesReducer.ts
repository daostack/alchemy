import * as update from "immutability-helper";

import { AsyncActionSequence } from "actions/async";

export enum ActionTypes {
  GET_PROFILE_DATA = "GET_PROFILE_DATA",
  UPDATE_PROFILE = "UPDATE_PROFILE",
  FOLLOW_ITEM = "FOLLOW_ITEM",
  SAVE_THREEBOX = "SAVE_THREEBOX",
}

export type FollowType = "daos" | "proposals" | "users";

export type IProfileState = {
  description: string;
  ethereumAccountAddress: string;
  follows: {
    daos: string[];
    proposals: string[];
    plugins: string[];
    users: string[];
  };
  image?: any;
  name: string;
  socialURLs: any;
};

export interface IProfilesState {
  threeBox: any; // To store the opened 3box box so we dont have to wait to open it every time we want to update data in it
  threeBoxSpace: any; // To store the opened 3box DAOstack space so we dont have to wait to open it every time we want to update data in it
  [accountAddress: string]: IProfileState;
}

export function newProfile(ethereumAccountAddress: string): IProfileState {
  return {
    description: "",
    ethereumAccountAddress,
    follows: {
      daos: [],
      proposals: [],
      plugins: [],
      users: [],
    },
    name: "",
    socialURLs: {},
  };
}

const initialState: IProfilesState = { threeBox: null, threeBoxSpace: null };

//eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const profilesReducer = (state = initialState, action: any): IProfilesState => {
  const { payload, meta } = action;

  if (payload && Object.prototype.hasOwnProperty.call(payload, "threeBox")) {
    state = update(state, { threeBox: { $set: payload.threeBox } });
    delete payload.threeBox;
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, "threeBoxSpace")) {
    state = update(state, { threeBoxSpace: { $set: payload.threeBoxSpace } });
    delete payload.threeBoxSpace;
  }

  switch (action.type) {

    case ActionTypes.UPDATE_PROFILE: {
      switch (action.sequence) {
        case AsyncActionSequence.Success:
          return update(state, { [meta.accountAddress]: (profile: any) => {
            return update(profile || newProfile(meta.accountAddress), { $merge: payload });
          }});
        default: {
          return state;
        }
      }
    }

    case ActionTypes.FOLLOW_ITEM: {
      switch (action.sequence) {
        case AsyncActionSequence.Success: {
          const { type, id, isFollowing } = payload;

          if (!state[meta.accountAddress]) {
            state = update(state, { [meta.accountAddress]: { $set: newProfile(meta.accountAddress) }});
          }

          if (isFollowing && !state[meta.accountAddress].follows[type as FollowType].includes(id)) {
            return update(state, { [meta.accountAddress]: { follows: { [type]: { $push: [id] } }}});
          } else if (!isFollowing && state[meta.accountAddress].follows[type as FollowType].includes(id)) {
            return update(state, { [meta.accountAddress]: { follows: { [type]: (arr: string[]) => arr.filter((item) => item !== id) }}});
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
          const { profiles } = payload;

          for (const address of Object.keys(profiles)) {
            state = update(state, { [address]: { $set: profiles[address] } });
          }
          return state;
        }
        case AsyncActionSequence.Failure: {
          // eslint-disable-next-line no-console
          console.error(`ERROR: ${payload}`);
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
