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
  accounts: string[];
  connectionStatus?: ConnectionStatus;
  currentAccountGenBalance: number;
  ethAccountBalance: number;
  ethAccountAddress: string | null;
  networkId: number;
}

export const initialState: IWeb3State = {
  accounts: [],
  connectionStatus: ConnectionStatus.Pending,
  currentAccountGenBalance: 0,
  ethAccountBalance: 0,
  ethAccountAddress: null,
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
        default: {
          return state;
        }
      }
    }

    // case 'web3/RECEIVE_ACCOUNT':
    //   console.log('received account', action);
    //   return state;

    case ActionTypes.WEB3_CHANGE_ACCOUNT:
      return {...state, ...action.payload };

    case ActionTypes.WEB3_ON_ETH_BALANCE_CHANGE:
      return {...state, ethAccountBalance: action.payload };

    case ActionTypes.WEB3_ON_GEN_BALANCE_CHANGE:
      return {...state, currentAccountGenBalance: action.payload };

    default: {
      return state;
    }
  }
};

export default web3Reducer;
