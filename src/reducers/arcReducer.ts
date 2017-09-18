import * as ActionTypes from 'constants/arcConstants'

export interface IDaoState {
  avatarAddress: string,
  controllerAddress: string,
  name: string,
  members: number,
  rank: number,
  promotedAmount: number,
  reputationAddress: string,
  reputationCount: number,
  tokenAddress: string,
  tokenCount: number
  tokenName: string,
  tokenSymbol: string
 }

export interface IArcState {
  controllerAddress: string,
  controllerInstance: any
  daoList: IDaoState[],
  genesisAddress: string,
  isCorrectChain: boolean,
  simpleICOAddress: string
 }

export const initialState : IArcState = {
  controllerAddress: null,
  controllerInstance: null,
  daoList: [],
  genesisAddress: null,
  isCorrectChain: false,
  simpleICOAddress: null
}

const arcReducer = (state = initialState, action: any) => {
  switch (action.type) {

    case ActionTypes.ARC_INITIALIZATION_PENDING: {
      console.log("arc init pending", action);
      return state;
    }

    case ActionTypes.ARC_INITIALIZATION_FULFILLED: {
      console.log("arc init fulfilled", action);
      return {...state, ...action.payload };
    }

    case ActionTypes.ARC_INITIALIZATION_REJECTED: {
      console.log("arc init rejected", action);
      return state;
    }

    case ActionTypes.ARC_GET_DAOS_PENDING: {
      console.log("arc get daos pending", action);
      return state;
    }

    case ActionTypes.ARC_GET_DAOS_FULFILLED: {
      console.log("arc get daos fulfilled", action);
      return {...state, daoList: action.payload };
    }

    case ActionTypes.ARC_GET_DAOS_REJECTED: {
      console.log("arc get daos rejected", action);
      return state;
    }

    default: {
      return state;
    }
  }
}

export default arcReducer;
