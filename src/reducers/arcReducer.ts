import * as update from 'immutability-helper';

import * as ActionTypes from 'constants/arcConstants'

export interface IMemberState {
  address?: string
  tokens: number
  reputation: number
}

export enum ProposalStates {
  Closed = 0,
  Executed = 1,
  PreBoosted = 2,
  Boosted = 3,
  QuietEndingPeriod = 4
}

export enum VotesStatus {
  Yes = 1,
  No = 2
}

export interface IProposalState {
  beneficiary: string
  boostedAt: number
  description: string
  daoAvatarAddress: string
  state: ProposalStates
  proposalId: string
  rewardEth: number
  rewardReputation: number
  rewardToken: number
  stakesNo: number
  stakesYes: number
  submittedAt: number
  title: string
  totalStakes: number
  totalVotes: number
  totalVoters: number
  votesYes: number
  votesNo: number
  winningVote: VotesStatus
}

export interface IDaoState {
  avatarAddress: string,
  controllerAddress: string,
  members: { [key : string] : IMemberState },
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

    case ActionTypes.ARC_VOTE_FULFILLED: {
      // merge in member updates for the DAO
      state = update(state, { daos: {
        [payload.daoAvatarAddress] : {
          members: { $merge : payload.members }
        }
      }});

      // Merge in proposal and dao changes
      return update(state, {
        proposals: { [payload.proposal.proposalId]: { $merge : action.payload.proposal } },
        daos: { [payload.daoAvatarAddress]: { $merge: action.payload.dao } }
      });
    }

    case ActionTypes.ARC_STAKE_FULFILLED: {
      // Merge in proposal and dao changes
      return update(state, {
        proposals: { [payload.proposal.proposalId]: { $merge : action.payload.proposal } }
      });
    }
  }

  return state;
}

export default arcReducer;