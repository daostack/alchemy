export enum ActionTypes {
  WEB3_SET_ACCOUNT = "WEB3_SET_ACCOUNT",
  OTHER_ACTION = "__any_other_action_type__",
}

export interface IWeb3State {
  accounts: string[];
  currentAccountAddress: string | null;
  networkName: string;
}

const initialState: IWeb3State = {
  accounts: [],
  currentAccountAddress: null,
  networkName: "", // unknown network
};

const web3Reducer = (state = initialState, action: any) => {
  switch (action.type) {

    case ActionTypes.WEB3_SET_ACCOUNT:
      return {...state, ...action.payload };

    default: {
      return state;
    }
  }
};

export default web3Reducer;
