export enum ActionTypes {
  WEB3_SET_ACCOUNT = "WEB3_SET_ACCOUNT",
  OTHER_ACTION = "__any_other_action_type__",
}

export interface IWeb3State {
  accounts: string[];
  currentAccountAddress: string | null;
  networkId: number;
}

const initialState: IWeb3State = {
  accounts: [],
  currentAccountAddress: null,
  networkId: 0, // unknown network
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const web3Reducer = (state = initialState, action: any): any => {
  switch (action.type) {

    case ActionTypes.WEB3_SET_ACCOUNT:
      return {...state, ...action.payload };

    default: {
      return state;
    }
  }
};

export default web3Reducer;
