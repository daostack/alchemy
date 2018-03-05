//import * as update from 'immutability-helper';

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

export enum TransactionStates {
  Unconfirmed = "unconfirmed",
  Confirmed = "confirmed",
  Failed = "failed"
}

export enum VoteOptions {
  Yes = 1,
  No = 2
}

export interface IProposalState {
  beneficiary: string
  boostedTime: number
  contributionDescriptionHash: string
  description: string
  daoAvatarAddress: string
  ethReward: number
  executionTime: number,
  externalToken: string,
  externalTokenReward: number
  nativeTokenReward: number
  numberOfPeriods: number,
  periodLength: number,
  proposalId: string
  proposer: string
  reputationChange: number
  stakesNo: number
  stakesYes: number
  state: ProposalStates
  submittedTime: number
  title: string
  transactionState: TransactionStates
  totalStakes: number
  totalVotes: number
  totalVoters: number
  votesYes: number
  votesNo: number
  winningVote: VoteOptions
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
    state = {
      ...state,
      daos: {
        ...state.daos,
        ...(payload.entities.daos || {})
      },
      proposals: {
        ...state.proposals,
        ...(payload.entities.proposals)
      }
    }
  }

  switch (action.type) {
    case ActionTypes.ARC_GET_PROPOSAL_FULFILLED:
    case ActionTypes.ARC_CREATE_PROPOSAL_FULFILLED: {
      // Add the new proposal to the DAO's state
      return {
        ...state,
        daos: {
          ...state.daos,
          [action.payload.daoAvatarAddress]: {
            ...state.daos[action.payload.daoAvatarAddress],
            proposals: [
              ...state.daos[action.payload.daoAvatarAddress].proposals,
              action.payload.result
            ]
          }
        }
      }
    }

    case ActionTypes.ARC_VOTE_FULFILLED: {
      // merge in member updates for the DAO
      state = {
        ...state,
        daos: {
          ...state.daos,
          [payload.daoAvatarAddress]: {
            ...state.daos[payload.daoAvatarAddress],
            members: {
              ...state.daos[payload.daoAvatarAddress].members,
              ...payload.members
            }
          }
        }
      }


      // Merge in proposal and dao changes
      return {
        ...state,
        proposals: {
          ...state.proposals,
          [payload.proposal.proposalId]: {
            ...state.proposals[payload.proposal.proposalId],
            ...action.payload.proposal
          }
        },
        daos: {
          ...state.daos,
          [payload.daoAvatarAddress]: {
            ...state.daos[payload.daoAvatarAddress],
            ...action.payload.dao
          }
        }
      }
    }

    case ActionTypes.ARC_STAKE_FULFILLED: {
      // Merge in proposal and dao changes
      return {
        ...state,
        proposals: {
          ...state.proposals,
          [payload.proposal.proposalId]: {
            ...state.proposals[payload.proposal.proposalId],
            ...action.payload.proposal
          }
        }
      }
    }
  }

  return state;
}

export default arcReducer;
