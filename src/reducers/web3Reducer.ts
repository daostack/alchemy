import { ActionTypes } from 'constants/web3Constants';
import * as Web3 from 'web3';

export interface IWeb3State {
  ethAccountBalance: string,
  ethAccountAddress: string,
  hasProvider: boolean,
  isConnected: boolean
}

export const initialState : IWeb3State = {
  ethAccountBalance: "",
  ethAccountAddress: null,
  hasProvider: false,
  isConnected: false
}

// TODO: make all action types explicit?
const web3Reducer = (state = initialState, action: any) => {
  switch (action.type) {

    case ActionTypes.WEB3_CONNECTED: {
      return {...state, ...action.payload };
    }

    // case 'web3/RECEIVE_ACCOUNT':
    //   console.log('received account', action);
    //   return state;

    case ActionTypes.WEB3_CHANGE_ACCOUNT:
      return {...state, ...action.payload }

    default: {
      return state;
    }
  }
}

export default web3Reducer;
