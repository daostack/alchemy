import { ExecutionState } from "@daostack/arc.js";
import * as update from "immutability-helper";
import * as moment from "moment";

import * as ActionTypes from "constants/arcConstants";
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

export interface IAccountState {
  address?: string;
  daoAvatarAddress: string;
  redemptions: Array<IRedemptionState | string>; // Either normalized (string) or denormalized (object)
  reputation: number;
  stakes: Array<IStakeState | string>; // Either normalized (string) or denormalized (object)
  tokens: number;
  votes: Array<IVoteState | string>; // Either normalized (string) or denormalized (object)
}

export const emptyAccount: IAccountState = {
  address: null,
  daoAvatarAddress: null,
  redemptions: [],
  reputation: 0,
  stakes: [],
  tokens: 0,
  votes: []
}

export interface IDaoState {
  avatarAddress: string;
  controllerAddress: string;
  ethCount: number;
  fromBlock?: number;
  genCount: number;
  lastBlock: string | number; // The last block on the chain processed for this DAO
  members: Array<IAccountState | string>; // Either normalized (string) or denormalized (object)
  name: string;
  rank: number;
  promotedAmount: number;
  proposals: Array<IProposalState | string>; // Either normalized (string) or denormalized (IProposalState)
  proposalsLoaded: boolean;
  reputationAddress: string;
  reputationCount: number;
  tokenAddress: string;
  tokenCount: number; // How much is actually "owned" by the DAO
  tokenName: string;
  tokenSupply: number; // total amount in circulation
  tokenSymbol: string;
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
  stakerBountyTokens: number;
  transactionState?: TransactionStates;
  voterTokens: number;
  voterReputation: number;
}

export interface IProposalState {
  beneficiaryAddress: string;
  boostedTime: number;
  boostedVotePeriodLimit: number;
  contributionDescriptionHash: string;
  daoAvatarAddress: string;
  description: string;
  ethReward: number;
  executionTime: number;
  externalToken: string;
  externalTokenReward: number;
  nativeTokenReward: number;
  numberOfPeriods: number;
  periodLength: number;
  preBoostedVotePeriodLimit: number;
  proposalId: string;
  proposer: string;
  redeemedPeriods?: number[];
  redemptions: Array<IRedemptionState | string>; // Either normalized (string) or denormalized (object)
  reputationChange: number;
  reputationWhenExecuted?: number;
  stakes: Array<IStakeState | string>; // Either normalized (string) or denormalized (object)
  stakesNo: number;
  stakesYes: number;
  state: ProposalStates;
  submittedTime: number;
  threshold: number;
  title: string;
  transactionState: TransactionStates;
  totalStakes: number;
  totalVotes: number;
  totalVoters: number;
  votes: Array<IVoteState | string>; // Either normalized (string) or denormalized (object)
  votesYes: number;
  votesNo: number;
  winningVote: VoteOptions;
}

export const emptyProposal: IProposalState = {
  beneficiaryAddress: null,
  boostedTime: 0,
  boostedVotePeriodLimit: 0,
  preBoostedVotePeriodLimit: 0,
  contributionDescriptionHash: "",
  description: "",
  daoAvatarAddress: null,
  ethReward: 0,
  executionTime: 0,
  externalToken: "",
  externalTokenReward: 0,
  nativeTokenReward: 0,
  numberOfPeriods: 1,
  periodLength: 0,
  proposalId: null,
  proposer: null,
  redemptions: [],
  reputationChange: 0,
  stakes: [],
  stakesNo: 0,
  stakesYes: 0,
  state: ProposalStates.None,
  submittedTime: 0,
  title: "",
  transactionState: TransactionStates.Unconfirmed,
  totalStakes: 0,
  totalVotes: 0,
  totalVoters: 0,
  votes: [],
  votesYes: 0,
  votesNo: 0,
  winningVote: VoteOptions.No,
  threshold: 0
}

export interface IStakeState {
  avatarAddress: string;
  prediction: VoteOptions;
  proposalId: string;
  transactionState?: TransactionStates;
  stakeAmount: number;
  stakerAddress: string;
}

export interface IVoteState {
  avatarAddress: string;
  proposalId: string;
  reputation?: number;
  transactionState?: TransactionStates;
  voteOption: VoteOptions;
  voterAddress: string;
}

export interface IArcState {
  accounts: { [accountKey: string]: IAccountState },
  daosLoaded: boolean;
  daos: { [avatarAddress: string]: IDaoState },
  lastBlock: string | number; // The most recent block read into the state
  proposals: { [proposalId: string]: IProposalState },
  redemptions: { [redemptionKey: string]: IRedemptionState },
  stakes: { [stakeKey: string]: IStakeState },
  votes: { [voteKey: string]: IVoteState }
}

export const initialState: IArcState = {
  accounts: {},
  daosLoaded: false,
  daos: {},
  lastBlock: 0,
  proposals: {},
  redemptions: {},
  stakes: {},
  votes: {}
};

export function proposalEnded(proposal: IProposalState) {
  const res = (
    proposal.state == ProposalStates.Executed ||
    proposal.state == ProposalStates.Closed ||
    // Boosted proposal past end time but not yet executed
    (proposal.state == ProposalStates.Boosted && proposal.boostedTime + proposal.boostedVotePeriodLimit <= +moment() / 1000) ||
    // Pre boosted proposal past end time but not yet executed
    (proposal.state == ProposalStates.PreBoosted && proposal.submittedTime + proposal.preBoostedVotePeriodLimit <= +moment() / 1000)
  );
  return res;
}

export function proposalPassed(proposal: IProposalState) {
  const res = (
    (proposal.state == ProposalStates.Executed && proposal.winningVote == VoteOptions.Yes) ||
    // Boosted proposal past end time with more yes votes than no, but not yet executed
    (proposal.state == ProposalStates.Boosted && proposal.boostedTime + proposal.boostedVotePeriodLimit <= +moment() / 1000 && proposal.winningVote == VoteOptions.Yes)
  );
  return res;
}

export function proposalFailed(proposal: IProposalState) {
  const res = (
    proposal.state == ProposalStates.Closed ||
    (proposal.state == ProposalStates.Executed && proposal.winningVote == VoteOptions.No) ||
    // Boosted proposal past end time with more no votes than yes, but not yet executed
    (proposal.state == ProposalStates.Boosted && proposal.boostedTime + proposal.boostedVotePeriodLimit <= +moment() / 1000 && proposal.winningVote == VoteOptions.No) ||
    // Pre boosted proposal past end time but not yet executed are always failed
    (proposal.state == ProposalStates.PreBoosted && proposal.submittedTime + proposal.preBoostedVotePeriodLimit <= +moment() / 1000)
  );
  return res;
}

const arcReducer = (state = initialState, action: any) => {
  const { payload } = action;

  // If there are normalized entities in the payload add to the state
  if (payload && payload.entities) {
    state = update(state, {
      accounts: { $merge: payload.entities.accounts || {} },
      daos: { $merge: payload.entities.daos || {} },
      proposals: { $merge : payload.entities.proposals || {} },
      redemptions: { $merge : payload.entities.redemptions || {} },
      stakes: { $merge : payload.entities.stakes || {} },
      votes: { $merge : payload.entities.votes || {} },
    });
  }

  switch (action.type) {
    case ActionTypes.ARC_LOAD_CACHED_STATE_FULFILLED: {
      return payload;
    }

    case ActionTypes.ARC_GET_DAOS_FULFILLED: {
      return update(state, { daosLoaded : { $set : true }, lastBlock: { $set: payload.lastBlock } });
    }

    case ActionTypes.ARC_UPDATE_DAO_LAST_BLOCK: {
      return update(state, { daos : { [payload.avatarAddress]: { lastBlock: { $set: payload.blockNumber } } } });
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
      const proposal = action.payload.entities.proposals[0] as IProposalState;
      const avatarAddress = proposal.daoAvatarAddress;

      // Add the new proposal to the DAO's state if not already there
      if (state.daos[avatarAddress].proposals.indexOf(action.payload.result) === -1) {
        state = update(state , { daos : { [avatarAddress] : { proposals: { $push : [action.payload.result] } } } } );
      }

      return state;
    }

    case ActionTypes.ARC_VOTE: {
      const { meta, sequence, payload } = action as VoteAction;
      const { avatarAddress, proposalId, voteOption, voterAddress } = meta;
      const voteKey = `${proposalId}-${voterAddress}`;
      const accountKey = `${voterAddress}-${avatarAddress}`;

      switch (sequence) {
        case AsyncActionSequence.Pending:
          return update(state, {
            // Add vote to the account, proposal and as an entity
            accounts: {
              [accountKey] : {
                votes: { $push: [voteKey] }
              }
            },
            proposals: {
              [proposalId] : {
                votes: { $push: [voteKey] }
              }
            },
            votes: {
              // TODO: this automatically through normalizing it?
              [voteKey] : { $set: {...meta, transactionState: TransactionStates.Unconfirmed } }
            }
          });
        case AsyncActionSequence.Failure: {
          // Remove the vote from the account, proposal and entities
          return update(state, {
            accounts: {
              [accountKey]: {
                votes: (arr: string[]) => arr.filter((item) => item != voteKey)
              }
            },
            proposals: {
              [proposalId]: {
                votes: (arr: string[]) => arr.filter((item) => item != voteKey)
              }
            },
            votes: { $unset: [voteKey] },
          });
        }
        case AsyncActionSequence.Success: {
          const { dao, proposal, voter } = payload;

          return update(state, {
            accounts: { [accountKey] : { $merge: payload.voter } },
            daos: { [avatarAddress]: { $merge: payload.dao } },
            proposals: { [proposalId]: { $merge : payload.proposal } },
            // Confirm the vote
            votes: {
              [voteKey] : { transactionState: { $set: TransactionStates.Confirmed } }
            }
          });
        }
        default: {
          return state;
        }
      }
    } // EO ARC_VOTE

    case ActionTypes.ARC_STAKE: {
      const { meta, sequence, payload } = action as StakeAction;
      const { avatarAddress, stakerAddress, proposalId, prediction, stakeAmount } = meta;
      const stakeKey = `${proposalId}-${stakerAddress}`;
      const accountKey = `${stakerAddress}-${avatarAddress}`;

      switch (sequence) {
        case AsyncActionSequence.Pending:
          return update(state, {
            // Add vote to the account, proposal and as an entity
            accounts: {
              [accountKey] : {
                stakes: { $push: [stakeKey] }
              }
            },
            proposals: {
              [proposalId] : {
                stakes: { $push: [stakeKey] }
              }
            },
            stakes: {
              // TODO: this automatically through normalizing it?
              [stakeKey] : { $set: {...meta, transactionState: TransactionStates.Unconfirmed } }
            }
          });
        case AsyncActionSequence.Failure:
          // Remove the stake from the account, proposal and entities
          return update(state, {
            accounts: {
              [accountKey]: {
                stakes: (arr: string[]) => arr.filter((item) => item != stakeKey)
              }
            },
            proposals: {
              [proposalId]: {
                stakes: (arr: string[]) => arr.filter((item) => item != stakeKey)
              }
            },
            stakes: { $unset: [stakeKey] },
          });
        case AsyncActionSequence.Success: {
          return update(state, {
            proposals: {
              [proposalId]: { $merge : payload.proposal }
            },
            // Confirm the vote
            stakes: {
              [stakeKey] : { transactionState: { $set: TransactionStates.Confirmed } }
            }
          });
        }
        default: {
          return state;
        }
      }
    } // EO ARC_STAKE

    case ActionTypes.ARC_REDEEM: {
      const { meta, sequence, payload } = action as RedeemAction;
      const { avatarAddress, accountAddress, proposalId } = meta;
      const accountKey = `${accountAddress}-${avatarAddress}`;
      const redemptionsKey = `${proposalId}-${accountAddress}`;

      switch (sequence) {
        case AsyncActionSequence.Pending:
          // TODO: something to show that there is a pending redemption happening in the UI?
          return state;
        case AsyncActionSequence.Success: {
          const { beneficiary, dao, redemptions } = payload;

          if (redemptions) {
            // Still redemptions left for this proposal & beneficiary combo
            state = update(state, {
              redemptions: { [redemptionsKey] : { $set: redemptions }}
            });
          } else {
            // No redemptions left for this proposal & beneficiary combo so remove from the state
            state = update(state, {
              accounts: {
                [accountKey]: {
                  redemptions: (arr: string[]) => arr.filter((item) => item != redemptionsKey)
                }
              },
              proposals: {
                [proposalId]: {
                  redemptions: (arr: string[]) => arr.filter((item) => item != redemptionsKey)
                }
              },
              redemptions: { $unset: [redemptionsKey] }
            });
          }

          // Also update the beneficiary account and the dao
          return update(state, {
            accounts: { [accountKey]: { $merge: beneficiary } },
            daos: { [avatarAddress]: { $merge: dao } },
          });
        }
        default: {
          return state;
        }
      }
    } // EO ARC_REDEEM

    case ActionTypes.ARC_ON_TRANSFER: {
      const { avatarAddress, fromAccount, fromBalance, toAccount, toBalance, totalTokens } = payload;
      const fromKey = `${fromAccount}-${avatarAddress}`;
      const toKey = `${toAccount}-${avatarAddress}`;

      // We see this from address when a DAO is created
      if (fromAccount !== "0x0000000000000000000000000000000000000000") {
        state = update(state, {
          accounts: {
            [fromKey]: {
              tokens: { $set: fromBalance }
            }
          }
        });
      }

      return update(state, {
        daos: {
          [avatarAddress]: {
            tokenCount: { $set: totalTokens },
          }
        },
        accounts: {
          [toKey]: (member: any) => {
            // If tokens are being given to a non member, add them as a member to this DAO
            return update(member || { ...emptyAccount, daoAvatarAddress: avatarAddress, address: toAccount }, {
              tokens: { $set: toBalance }
            });
          }
        }
      });
    }

    case ActionTypes.ARC_ON_REPUTATION_CHANGE: {
      const { avatarAddress, address, reputation, totalReputation } = payload;
      const accountKey = `${address}-${avatarAddress}`;

      return update(state, {
        daos: {
          [avatarAddress]: {
            reputationCount: { $set: totalReputation },
          }
        },
        accounts: {
          [accountKey]: (member: any) => {
            // If reputation is being given to a non member, add them as a member to this DAO
            return update(member || { ...emptyAccount, daoAvatarAddress: avatarAddress, address }, {
              tokens: { $set: reputation }
            });
          }
        }
      });
    }

    case ActionTypes.ARC_ON_PROPOSAL_EXECUTED: {
      const { avatarAddress, proposalId, executionState, decision, reputationWhenExecuted } = payload;

      if (executionState === ExecutionState.PreBoostedBarCrossed || executionState === ExecutionState.BoostedBarCrossed) {
        return update(state, {
          proposals: {
            [proposalId]: {
              $merge: {
                reputationWhenExecuted,
                winningVote: decision,
                state: ProposalStates.Executed
              }
            }
          }
        });
      } else {
        return state;
      }
    }

    case ActionTypes.ARC_ON_DAO_ETH_BALANCE_CHANGE: {
      const { avatarAddress, balance } = payload;

      return update(state, {
        daos: {
          [avatarAddress]: {
            ethCount: { $set: balance || state.daos[avatarAddress].ethCount}
          }
        }
      })
    }

    case ActionTypes.ARC_ON_DAO_GEN_BALANCE_CHANGE: {
      const { avatarAddress, balance } = payload;

      return update(state, {
        daos: {
          [avatarAddress]: {
            genCount: { $set: balance || state.daos[avatarAddress].genCount}
          }
        }
      })
    }
  }

  return state;
};

export default arcReducer;
