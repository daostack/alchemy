import * as update from "immutability-helper";

import { AsyncActionSequence } from "actions/async";

export enum ActionTypes {
  GET_PROFILE_DATA = "GET_PROFILE_DATA",
  UPDATE_PROFILE = "UPDATE_PROFILE"
}

export type IProfileState = any;

export interface IProfilesState {
  [accountAddress: string]: IProfileState;
}

export function newProfile(ethereumAccountAddress: string): IProfileState {
  return {
    description: "",
    ethereumAccountAddress,
    name: "",
    socialURLs: {},
  };
}

const initialState: IProfilesState = {};

const profilesReducer = (state = initialState, action: any) => {
  const { payload } = action;

  switch (action.type) {

    case ActionTypes.UPDATE_PROFILE: {
      switch (action.sequence) {
        case AsyncActionSequence.Success:
          return update(state, { [action.meta.accountAddress]: (profile: any) => {
            return update(profile || newProfile(action.meta.accountAddress), { $merge: payload });
          }});
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
