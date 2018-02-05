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
  proposals: (IProposalState | string)[], // Either normalized (string) or denormalized (IProposalState)
  reputationAddress: string,
  reputationCount: number,
  tokenAddress: string,
  tokenCount: number
  tokenName: string,
  tokenSymbol: string
}

export interface IArcState {
  daos: { [key : string] : IDaoState },
  proposals: { [key : string] : IProposalState },
}

export const initialState : IArcState = {
  daos: {},
  proposals: {}
}

const arcReducer = (state = initialState, action: any) => {
  const { payload } = action;

  console.log("pre state = ", state, "payload = ", payload);
  // If there are normalized entities in the payload add to the state
  if (payload && payload.entities) {
    state = update(state, {
      daos : { $merge: payload.entities.daos || {} },
      proposals : { $merge : payload.entities.proposals || {} }
    });
  }
  console.log("post entities = ", state);

  switch (action.type) {
    case ActionTypes.ARC_CREATE_PROPOSAL_FULFILLED: {
      // Add the new proposal to the DAO's state
      return update(state , { daos : { [action.payload.daoAvatarAddress] : { proposals: { $push : [action.payload.result] } } } } );
    }
  }

  return state;
}

export default arcReducer;