import { ActionTypes } from "constants/web3Constants";
import * as Web3 from "web3";

export enum ConnectionStatus {
  Pending = "pending",
  Connected = "connected",
  Failed = "failed",
}

export interface IWeb3State {
  ethAccountBalance: string;
  ethAccountAddress: string | null;
  connectionStatus?: ConnectionStatus;
}

export const initialState: IWeb3State = {
  ethAccountBalance: "",
  ethAccountAddress: null,
  connectionStatus: ConnectionStatus.Pending,
};

// TODO: make all action types explicit?
const web3Reducer = (state = initialState, action: any) => {
  switch (action.type) {

    case ActionTypes.WEB3_CONNECTION_REJECTED: {
      return {...state, ...action.payload, ...{ connectionStatus : ConnectionStatus.Failed } };
    }

    case ActionTypes.WEB3_CONNECTED: {
      return {...state, ...action.payload, ...{ connectionStatus : ConnectionStatus.Connected } };
    }

    // case 'web3/RECEIVE_ACCOUNT':
    //   console.log('received account', action);
    //   return state;

    case ActionTypes.WEB3_CHANGE_ACCOUNT:
      return {...state, ...action.payload };

    default: {
      return state;
    }
  }
};

export default web3Reducer;
