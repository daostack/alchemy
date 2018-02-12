import * as update from 'immutability-helper';

import * as ActionTypes from 'constants/arcConstants'

export interface ICollaboratorState {
  address: string
  tokens: number
  reputation: number
}

export enum ProposalStates {
  Closed = "Closed",
  Executed = "Executed",
  NotBoosted = "NotBoosted",
  Boosted = "Boosted"
}

export interface IProposalState {
  beneficiary: string
  boostedAt: number
  description: string
  daoAvatarAddress: string
  state: ProposalStates
  predictionsFail: number
  predictionsPass: number
  proposalId: string|number
  rewardEth: number
  rewardReputation: number
  rewardToken: number
  submittedAt: number
  votesYes: number
  votesNo: number
  winningVote: number // 1 = YES, 2 = NO
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

  // If there are normalized entities in the payload add to the state
  if (payload && payload.entities) {
    state = update(state, {
      daos : { $merge: payload.entities.daos || {} },
      proposals : { $merge : payload.entities.proposals || {} }
    });
  }

  switch (action.type) {
    case ActionTypes.ARC_CREATE_PROPOSAL_FULFILLED: {
      // Add the new proposal to the DAO's state
      return update(state , { daos : { [action.payload.daoAvatarAddress] : { proposals: { $push : [action.payload.result] } } } } );
    }
  }

  return state;
}

export default arcReducer;