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
      if (action.payload.proposal.winningVote = VotesStatus.Yes) {
        // If the proposal passed then update the member of the dao
        // TODO: do this here or in the action?
        //       Could just load all DAO data from scratch again to get all updates
        const proposal = state.proposals[payload.proposal.proposalId];
        let member = state.daos[payload.daoAvatarAddress].members[proposal.beneficiary];

        if (member) {
          // Add reputation and token rewards to current counts
          member.tokens = member.tokens + proposal.rewardToken;
          member.reputation = member.reputation + proposal.rewardToken;
        } else {
          // Add new member to the DAO
          member = {
            address: proposal.beneficiary,
            reputation : proposal.rewardToken,
            tokens : proposal.rewardToken
          }
        }
        state = update(state, { daos: {
          [payload.daoAvatarAddress] : {
            members: { [proposal.beneficiary]: { $set : member } }
          }
        }});
      }

      // Merge in proposal and dao changes
      return update(state, {
        proposals: { [payload.proposal.proposalId]: { $merge : action.payload.proposal } },
        daos: { [payload.daoAvatarAddress]: { $merge: action.payload.dao } }
      });
    }
  }

  return state;
}

export default arcReducer;