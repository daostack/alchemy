import BN = require("bn.js");
import * as Web3 from "web3";

import { AsyncActionSequence } from "actions/async";
import { ApproveAction, ConnectAction } from "actions/web3Actions";

export enum ActionTypes {
  WEB3_CONNECT = "WEB3_CONNECT",
  WEB3_SET_ACCOUNT = "WEB3_SET_ACCOUNT",
  WEB3_ON_ETH_BALANCE_CHANGE = "WEB3_ON_ETH_BALANCE_CHANGE",
  WEB3_ON_EXTERNAL_TOKEN_BALANCE_CHANGE = "WEB3_ON_EXTERNAL_TOKEN_BALANCE_CHANGE",
  WEB3_ON_GEN_BALANCE_CHANGE = "WEB3_ON_GEN_BALANCE_CHANGE",
  WEB3_ON_GEN_STAKING_ALLOWANCE_CHANGE = "WEB3_ON_GEN_STAKING_ALLOWANCE_CHANGE",
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
  connectionStatus?: ConnectionStatus;
  currentAccountGenBalance: BN;
  currentAccountGenStakingAllowance: BN;
  currentAccountExternalTokenBalance: BN;
  currentAccountEthBalance: BN;
  ethAccountAddress: string | null;
  networkId: number;
}

export const initialState: IWeb3State = {
  accounts: [],
  connectionStatus: ConnectionStatus.Pending,
  currentAccountGenBalance: new BN(0),
  currentAccountGenStakingAllowance: new BN(0),
  currentAccountExternalTokenBalance: new BN(0),
  currentAccountEthBalance: new BN(0),
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
