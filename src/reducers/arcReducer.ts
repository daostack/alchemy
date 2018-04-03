import * as ActionTypes from "constants/arcConstants";
import * as update from "immutability-helper";
import { RedeemAction, StakeAction, VoteAction, CreateProposalAction } from "actions/arcActions";
import { AsyncActionSequence } from "actions/async";

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

export enum ContributionRewardType {
  Reputation = 0,
  NativeToken = 1,
  Eth = 2,
  ExternalToken = 3,
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

export interface IRedemptionState {
  accountAddress: string;
  beneficiaryEth: number;
  beneficiaryNativeToken: number;
  beneficiaryReputation: number;
  proposalId: string;
  proposerReputation: number;
  proposal?: IProposalState;
  stakerReputation: number;
  stakerTokens: number;
  transactionState?: TransactionStates;
  voterTokens: number;
  voterReputation: number;
}

export interface IAccountState {
  address?: string;
  redemptions: { [proposalId: string]: IRedemptionState };
  reputation: number;
  stakes?: { [proposalId: string]: IStakeState };
  tokens: number;
  votes?: { [proposalId: string]: IVoteState };
}

export const emptyAccount: IAccountState = {
  redemptions: {},
  reputation: 0,
  stakes: {},
  tokens: 0,
  votes: {}
}

export interface IProposalState {
  beneficiaryAddress: string;
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
  redeemedPeriods?: number[];
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

    case ActionTypes.ARC_CREATE_PROPOSAL: {
      const { meta, sequence, payload } = action as CreateProposalAction;
      const { avatarAddress } = meta;

      switch (sequence) {
        case AsyncActionSequence.Success:
          // Add the new proposal to the DAO's state
          return update(state , {
            daos : {
              [avatarAddress]: {
                proposals: {
                  $push : [action.payload.result]
                }
              }
            }
          });
        default:
          return state;
      }
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
              [payload.stake.stakerAddress]: {
                stakes: { [payload.stake.proposalId] : { $set : payload.stake }},
              },
            },
          },
        }});
      }
      if (payload.redemptions) {
        state = update(state, { daos: {
          [payload.daoAvatarAddress] : {
            members: {
              [payload.redemptions.accountAddress]: {
                redemptions: { [payload.redemptions.proposalId] : { $set : payload.redemptions }},
              },
            },
          },
        }});
      }

      return state;
    }

    case ActionTypes.ARC_VOTE: {
      const { meta, sequence, payload } = action as VoteAction;
      const { avatarAddress, proposalId, vote, voterAddress } = meta;

      switch (sequence) {
        case AsyncActionSequence.Pending:
          return update(state, { daos: {
            [avatarAddress] : {
              members: {
                [voterAddress]: {
                  votes : { [proposalId] : { $set : {
                    ...meta,
                    transactionState: TransactionStates.Unconfirmed
                  } }},
                },
              },
            },
          }});
        case AsyncActionSequence.Success: {
          // Update the account that voted
          state = update(state, { daos: {
            [avatarAddress] : {
              members: {
                [voterAddress]: {
                  $merge : payload.voter,
                  votes : { [proposalId] : { $set : payload.vote }},
                },
              },
            },
          }});

          // Add redemptions if the proposal passed
          if (payload.redemptions) {
            state = update(state, { daos: {
              [avatarAddress] : {
                members: {
                  [voterAddress]: {
                    redemptions: { [proposalId] : { $set : payload.redemptions }},
                  },
                },
              },
            }});
          }

          // Merge in proposal and dao changes
          return update(state, {
            proposals: { [proposalId]: { $merge : payload.proposal } },
            daos: { [avatarAddress]: { $merge: payload.dao } },
          });
        }
      }
    } // EO ARC_VOTE

    case ActionTypes.ARC_STAKE: {
      const { meta, sequence, payload } = action as StakeAction;
      const { avatarAddress, stakerAddress, proposalId, prediction, stake } = meta;

      switch (sequence) {
        case AsyncActionSequence.Pending:
          return update(state, { daos: {
            [avatarAddress] : {
              members: {
                [stakerAddress]: {
                  stakes : { [proposalId] : { $set : {
                    ...meta,
                    transactionState: TransactionStates.Unconfirmed
                  } }},
                },
              },
            },
          }});
        case AsyncActionSequence.Failure:
          return update(state, { daos: {
            [avatarAddress] : {
              members: {
                [stakerAddress]: {
                  stakes : { $unset : [proposalId] },
                },
              },
            },
          }});
        case AsyncActionSequence.Success: {
          // Update the account that staked
          state = update(state, { daos: {
            [avatarAddress] : {
              members: {
                [stakerAddress]: {
                  stakes : { [proposalId] : { $set : payload.stake }},
                },
              },
            },
          }});

          // Merge in proposal
          return update(state, {
            proposals: { [proposalId]: { $merge : action.payload.proposal } },
          });
        }
      }
    } // EO ARC_STAKE

    case ActionTypes.ARC_REDEEM: {
      const { meta, sequence, payload } = action as RedeemAction;
      const { avatarAddress, accountAddress, proposalId } = meta;

      switch (sequence) {
        case AsyncActionSequence.Pending:
          return update(state, { daos: {
            [avatarAddress] : {
              members: {
                [accountAddress]: {
                  redemptions : { [proposalId] : { $set : {
                    ...meta,
                    transactionState: TransactionStates.Unconfirmed
                  } }},
                },
              },
            },
          }});
        case AsyncActionSequence.Failure:
          return update(state, { daos: {
            [avatarAddress] : {
              members: {
                [accountAddress]: {
                  redemptions : { $unset : [proposalId] },
                },
              },
            },
          }});
        case AsyncActionSequence.Success: {
          state = update(state, { daos: {
            [avatarAddress] : {
              members: {
                [accountAddress]: {
                  $merge : payload.beneficiary,
                  // remove pending redemptions from this account
                  redemptions : { $unset: [payload.proposalId] },
                },
              },
            },
          }});

          // Merge in dao changes
          return update(state, {
            daos: { [payload.dao.avatarAddress]: { $merge: action.payload.dao } },
          });
        }
      }
    } // EO ARC_REDEEM

  }

  return state;
};

export default arcReducer;
