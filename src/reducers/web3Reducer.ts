import * as ActionTypes from 'actions/web3Actions'
import * as Web3 from 'web3';

export interface IWeb3State {
  ethAccountBalance: string,
  ethAccountAddress: string,
  hasProvider: boolean,
  isConnected: boolean,
  instance: Web3,
}

export const initialState : IWeb3State = {
  ethAccountBalance: "",
  ethAccountAddress: null,
  hasProvider: false,
  isConnected: false,
  instance: null,
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

    // case 'web3/CHANGE_ACCOUNT':
    //   console.log('account changed', action);
    //   return state;

    default: {
      return state;
    }
  }
}

export default web3Reducer;
