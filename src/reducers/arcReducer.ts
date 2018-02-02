import * as update from 'immutability-helper';

import * as ActionTypes from 'constants/arcConstants'

export interface ICollaboratorState {
  address: string
  tokens: number
  reputation: number
}

export interface IProposalState {
  abstainVotes: number
  beneficiary: string
  description: string
  failed: boolean
  noVotes: number
  open: boolean
  daoAvatarAddress: string
  passed: boolean
  proposalId: string|number
  reputationReward: number
  tokenReward: number
  yesVotes: number
}

export interface IDaoState {
  avatarAddress: string,
  controllerAddress: string,
  members: ICollaboratorState[],
  name: string,
  rank: number,
  promotedAmount: number,
  proposals: { [key : string] : IProposalState },
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
  daoList: { [key : string] : IDaoState },
  genesisAddress: string,
  isCorrectChain: boolean,
  simpleICOAddress: string
 }

export const initialState : IArcState = {
  controllerAddress: null,
  controllerInstance: null,
  daoList: {},
  genesisAddress: null,
  isCorrectChain: false,
  simpleICOAddress: null
}

const arcReducer = (state = initialState, action: any) => {
  switch (action.type) {

    case ActionTypes.ARC_INITIALIZATION_PENDING: {
      return state;
    }

    case ActionTypes.ARC_INITIALIZATION_FULFILLED: {
      return {...state, ...action.payload };
    }

    case ActionTypes.ARC_INITIALIZATION_REJECTED: {
      return state;
    }

    case ActionTypes.ARC_GET_DAOS_PENDING: {
      return state;
    }

    case ActionTypes.ARC_GET_DAOS_FULFILLED: {
      return update(state , { daoList : { $set: action.payload } } )
    }

    case ActionTypes.ARC_GET_DAOS_REJECTED: {
      return state;
    }

    case ActionTypes.ARC_GET_DAO_PENDING: {
      return state;
    }

    case ActionTypes.ARC_GET_DAO_FULFILLED: {
      // Replace the DAO's state using immutability-helper
      return update(state , { daoList : { [action.payload.avatarAddress] : { $set: action.payload } } })
    }

    case ActionTypes.ARC_GET_DAO_REJECTED: {
      return state;
    }

    case ActionTypes.ARC_CREATE_DAO_PENDING: {
      return state;
    }

    case ActionTypes.ARC_CREATE_DAO_FULFILLED: {
      // Add the new DAO to the state using immutability-helper
      return update(state , { daoList : { [action.payload.avatarAddress] : { $set: action.payload } } })
    }

    case ActionTypes.ARC_CREATE_DAO_REJECTED: {
      return state;
    }

    case ActionTypes.ARC_CREATE_PROPOSITION_PENDING: {
      return state;
    }

    case ActionTypes.ARC_CREATE_PROPOSITION_FULFILLED: {
      // Add the new proposal to the DAO's state using immutability-helper
      return update(state , { daoList : { [action.payload.daoAvatarAddress] : { proposals: { [action.payload.proposalId] : { $set: action.payload } } } } })
    }

    case ActionTypes.ARC_CREATE_PROPOSITION_REJECTED: {
      return state;
    }

    case ActionTypes.ARC_VOTE_FULFILLED: {
      // Update the proposal state
      return update(state , { daoList : { [action.payload.daoAvatarAddress] : { proposals: { [action.payload.proposalId] : { $merge: action.payload } } } } })
    }

    case ActionTypes.ARC_VOTE_REJECTED: {
      return state;
    }

    default: {
      return state;
    }
  }
}

export default arcReducer;
