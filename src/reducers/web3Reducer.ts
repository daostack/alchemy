import { ActionTypes } from "constants/web3Constants";
import * as Web3 from "web3";
import { ConnectAction } from "actions/web3Actions";
import { AsyncActionSequence } from "actions/async";

export enum ConnectionStatus {
  Pending = "pending",
  Connected = "connected",
  Failed = "failed",
}

export interface IWeb3State {
  ethAccountBalance: number;
  ethAccountAddress: string | null;
  connectionStatus?: ConnectionStatus;
  networkId: number;
}

export const initialState: IWeb3State = {
  ethAccountBalance: 0,
  ethAccountAddress: null,
  connectionStatus: ConnectionStatus.Pending,
  networkId: 0 // unknown network
};

// TODO: make all action types explicit?
const web3Reducer = (state = initialState, action: any) => {
  switch (action.type) {

    case ActionTypes.WEB3_CONNECT: {
      const {sequence, payload, meta} = action as ConnectAction;

      switch (sequence) {
        case AsyncActionSequence.Failure:
          return {
            ...state,
            ...payload,
            ...{
              connectionStatus : ConnectionStatus.Failed
            }
          };
        case AsyncActionSequence.Success:
        return {
          ...state,
          ...payload,
          ...{
            connectionStatus : ConnectionStatus.Connected
          }
        };
      }
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
