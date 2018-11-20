import * as Web3 from "web3";
import { ApproveAction, ConnectAction } from "actions/web3Actions";
import { AsyncActionSequence } from "actions/async";

export enum ActionTypes {
  WEB3_CONNECT = "WEB3_CONNECT",
  WEB3_SET_ACCOUNT = "WEB3_SET_ACCOUNT",
  WEB3_ON_ETH_BALANCE_CHANGE = "WEB3_ON_ETH_BALANCE_CHANGE",
  WEB3_ON_EXTERNAL_TOKEN_BALANCE_CHANGE = "WEB3_ON_EXTERNAL_TOKEN_BALANCE_CHANGE",
  WEB3_ON_GEN_BALANCE_CHANGE = "WEB3_ON_GEN_BALANCE_CHANGE",
  WEB3_ON_GEN_STAKING_ALLOWANCE_CHANGE = "WEB3_ON_GEN_STAKING_ALLOWANCE_CHANGE",
  APPROVE_STAKING_GENS = "APPROVE_STAKING_GENS",
  UPDATE_PROFILE = "UPDATE_PROFILE",
  OTHER_ACTION = "__any_other_action_type__",
}

export enum ConnectionStatus {
  Pending = "pending",
  Connected = "connected",
  Failed = "failed",
}

export interface IWeb3State {
  accounts: string[];
  connectionStatus?: ConnectionStatus;
  currentAccountGenBalance: number;
  currentAccountGenStakingAllowance: number;
  currentAccountExternalTokenBalance: number;
  currentAccountEthBalance: number;
  ethAccountAddress: string | null;
  networkId: number;
}

export const initialState: IWeb3State = {
  accounts: [],
  connectionStatus: ConnectionStatus.Pending,
  currentAccountGenBalance: 0,
  currentAccountGenStakingAllowance: 0,
  currentAccountExternalTokenBalance: 0,
  currentAccountEthBalance: 0,
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

    case ActionTypes.WEB3_SET_ACCOUNT:
      return {...state, ...action.payload };

    case ActionTypes.WEB3_ON_ETH_BALANCE_CHANGE:
      return {...state, currentAccountEthBalance: action.payload };

    case ActionTypes.WEB3_ON_EXTERNAL_TOKEN_BALANCE_CHANGE:
      return {...state, currentAccountExternalTokenBalance: action.payload };

    case ActionTypes.WEB3_ON_GEN_BALANCE_CHANGE:
      return {...state, currentAccountGenBalance: action.payload };

    case ActionTypes.WEB3_ON_GEN_STAKING_ALLOWANCE_CHANGE:
      return {...state, currentAccountGenStakingAllowance: action.payload };

    case ActionTypes.APPROVE_STAKING_GENS: {
      return state;
    }

    default: {
      return state;
    }
  }
};

export default web3Reducer;
