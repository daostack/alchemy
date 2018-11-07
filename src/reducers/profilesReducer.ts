import * as update from "immutability-helper";

import { AsyncActionSequence } from "actions/async";

export enum ActionTypes {
  GET_PROFILE_DATA = "GET_PROFILE_DATA",
  UPDATE_PROFILE = "UPDATE_PROFILE"
}

export interface IProfileState {
  name: string;
  description: string;
  githubURL: string;
}

export interface IProfilesState {
  [accountAddress: string]: IProfileState
};

export const initialState: IProfilesState = {};

const profilesReducer = (state = initialState, action: any) => {
  const { payload } = action;

  switch (action.type) {

    case ActionTypes.UPDATE_PROFILE: {
      console.log("yoyo profile", payload);
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
      console.log("updates1 = ", profiles);

      for (const profile of profiles) {
        //const accountKey = account.ethereumAccountAddress + "-" + avatarAddress;
        console.log("got ", profile);
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
