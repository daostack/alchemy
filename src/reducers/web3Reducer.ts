export enum ActionTypes {
  WEB3_SET_ACCOUNT = "WEB3_SET_ACCOUNT",
}

export interface IWeb3State {
  currentAccountAddress: string | null;
}

const initialState: IWeb3State = {
  currentAccountAddress: null,
};

const web3Reducer = (state = initialState, action: { type: ActionTypes, payload: { currentAccountAddress: string } }): IWeb3State => {
  switch (action.type) {

    case ActionTypes.WEB3_SET_ACCOUNT:
      return {...state, ...action.payload };

    default: {
      return state;
    }
  }
};

export default web3Reducer;
