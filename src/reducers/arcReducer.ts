import * as update from "immutability-helper";
import * as moment from "moment";

import { RedeemAction, StakeAction, VoteAction } from "actions/arcActions";
import { AsyncActionSequence } from "actions/async";

import { IProposalOutcome, IProposalStage, IProposalState as IProposalStateFromDaoStackClient } from "@daostack/client";

export enum ActionTypes {
  ARC_CREATE_DAO = "ARC_CREATE_DAO",
  ARC_CREATE_PROPOSAL = "ARC_CREATE_PROPOSAL",
  ARC_GET_DAOS = "ARC_GET_DAOS",
  ARC_GET_DAO = "ARC_GET_DAO",
  ARC_LOAD_CACHED_STATE = "ARC_LOAD_CACHED_STATE",
  ARC_ON_DAO_ETH_BALANCE_CHANGE = "ARC_ON_DAO_ETH_BALANCE_CHANGE",
  ARC_ON_DAO_EXTERNAL_TOKEN_BALANCE_CHANGE = "ARC_ON_DAO_EXTERNAL_TOKEN_BALANCE_CHANGE",
  ARC_ON_DAO_GEN_BALANCE_CHANGE = "ARC_ON_DAO_GEN_BALANCE_CHANGE",
  ARC_ON_PROPOSAL_EXECUTED = "ARC_ON_PROPOSAL_EXECUTED",
  ARC_ON_PROPOSAL_EXPIRED = "ARC_ON_PROPOSAL_EXPIRED",
  ARC_ON_REDEEM_REWARD = "ARC_ON_REDEEM_REWARD",
  ARC_ON_REPUTATION_CHANGE = "ARC_ON_REPUTATION_CHANGE",
  ARC_ON_TRANSFER = "ARC_ON_TRANSFER",
  ARC_REDEEM = "ARC_REDEEM",
  ARC_STAKE = "ARC_STAKE",
  ARC_UPDATE_DAO_LAST_BLOCK = "ARC_UPDATE_DAO_LAST_BLOCK",
  ARC_VOTE = "ARC_VOTE",
}

enum ProposalStates {
  None,
  Closed,
  Executed,
  PreBoosted,
  Boosted,
  QuietEndingPeriod,
  PreBoostedTimedOut, // pre boosted proposal past time limit but not executed yet
  BoostedTimedOut // boosted proposal past time limit but not executed yet
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

export enum RewardType {
  Reputation = 0,
  NativeToken = 1,
  Eth = 2,
  ExternalToken = 3,
  GEN = 4,
  BountyGEN = 5
}

export interface IAccountState {
  address?: string;
  daoAvatarAddress: string;
  redemptions: (IRedemptionState | string)[]; // Either normalized (string) or denormalized (object)
  reputation: number;
  stakes: (IStakeState | string)[]; // Either normalized (string) or denormalized (object)
  tokens: number;
  votes: (IVoteState | string)[]; // Either normalized (string) or denormalized (object)
}

function newAccount(
  daoAvatarAddress: string,
  address: string,
  reputation = 0,
  tokens = 0,
  redemptions: (IRedemptionState | string)[] = [],
  stakes: (IStakeState | string)[] = [],
  votes: (IVoteState | string)[] = []): IAccountState {
  return {
    address,
    daoAvatarAddress,
    redemptions: redemptions,
    reputation,
    stakes: stakes,
    tokens,
    votes: votes,
  };
}

export interface IRedemptionState {
  accountAddress: string;
  beneficiaryEth: number;
  beneficiaryNativeToken: number;
  beneficiaryReputation: number;
  beneficiaryExternalToken: number;
  proposalId: string;
  proposerReputation: number;
  proposal?: IProposalState;
  stakerReputation: number;
  stakerTokens: number;
  stakerBountyTokens: number;
  voterTokens: number;
  voterReputation: number;
}

function anyRedemptions(redemptions: IRedemptionState): boolean {
  return (
    !!redemptions.beneficiaryEth ||
    !!redemptions.beneficiaryReputation ||
    !!redemptions.beneficiaryNativeToken ||
    !!redemptions.beneficiaryExternalToken ||
    !!redemptions.proposerReputation ||
    !!redemptions.stakerReputation ||
    !!redemptions.stakerTokens ||
    !!redemptions.stakerBountyTokens ||
    !!redemptions.voterReputation ||
    !!redemptions.voterTokens
  );
}

interface IProposalState {
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
  redemptions: (IRedemptionState | string)[]; // Either normalized (string) or denormalized (object)
  reputationChange: number;
  reputationWhenExecuted?: number;
  stakes: (IStakeState | string)[]; // Either normalized (string) or denormalized (object)
  stakesNo: number;
  stakesYes: number;
  state: ProposalStates;
  submittedTime: number;
  title: string;
  ITransactionState: TransactionStates;
  votes: (IVoteState | string)[]; // Either normalized (string) or denormalized (object)
  votesYes: number;
  votesNo: number;
  winningVote: VoteOptions;
}

interface IStakeState {
  avatarAddress: string;
  prediction: VoteOptions;
  proposalId: string;
  stakeAmount: number;
  stakerAddress: string;
}

interface IVoteState {
  avatarAddress: string;
  proposalId: string;
  reputation?: number;
  voteOption: VoteOptions;
  voterAddress: string;
}

export interface IArcState {
  accounts: { [accountKey: string]: IAccountState };
  lastBlock: string | number; // The most recent block read into the state
  proposals: { [proposalId: string]: IProposalState };
  redemptions: { [redemptionKey: string]: IRedemptionState };
  stakes: { [stakeKey: string]: IStakeState };
  votes: { [voteKey: string]: IVoteState };
}

const initialState: IArcState = {
  accounts: {},
  lastBlock: 0,
  proposals: {},
  redemptions: {},
  stakes: {},
  votes: {},
};

export const closingTime = (proposal: IProposalStateFromDaoStackClient) => {
  switch (proposal.stage) {
    case IProposalStage.ExpiredInQueue:
    case IProposalStage.Queued:
      return moment((proposal.createdAt + proposal.genesisProtocolParams.queuedVotePeriodLimit) * 1000);
    case IProposalStage.PreBoosted:
      return moment((proposal.preBoostedAt + proposal.genesisProtocolParams.preBoostedVotePeriodLimit) * 1000);
    case IProposalStage.Boosted:
      return moment((proposal.boostedAt + proposal.genesisProtocolParams.boostedVotePeriodLimit) * 1000);
    case IProposalStage.QuietEndingPeriod:
      return moment((proposal.quietEndingPeriodBeganAt + proposal.genesisProtocolParams.quietEndingPeriod) * 1000);
    case IProposalStage.Executed:
      return moment(proposal.executedAt * 1000);
  }
};

export function proposalExpired(proposal: IProposalStateFromDaoStackClient) {
  const res = (
    (proposal.stage === IProposalStage.ExpiredInQueue) ||
    (proposal.stage === IProposalStage.Queued && closingTime(proposal) <= moment())
  );
  return res;
}

export function proposalEnded(proposal: IProposalStateFromDaoStackClient) {
  const res = (
    (proposal.stage === IProposalStage.Executed) || proposalExpired(proposal));
  return res;
}

export function proposalPassed(proposal: IProposalStateFromDaoStackClient) {
  const res = (
    (proposal.stage === IProposalStage.Executed && proposal.winningOutcome === IProposalOutcome.Pass)
  );
  return res;
}

export function proposalFailed(proposal: IProposalStateFromDaoStackClient) {
  const res = (
    (proposal.stage === IProposalStage.Executed && proposal.winningOutcome === IProposalOutcome.Fail) ||
    proposalExpired(proposal)
  );
  return res;
}

const arcReducer = (state = initialState, action: any) => {
  const { payload } = action;

  // If there are normalized entities in the payload add to the state
  if (payload && payload.entities) {
    state = update(state, {
      accounts: { $merge: payload.entities.accounts || {} },
      proposals: { $merge : payload.entities.proposals || {} },
      redemptions: { $merge : payload.entities.redemptions || {} },
      stakes: { $merge : payload.entities.stakes || {} },
      votes: { $merge : payload.entities.votes || {} },
    });
  }

  switch (action.type) {
    case ActionTypes.ARC_LOAD_CACHED_STATE: {
      if (action.sequence === AsyncActionSequence.Success) { return payload; }
      return state;
    }

    case ActionTypes.ARC_VOTE: {
      const { meta, sequence, payload } = action as VoteAction;
      const { avatarAddress, proposalId, voterAddress } = meta;
      const voteKey = `${proposalId}-${voterAddress}`;
      const accountKey = `${voterAddress}-${avatarAddress}`;

      switch (sequence) {
        case AsyncActionSequence.Success: {
          const { proposal, voter } = payload;

          // Add empty account if there isnt one tied to the DAO already
          // XXX: this shouldn't happen but does right now because we are not watching for all changes to all DAOs, only to currently viewed one
          if (!state.accounts[accountKey]) {
            state = update(state, { accounts: { [accountKey]: { $set: newAccount(avatarAddress, voterAddress) }}});
          }

          state = update(state, {
            accounts: { [accountKey]: { $merge: voter } },
            proposals: { [proposalId]: { $merge: proposal } },
            // Add vote to the state
            votes: {
              [voteKey]: { $set: meta },
            },
          });

          // Add vote to account if not already there.
          // XXX: need to do this after merging in voter account above
          if (state.accounts[accountKey].votes.indexOf(voteKey) === -1) {
            state = update(state, { accounts: { [accountKey]: { votes: { $push: [voteKey] } } } });
          }
          // Add vote to proposal if not already there
          // XXX: need to do this after merging in proposal above
          if (state.proposals[proposalId].votes.indexOf(voteKey) === -1) {
            state = update(state, { proposals: { [proposalId]: { votes: { $push: [voteKey] } } } });
          }

          return state;
        }
        default: {
          return state;
        }
      }
    } // EO ARC_VOTE

    case ActionTypes.ARC_STAKE: {
      const { meta, sequence, payload } = action as StakeAction;
      const { avatarAddress, stakerAddress, proposalId } = meta;
      const stakeKey = `${proposalId}-${stakerAddress}`;
      const accountKey = `${stakerAddress}-${avatarAddress}`;

      switch (sequence) {
        case AsyncActionSequence.Success: {

          // Add empty account if there isnt one tied to the DAO already
          if (!state.accounts[accountKey]) {
            state = update(state, { accounts: { [accountKey]: { $set: newAccount(avatarAddress, stakerAddress) }}});
          }

          state = update(state, {
            proposals: {
              [proposalId]: { $merge : payload.proposal },
            },
            // Add stake to the state
            stakes: {
              [stakeKey]: { $set: meta },
            },
          });

          // Add stake to account if not already there
          if (state.accounts[accountKey].stakes.indexOf(stakeKey) === -1) {
            state = update(state, { accounts: { [accountKey] : { stakes: { $push: [stakeKey] } } } });
          }
          // Add stake to proposal if not already there
          if (state.proposals[proposalId].stakes.indexOf(stakeKey) === -1) {
            state = update(state, { proposals: { [proposalId] : { stakes: { $push: [stakeKey] } } } });
          }

          return state;
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
        case AsyncActionSequence.Success: {
          const { currentAccount, beneficiary, beneficiaryRedemptions, currentAccountRedemptions, proposal } = payload;

          // Update beneficiary reputation
          state = update(state, {
            accounts: {
              [accountKey]: (account: any) => {
                // Make sure account exists for this DAO
                return update(account || newAccount(avatarAddress, accountAddress), {
                  $merge: beneficiary,
                });
              },
            },
          });

          if (beneficiaryRedemptions) {
            // Still redemptions left for this proposal & beneficiary combo
            state = update(state, {
              redemptions: { [redemptionsKey] : { $set: beneficiaryRedemptions }},
            });
          } else {
            // No redemptions left for this proposal & beneficiary combo so remove from the state
            state = update(state, {
              accounts: {
                [accountKey]: {
                  redemptions: (arr: string[]) => arr.filter((item) => item !== redemptionsKey),
                },
              },
              proposals: {
                [proposalId]: {
                  redemptions: (arr: string[]) => arr.filter((item) => item !== redemptionsKey),
                },
              },
              redemptions: { $unset: [redemptionsKey] },
            });
          }

          if (currentAccount) {
            const currentAccountKey = `${currentAccount.address}-${avatarAddress}`;
            const currentAccountRedemptionsKey = `${proposalId}-${currentAccount.address}`;

            // Update current account reputation
            state = update(state, {
              accounts: {
                [currentAccountKey]: (account: any) => {
                  // Make sure account exists for this DAO
                  return update(account || newAccount(avatarAddress, currentAccount.address), {
                    $merge: currentAccount,
                  });
                },
              },
            });

            if (currentAccountRedemptions) {
              // Still redemptions left for this proposal for current account
              state = update(state, {
                redemptions: { [currentAccountRedemptionsKey] : { $set: currentAccountRedemptions }},
              });
            } else {
              // No redemptions left for this proposal & current account combo so remove from the state
              state = update(state, {
                accounts: {
                  [currentAccountKey]: {
                    redemptions: (arr: string[]) => arr.filter((item) => item !== currentAccountRedemptionsKey),
                  },
                },
                proposals: {
                  [proposalId]: {
                    redemptions: (arr: string[]) => arr.filter((item) => item !== currentAccountRedemptionsKey),
                  },
                },
                redemptions: { $unset: [currentAccountRedemptionsKey] },
              });
            }
          }

          // Also update the dao and proposal
          return update(state, {
            proposals: { [proposalId]: { $merge: proposal }},
          });
        }
        default: {
          return state;
        }
      }
    } // EO ARC_REDEEM

    case ActionTypes.ARC_ON_REDEEM_REWARD: {
      const { avatarAddress, rewardType, proposalId, beneficiary, isTarget } = payload;
      const redemptionKey = `${proposalId}-${beneficiary}`;
      const accountKey = `${beneficiary}-${avatarAddress}`;
      const type = rewardType as RewardType;

      if (!state.redemptions[redemptionKey]) {
        return state;
      }

      const updateObj =
        isTarget ?
          (
            type === RewardType.Eth ?
              { beneficiaryEth: {$set: 0} } :
              type === RewardType.ExternalToken ?
                { beneficiaryExternalToken: {$set: 0} } :
                type === RewardType.Reputation ?
                  { beneficiaryReputation: {$set: 0} } :
                  type === RewardType.NativeToken ?
                    { beneficiaryNativeToken: {$set: 0} } :
                    {}
          ) :
          (
            type === RewardType.Reputation ?
              {
                proposerReputation: {$set: 0},
                stakerReputation: {$set: 0},
                voterReputation: {$set: 0},
              } :
              type === RewardType.GEN ?
                {
                  stakerTokens: {$set: 0},
                  voterTokens: {$set: 0},
                } :
                type === RewardType.BountyGEN ?
                  {
                    stakerBountyTokens: {$set: 0},
                  } :
                  {}
          );

      // Set redeemed rewards to zero
      state = update(state, {
        redemptions: {
          [redemptionKey]: updateObj,
        },
      });

      // Remove if there are no more redemptions
      if (!anyRedemptions(state.redemptions[redemptionKey])) {
        state = update(state, {
          accounts: {
            [accountKey]: {
              redemptions: (arr: string[]) => arr.filter((item) => item !== redemptionKey),
            },
          },
          proposals: {
            [proposalId]: {
              redemptions: (arr: string[]) => arr.filter((item) => item !== redemptionKey),
            },
          },
          redemptions: { $unset: [redemptionKey] },
        });
      }

      return state;
    }

  }

  return state;
};

export default arcReducer;
