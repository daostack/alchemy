export enum ActionTypes {
  WEB3_CONNECT = "WEB3_CONNECT",
  WEB3_SET_ACCOUNT = "WEB3_SET_ACCOUNT",
  APPROVE_STAKING_GENS = "APPROVE_STAKING_GENS",
  OTHER_ACTION = "__any_other_action_type__",
}

export enum ConnectionStatus {
  Pending = "pending",
  Connected = "connected",
  Failed = "failed",
}

export interface IWeb3State {
  accounts: string[];
  connectionStatus: ConnectionStatus;
  currentAccountAddress: string | null;
  networkId: number;
}

export const initialState: IWeb3State = {
  accounts: [],
  connectionStatus: ConnectionStatus.Pending,
  currentAccountAddress: null,
  networkId: 0 // unknown network
};

const web3Reducer = (state = initialState, action: any) => {
  switch (action.type) {

    case ActionTypes.WEB3_SET_ACCOUNT:
      return {...state, ...action.payload };

    case ActionTypes.APPROVE_STAKING_GENS: {
      return state;
    }

    default: {
      return state;
    }
  }
};

export default web3Reducer;
