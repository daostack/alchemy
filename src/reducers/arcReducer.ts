import * as ActionTypes from "constants/arcConstants";
import * as update from "immutability-helper";

export enum ProposalStates {
  None = 0,
  Closed = 1,
  Executed = 2,
  PreBoosted = 3,
  Boosted = 4,
  QuietEndingPeriod = 5,
}

export enum TransactionStates {
  Unconfirmed = "unconfirmed",
  Confirmed = "confirmed",
  Failed = "failed",
}

export enum VoteOptions {
  Yes = 1,
  No = 2,
}

export interface IVoteState {
  avatarAddress: string;
  proposalId: string;
  reputation?: number;
  transactionState?: TransactionStates;
  vote: VoteOptions;
  voterAddress: string;
}

export interface IStakeState {
  avatarAddress: string;
  prediction: VoteOptions;
  proposalId: string;
  transactionState?: TransactionStates;
  stake: number;
  stakerAddress: string;
}

export interface IAccountState {
  address?: string;
  tokens: number;
  reputation: number;
  votes?: { [proposalId: string]: IVoteState };
  stakes?: { [proposalId: string]: IStakeState };
}

export interface IProposalState {
  beneficiary: string;
  boostedTime: number;
  boostedVotePeriodLimit: number;
  preBoostedVotePeriodLimit: number;
  contributionDescriptionHash: string;
  description: string;
  daoAvatarAddress: string;
  ethReward: number;
  executionTime: number;
  externalToken: string;
  externalTokenReward: number;
  nativeTokenReward: number;
  numberOfPeriods: number;
  periodLength: number;
  proposalId: string;
  proposer: string;
  reputationChange: number;
  reputationWhenExecuted?: number;
  stakesNo: number;
  stakesYes: number;
  state: ProposalStates;
  submittedTime: number;
  title: string;
  transactionState: TransactionStates;
  totalStakes: number;
  totalVotes: number;
  totalVoters: number;
  votesYes: number;
  votesNo: number;
  winningVote: VoteOptions;
}

export interface IDaoState {
  avatarAddress: string;
  controllerAddress: string;
  members: { [key: string]: IAccountState };
  name: string;
  rank: number;
  promotedAmount: number;
  proposals: Array<IProposalState | string>; // Either normalized (string) or denormalized (IProposalState)
  proposalsLoaded: boolean;
  reputationAddress: string;
  reputationCount: number;
  tokenAddress: string;
  tokenCount: number;
  tokenName: string;
  tokenSymbol: string;
}

export interface IArcState {
  daosLoaded: boolean;
  daos: { [key: string]: IDaoState };
  proposals: { [key: string]: IProposalState };
}

export const initialState: IArcState = {
  daosLoaded: false,
  daos: {},
  proposals: {},
};

const arcReducer = (state = initialState, action: any) => {
  const { payload } = action;

  // If there are normalized entities in the payload add to the state
  if (payload && payload.entities) {
    state = update(state, {
      daos : { $merge: payload.entities.daos || {} },
      proposals : { $merge : payload.entities.proposals || {} },
    });
  }

  switch (action.type) {
    case ActionTypes.ARC_LOAD_CACHED_STATE_FULFILLED: {
      return payload;
    }

    case ActionTypes.ARC_GET_DAOS_FULFILLED: {
      return update(state, { daosLoaded : { $set : true } });
    }

    case ActionTypes.ARC_CREATE_PROPOSAL_FULFILLED: {
      // Add the new proposal to the DAO's state
      return update(state , { daos : { [action.payload.daoAvatarAddress] : { proposals: { $push : [action.payload.result] } } } } );
    }

    case ActionTypes.ARC_GET_PROPOSAL_FULFILLED: {
      // Add the new proposal to the DAO's state if not already there
      if (state.daos[action.payload.daoAvatarAddress].proposals.indexOf(action.payload.result) === -1) {
        state = update(state , { daos : { [action.payload.daoAvatarAddress] : { proposals: { $push : [action.payload.result] } } } } );
      }

      // Add the current account's vote and stake on the proposal
      if (payload.vote) {
        state = update(state, { daos: {
          [payload.daoAvatarAddress] : {
            members: {
              [payload.vote.voterAddress]: {
                votes : { [payload.vote.proposalId] : { $set : payload.vote }},
              },
            },
          },
        }});
      }
      if (payload.stake) {
        state = update(state, { daos: {
          [payload.daoAvatarAddress] : {
            members: {
              [payload.vote.voterAddress]: {
                stakes: { [payload.vote.proposalId] : { $set : payload.stake }},
              },
            },
          },
        }});
      }

      return state;
    }

    case ActionTypes.ARC_VOTE_PENDING: {
      return update(state, { daos: {
        [payload.vote.avatarAddress] : {
          members: {
            [payload.vote.voterAddress]: {
              votes : { [payload.vote.proposalId] : { $set : payload.vote }},
            },
          },
        },
      }});
    }

    case ActionTypes.ARC_VOTE_FULFILLED: {
      // Update the account that voted
      state = update(state, { daos: {
        [payload.daoAvatarAddress] : {
          members: {
            [payload.vote.voterAddress]: {
              $merge : payload.voter,
              votes : { [payload.vote.proposalId] : { $set : payload.vote }},
            },
          },
        },
      }});

      // Merge in proposal and dao changes
      return update(state, {
        proposals: { [payload.proposal.proposalId]: { $merge : action.payload.proposal } },
        daos: { [payload.daoAvatarAddress]: { $merge: action.payload.dao } },
      });
    }

    case ActionTypes.ARC_STAKE_PENDING: {
      return update(state, { daos: {
        [payload.stake.avatarAddress] : {
          members: {
            [payload.stake.stakerAddress]: {
              stakes : { [payload.stake.proposalId] : { $set : payload.stake }},
            },
          },
        },
      }});
    }

    case ActionTypes.ARC_STAKE_REJECTED: {
      return update(state, { daos: {
        [payload.avatarAddress] : {
          members: {
            [payload.stakerAddress]: {
              stakes : { $unset : [payload.proposalId] },
            },
          },
        },
      }});
    }

    case ActionTypes.ARC_STAKE_FULFILLED: {
      // Update the account that staked
      state = update(state, { daos: {
        [payload.daoAvatarAddress] : {
          members: {
            [payload.stake.stakerAddress]: {
              stakes : { [payload.stake.proposalId] : { $set : payload.stake }},
            },
          },
        },
      }});

      // Merge in proposal
      return update(state, {
        proposals: { [payload.proposal.proposalId]: { $merge : action.payload.proposal } },
      });
    }
  }

  return state;
};

export default arcReducer;
