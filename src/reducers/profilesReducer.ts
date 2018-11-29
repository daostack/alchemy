import * as update from "immutability-helper";

import { AsyncActionSequence } from "actions/async";

export enum ActionTypes {
  GET_PROFILE_DATA = "GET_PROFILE_DATA",
  UPDATE_PROFILE = "UPDATE_PROFILE"
}

export interface IProfileState {
  description: string;
  ethereumAccountAddress?: string;
  name: string;
  socialURLs: { [provider : string] : string };
}

export interface IProfilesState {
  [accountAddress: string]: IProfileState
};

export function newProfile(ethereumAccountAddress: string): IProfileState {
  return {
    description: "",
    ethereumAccountAddress,
    name: "",
    socialURLs: {}
  };
}

export function profileDbToRedux(dbProfile: any) {
  const reduxProfile = dbProfile;
  if (!dbProfile.socialURLs) {
    reduxProfile.socialURLs = {};
  }
  if (dbProfile.facebookURL) {
    reduxProfile.socialURLs['facebook'] = dbProfile.facebookURL;
  }
  if (dbProfile.githubURL) {
    reduxProfile.socialURLs['github'] = dbProfile.githubURL;
  }
  if (dbProfile.twitterURL) {
    reduxProfile.socialURLs['twitter'] = dbProfile.twitterURL;
  }
  return reduxProfile;
}

export const initialState: IProfilesState = {};

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
      const { profiles } = payload;

      for (const profile of profiles) {
        state = update(state, { [profile.ethereumAccountAddress]: { $set: profileDbToRedux(profile) } });
      }

      return state;
    }

    default: {
      return state;
    }
  }
};

export default profilesReducer;
