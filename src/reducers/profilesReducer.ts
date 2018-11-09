import * as update from "immutability-helper";

import { AsyncActionSequence } from "actions/async";

export enum ActionTypes {
  GET_PROFILE_DATA = "GET_PROFILE_DATA",
  UPDATE_PROFILE = "UPDATE_PROFILE"
}

export interface IProfileState {
  ethereumAccountAddress?: string;
  description: string;
  githubURL: string;
  name: string;
}

export interface IProfilesState {
  [accountAddress: string]: IProfileState
};

export function newProfile(ethereumAccountAddress: string): IProfileState {
  return {
    ethereumAccountAddress,
    name: "",
    description: "",
    githubURL: ""
  };
}

export const initialState: IProfilesState = {};

const profilesReducer = (state = initialState, action: any) => {
  const { payload } = action;

  switch (action.type) {

    case ActionTypes.UPDATE_PROFILE: {
      switch (action.sequence) {
        case AsyncActionSequence.Success:
          return {...state, ...payload };
        default: {
          return state;
        }
      }
    }

   case ActionTypes.GET_PROFILE_DATA: {
      const { profiles } = payload;

      for (const profile of profiles) {
        state = update(state, { [profile.ethereumAccountAddress]: { $set: profile } });
      }

      return state;
    }

    default: {
      return state;
    }
  }
};

export default profilesReducer;
