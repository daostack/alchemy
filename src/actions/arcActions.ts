import * as Arc from "@daostack/arc.js"
import { ContributionRewardWrapper, ExecutionState, GenesisProtocolFactory } from "@daostack/arc.js";
import { DAO } from '@daostack/client'
import BigNumber from "bignumber.js";
import { denormalize, normalize } from "normalizr";
import { push } from "react-router-redux";
import { IRootState } from "reducers/index";
import { Dispatch } from 'redux';
import * as Redux from "redux";
import { ThunkAction } from "redux-thunk";
import { take } from 'rxjs/operators'
import { Web3 } from "web3";

import { AsyncActionSequence, IAsyncAction } from "actions/async";
import { arc } from "arc"
import Util from "lib/util";
import {
  ActionTypes,
  anyRedemptions,
  checkProposalExpired,
  IAccountState,
  IProposalState as IProposalStateLegacy,
  IRedemptionState,
  IStakeState,
  IVoteState,
  newAccount,
  proposalEndedArc,
  ProposalStates,
  RewardType,
  VoteOptions,
} from "reducers/arcReducer";
import * as schemas from "schemas";

async function getRedemptions(votingMachineInstance: Arc.GenesisProtocolWrapper, proposalInstance: Arc.ContributionRewardWrapper, proposal: IProposalStateLegacy, accountAddress: string): Promise<IRedemptionState> {
  if (!proposalEndedArc(proposal)) {
    return null;
  }

  const proposalId = proposal.proposalId;

  const redeemerInstance = await Arc.RedeemerFactory.deployed();
  const rewards = await redeemerInstance.redeemables({ proposalId, avatarAddress: proposal.daoAvatarAddress, beneficiaryAddress: accountAddress });

  const redemptions: IRedemptionState = {
    accountAddress,
    proposalId,
    beneficiaryEth: 0,
    beneficiaryNativeToken: 0,
    beneficiaryReputation: 0,
    beneficiaryExternalToken: 0,
    proposerReputation: Util.fromWei(rewards.proposerReputationAmount),
    stakerReputation: Util.fromWei(rewards.stakerReputationAmount),
    stakerTokens: Util.fromWei(rewards.stakerTokenAmount),
    stakerBountyTokens: Util.fromWei(rewards.daoStakingBountyPotentialReward),
    voterReputation: Util.fromWei(rewards.voterReputationAmount),
    voterTokens: Util.fromWei(rewards.voterTokenAmount),
  };

  // Beneficiary rewards
  if (accountAddress === proposal.beneficiaryAddress) {
    if (proposal.state == ProposalStates.BoostedTimedOut && proposal.winningVote === VoteOptions.Yes) {
      // Boosted proposal that passed by expiring with more yes votes than no
      // have to manually calculate beneficiary rewards
      redemptions.beneficiaryEth = proposal.numberOfPeriods * proposal.ethReward;
      redemptions.beneficiaryExternalToken = proposal.numberOfPeriods * proposal.externalTokenReward;
      redemptions.beneficiaryNativeToken = proposal.numberOfPeriods * proposal.nativeTokenReward;
      redemptions.beneficiaryReputation = proposal.numberOfPeriods * proposal.reputationChange;
    } else {
      redemptions.beneficiaryEth = (await proposalInstance.contract.getPeriodsToPay(proposalId, proposal.daoAvatarAddress, RewardType.Eth)) * proposal.ethReward;
      redemptions.beneficiaryExternalToken = (await proposalInstance.contract.getPeriodsToPay(proposalId, proposal.daoAvatarAddress, RewardType.ExternalToken)) * proposal.externalTokenReward;
      redemptions.beneficiaryNativeToken = (await proposalInstance.contract.getPeriodsToPay(proposalId, proposal.daoAvatarAddress, RewardType.NativeToken)) * proposal.nativeTokenReward;
      redemptions.beneficiaryReputation = (await proposalInstance.contract.getPeriodsToPay(proposalId, proposal.daoAvatarAddress, RewardType.Reputation)) * proposal.reputationChange;
    }
  }

  return anyRedemptions(redemptions) ? redemptions : null;
}

async function getProposalRedemptions(proposal: IProposalStateLegacy, state: IRootState): Promise<{ entities: any, redemptions: string[] }> {
  if (!proposalEndedArc(proposal)) {
    return { entities: {}, redemptions: [] };
  }

  const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
  const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(proposal.daoAvatarAddress)).votingMachineAddress;
  const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

  const redemptions: IRedemptionState[] = [];
  const accountsToUpdate: { [key: string]: IAccountState } = {};

  // Gather redemptions for all people who interacted with the proposal
  // Doing this here instead of on proposal executed because we need to show redemptions for expired proposals too (TODO: does this make sense?)
  let associatedAccounts = [proposal.beneficiaryAddress, proposal.proposer];
  proposal.votes.forEach((vote: IVoteState) => {
    associatedAccounts.push(vote.voterAddress);
  });
  proposal.stakes.forEach((stake: IStakeState) => {
    associatedAccounts.push(stake.stakerAddress);
  });
  associatedAccounts = [...new Set(associatedAccounts)]; // Dedupe

  let accountRedemptions: IRedemptionState, account: IAccountState;
  for (const accountAddress of associatedAccounts) {
    accountRedemptions = await getRedemptions(votingMachineInstance, contributionRewardInstance, proposal, accountAddress);
    if (accountRedemptions) {
      redemptions.push(accountRedemptions);
      account = state.arc.accounts[`${accountAddress}-${proposal.daoAvatarAddress}`];
      if (!account) {
        account = newAccount(proposal.daoAvatarAddress, accountAddress, 0, 0, [`${proposal.proposalId}-${accountAddress}`]);
      } else if (account.redemptions.indexOf(`${proposal.proposalId}-${accountAddress}`) === -1) {
        // If existing account doesn't have this redemption yet then add it
        account.redemptions.push(`${proposal.proposalId}-${accountAddress}`);
      }
      accountsToUpdate[`${accountAddress}-${proposal.daoAvatarAddress}`] = account;
    }
  }

  const normalizedRedemptions = normalize(redemptions, schemas.redemptionList);

  // Dedupe new redemptions with the old redemptions already on the proposal
  // TODO: seems like this should be happening in the reducer?
  let redemptionsStrings: string[] = [...Object.keys(proposal.redemptions), ...normalizedRedemptions.result];
  redemptionsStrings = [...new Set(redemptionsStrings)];

  const entities = { ...normalizedRedemptions.entities, accounts: accountsToUpdate };
  return { entities, redemptions: redemptionsStrings };
}

export type CreateDAOAction = IAsyncAction<"ARC_CREATE_DAO", {}, any>;

export function createDAO(daoName: string, tokenName: string, tokenSymbol: string, members: IAccountState[]): ThunkAction<any, IRootState, null> {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    try {
      let founders: Arc.FounderConfig[] = [], member: IAccountState;
      let totalReputation = 0, totalTokens = 0;

      members.sort((a: IAccountState, b: IAccountState) => {
        return b.reputation - a.reputation;
      });

      for (let i = 0; i < members.length; i++) {
        member = members[i];
        member.address = member.address.toLowerCase();
        totalReputation += member.reputation;
        totalTokens += member.tokens;
        founders[i] = {
          address: member.address,
          tokens: Util.toWei(member.tokens),
          reputation: Util.toWei(member.reputation),
        };
      }

      dispatch({
        type: ActionTypes.ARC_CREATE_DAO,
        sequence: AsyncActionSequence.Pending,
      } as CreateDAOAction);

      const dao = await Arc.DAO.new({
        name: daoName,
        tokenName,
        tokenSymbol,
        founders,
        schemes: [
          // TODO: add these
          // { name: "UpgradeScheme" },
          // { name: "GlobalConstraintRegistrar" },
          { name: "SchemeRegistrar" },
          { name: "ContributionReward" },
          { name: "GenesisProtocol" },
        ],
        votingMachineParams: {
          votingMachineName: "GenesisProtocol",
        },
      });

      const votingMachineInstance = await Arc.GenesisProtocolFactory.deployed();
      const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();

      const daoData: any = {
        avatarAddress: dao.avatar.address,
        controllerAddress: dao.controller.address,
        currentThresholdToBoost:
          Util.fromWei(await votingMachineInstance.getThresholdForSchemeAndCreator(contributionRewardInstance, dao.avatar.address)),
        ethCount: 0,
        externalTokenCount: 0,
        genCount: 0,
        lastBlock: await Util.getLatestBlock(),
        name: daoName,
        members,
        rank: 1, // TODO
        promotedAmount: 0,
        proposals: [],
        proposalsLoaded: true,
        reputationAddress: dao.reputation.address,
        reputationCount: totalReputation,
        tokenAddress: dao.token.address,
        tokenCount: 0,
        tokenSupply: totalTokens,
        tokenName,
        tokenSymbol,
      };

      dispatch({
        type: ActionTypes.ARC_CREATE_DAO,
        sequence: AsyncActionSequence.Success,
        payload: normalize(daoData, schemas.daoSchema),
      } as CreateDAOAction);

      dispatch(push("/dao/" + dao.avatar.address));
    } catch (err) {
      console.error(err);
      dispatch({
        type: ActionTypes.ARC_CREATE_DAO,
        sequence: AsyncActionSequence.Failure,
      } as CreateDAOAction);
    }
  }; /* EO createDAO */
}

export type CreateProposalAction = IAsyncAction<"ARC_CREATE_PROPOSAL", { avatarAddress: string }, any>;

export function createProposal(
  daoAvatarAddress: string,
  title: string,
  description: string,
  nativeTokenReward: string | BigNumber,
  reputationReward: string | BigNumber,
  ethReward: string | BigNumber,
  externalTokenReward: string | BigNumber,
  beneficiaryAddress: string
): ThunkAction<any, IRootState, null> {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const meta = {
      avatarAddress: daoAvatarAddress,
    };

    try {
      // TODO: the client lib should (and will) provide and set the default account: https://github.com/daostack/client/issues/42
      const defaultAccount = await Arc.Utils.getDefaultAccount()
      arc.web3.eth.defaultAccount = defaultAccount.toLowerCase()

      if (!beneficiaryAddress.startsWith("0x")) { beneficiaryAddress = "0x" + beneficiaryAddress }
      beneficiaryAddress = beneficiaryAddress.toLowerCase()

      // TODO: leave this commented code - we may want to re-use it later in the light of graph-node problems
      // const submittedTime = Math.round((new Date()).getTime() / 1000);
      // Save the proposal title, description and submitted time on the server
      // try {
      //   const response = await axios.post(process.env.API_URL + "/api/proposals", {
      //     daoAvatarAddress,
      //     descriptionHash,
      //     description,
      //     submittedAt: submittedTime,
      //     title,
      //   });
      // } catch (e) {
      //   console.error(e);
      //   throw e
      // }

      dispatch({
        type: ActionTypes.ARC_CREATE_PROPOSAL,
        sequence: AsyncActionSequence.Pending,
        meta,
      } as CreateProposalAction);

      // Go back to home page while action create proposal operation gets carried out
      dispatch(push("/dao/" + daoAvatarAddress));
      const dao = new DAO(daoAvatarAddress, arc)
      const proposalOptions = {
        beneficiary: beneficiaryAddress,
        description,
        // TODO: to these conversion closer to the source (i.e. at form submit, not here)
        nativeTokenReward: arc.web3.utils.toWei(String(nativeTokenReward)),
        // TODO: it is probably more robust to have the form values in "wei"
        // (also because it is not clear if best unit of account is e18 for rep or nativeToken)
        reputationReward: arc.web3.utils.toWei(String(reputationReward)),
        ethReward: arc.web3.utils.toWei(String(ethReward)),
        externalTokenReward: arc.web3.utils.toWei(String(externalTokenReward)),
        externalTokenAddress: '',
        periodLength: 0, // TODO: check what the default "periodLength" should be here
        periods: 1, // "periodLength 0 requires periods to be 1"
        title,
        url: description
      }
      // TODO: use the Option stages of the client lib to communicate about the progress
      await dao.createProposal(proposalOptions)
        .pipe(take(2)).toPromise()
    } catch (err) {
      console.error(err);
      dispatch({
        type: ActionTypes.ARC_CREATE_PROPOSAL,
        sequence: AsyncActionSequence.Failure,
        meta,
      } as CreateProposalAction);
      throw err
    }
  };
}

export function executeProposal(avatarAddress: string, proposalId: string) {
  return async (dispatch: Dispatch<any>) => {
    const dao = await Arc.DAO.at(avatarAddress);
    const cr = (await dao.getSchemes("ContributionReward"))[0].wrapper as ContributionRewardWrapper;
    const gpAddress = await cr.getVotingMachineAddress(avatarAddress);
    const gp = await GenesisProtocolFactory.at(gpAddress);
    await gp.execute({ proposalId });
  };
}

export function onProposalExecuted(avatarAddress: string, proposalId: string, executionState: ExecutionState, decision: VoteOptions, reputationWhenExecuted: number) {
  return async (dispatch: Dispatch<any>, getState: () => IRootState) => {
    if (executionState != ExecutionState.None) {
      const proposal = denormalize(getState().arc.proposals[proposalId], schemas.proposalSchema, getState().arc);
      if (!proposal) {
        return;
      }

      const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
      const daoInstance = await Arc.DAO.at(proposal.daoAvatarAddress);
      const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(proposal.daoAvatarAddress)).votingMachineAddress;
      const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

      const proposalDetails = await contributionRewardInstance.getProposal(avatarAddress, proposalId);
      proposal.executionTime = Number(proposalDetails.executionTime);
      proposal.state = ProposalStates.Executed;
      proposal.reputationWhenExecuted = reputationWhenExecuted;
      proposal.winningVote = decision;

      // Have to do this because redeem sets proposer to 0, to prevent future redemptions for proposer
      proposal.proposer = (await votingMachineInstance.NewProposal({ _proposalId: proposalId }, { fromBlock: 0, toBlock: "latest" }).get(undefined, -1))[0].args._proposer;

      let { redemptions, entities } = await getProposalRedemptions(proposal, getState());
      proposal.redemptions = redemptions;

      const normalizedProposal = normalize(proposal, schemas.proposalSchema);
      entities = { ...entities, ...normalizedProposal.entities };

      const daoUpdates = {
        avatarAddress,
        currentThresholdToBoost:
          Util.fromWei(await votingMachineInstance.getThresholdForSchemeAndCreator(contributionRewardInstance, avatarAddress)),
      };

      return dispatch({
        type: ActionTypes.ARC_ON_PROPOSAL_EXECUTED,
        payload: { entities, dao: daoUpdates },
      });
    }
  };
}

export function onProposalExpired(proposal: IProposalStateLegacy) {
  return async (dispatch: Dispatch<any>, getState: () => IRootState) => {

    const expiredState = checkProposalExpired(proposal);
    if (expiredState != proposal.state) {
      proposal.state = expiredState;
    } else {
      return;
    }

    // proposal.reputationWhenExecuted = TODO: get from DAO? but this will get out of date on refresh...

    let { redemptions, entities } = await getProposalRedemptions(proposal, getState());
    proposal.redemptions = redemptions;
    const normalizedProposal = normalize(proposal, schemas.proposalSchema);
    entities = { ...entities, ...normalizedProposal.entities };

    const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
    const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(proposal.daoAvatarAddress)).votingMachineAddress;
    const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

    const daoUpdates = {
      avatarAddress: proposal.daoAvatarAddress,
      currentThresholdToBoost:
        Util.fromWei(await votingMachineInstance.getThresholdForSchemeAndCreator(contributionRewardInstance, proposal.daoAvatarAddress)),
    };

    return dispatch({
      type: ActionTypes.ARC_ON_PROPOSAL_EXPIRED,
      payload: { entities, dao: daoUpdates },
    });
  };
}

export type VoteAction = IAsyncAction<"ARC_VOTE", {
  avatarAddress: string,
  proposalId: string,
  reputation: number,
  voteOption: VoteOptions,
  voterAddress: string,
}, {
    entities: any,
    proposal: any,
    voter: any,
  }>;

export function voteOnProposal(daoAvatarAddress: string, proposal: IProposalStateLegacy, voteOption: number) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const web3: Web3 = await Arc.Utils.getWeb3();
    const currentAccountAddress = getState().web3.ethAccountAddress;
    const currentAccountReputation = getState().arc.accounts[`${currentAccountAddress}-${daoAvatarAddress}`].reputation;
    const proposalId = proposal.proposalId;

    const meta: IVoteState = {
      avatarAddress: daoAvatarAddress,
      proposalId,
      reputation: currentAccountReputation,
      voteOption,
      voterAddress: currentAccountAddress,
    };

    try {
      const daoInstance = await Arc.DAO.at(daoAvatarAddress);
      const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
      const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(daoAvatarAddress)).votingMachineAddress;
      const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

      dispatch({
        type: ActionTypes.ARC_VOTE,
        sequence: AsyncActionSequence.Pending,
        meta,
      } as VoteAction);

      await votingMachineInstance.vote({
        proposalId,
        vote: voteOption,
      });

    } catch (err) {
      console.error(err);
      dispatch({
        type: ActionTypes.ARC_VOTE,
        sequence: AsyncActionSequence.Failure,
        meta,
      } as VoteAction);
    }
  };
}

export function onVoteEvent(avatarAddress: string, proposalId: string, voterAddress: string, voteOption: number, reputation: number) {
  return async (dispatch: any, getState: () => IRootState) => {
    const meta: IVoteState = {
      avatarAddress,
      proposalId,
      reputation,
      voteOption,
      voterAddress,
    };

    const daoInstance = await Arc.DAO.at(avatarAddress);
    const proposal: IProposalStateLegacy = getState().arc.proposals[proposalId];
    if (!proposal) {
      return;
    }

    const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
    const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(avatarAddress)).votingMachineAddress;
    const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

    const proposalDetails = await votingMachineInstance.getProposal(proposalId);
    proposal.boostedTime = Number(proposalDetails.boostedPhaseTime); // update the boosted time in case we are in quiet ending period
    proposal.boostedVotePeriodLimit = Number(proposalDetails.currentBoostedVotePeriodLimit); // update boostedVotePeriodLimit in case we are in quiet ending period
    proposal.votesYes = Util.fromWei(await votingMachineInstance.getVoteStatus({ proposalId, vote: VoteOptions.Yes }));
    proposal.votesNo = Util.fromWei(await votingMachineInstance.getVoteStatus({ proposalId, vote: VoteOptions.No }));
    proposal.winningVote = await votingMachineInstance.getWinningVote({ proposalId });
    proposal.state = Number(await votingMachineInstance.getState({ proposalId }));
    proposal.state = checkProposalExpired(proposal);

    let entities = {};
    const voterRedemptions = await getRedemptions(votingMachineInstance, contributionRewardInstance, proposal, voterAddress);
    if (voterRedemptions) {
      const normalizedRedemptions = normalize(voterRedemptions, schemas.redemptionSchema);
      entities = normalizedRedemptions.entities;
      if (normalizedRedemptions.result && proposal.redemptions.indexOf(normalizedRedemptions.result) === -1) {
        proposal.redemptions.push(normalizedRedemptions.result);
      }
    }

    const payload = {
      entities,
      // Update the proposal
      proposal,
      // Update voter tokens and reputation
      voter: {
        tokens: Util.fromWei(await daoInstance.token.getBalanceOf(voterAddress)),
        reputation: Util.fromWei(await daoInstance.reputation.getBalanceOf(voterAddress)),
      },
    };

    dispatch({
      type: ActionTypes.ARC_VOTE,
      sequence: AsyncActionSequence.Success,
      meta,
      payload,
    } as VoteAction);
  };
}

export type StakeAction = IAsyncAction<"ARC_STAKE", {
  avatarAddress: string,
  proposalId: string,
  prediction: VoteOptions,
  stakeAmount: number,
  stakerAddress: string,
}, {
    dao: any,
    proposal: any,
  }>;

export function stakeProposal(daoAvatarAddress: string, proposalId: string, prediction: number, stakeAmount: number) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const web3: Web3 = await Arc.Utils.getWeb3();
    const currentAccountAddress: string = getState().web3.ethAccountAddress;
    const proposal: IProposalStateLegacy = getState().arc.proposals[proposalId];

    const meta = {
      avatarAddress: daoAvatarAddress,
      proposalId,
      stakeAmount,
      prediction,
      stakerAddress: currentAccountAddress,
    };

    // We currently requires already pre-approving a bunch of GENs to stake with, so we don't do the approve call again
    Arc.ConfigService.set("autoApproveTokenTransfers", false);

    try {
      const daoInstance = await Arc.DAO.at(daoAvatarAddress);
      const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
      const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(daoAvatarAddress)).votingMachineAddress;
      const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

      const votingMachineParamsHash = await
        (await contributionRewardInstance.getSchemeParameters(daoInstance.avatar.address)).voteParametersHash;

      const votingMachineParams = await votingMachineInstance.getParameters(votingMachineParamsHash);

      const minimumStakingFee = votingMachineParams.minimumStakingFee;

      const amount = new BigNumber(Util.toWei(stakeAmount));
      if (amount.lt(minimumStakingFee)) { throw new Error(`Staked less than the minimum: ${Util.fromWei(minimumStakingFee)}!`); }

      dispatch({
        type: ActionTypes.ARC_STAKE,
        sequence: AsyncActionSequence.Pending,
        meta,
      } as StakeAction);

      await votingMachineInstance.stake({
        proposalId,
        vote: prediction,
        amount,
      });
    } catch (err) {
      console.error(err);
      dispatch({
        type: ActionTypes.ARC_STAKE,
        sequence: AsyncActionSequence.Failure,
        meta,
      } as StakeAction);
    }
  };
}

export function onStakeEvent(avatarAddress: string, proposalId: string, stakerAddress: string, prediction: number, stakeAmount: number) {
  return async (dispatch: any, getState: () => IRootState) => {
    const daoInstance = await Arc.DAO.at(avatarAddress);
    const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
    const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(avatarAddress)).votingMachineAddress;
    const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

    const proposal: IProposalStateLegacy = getState().arc.proposals[proposalId];
    if (!proposal) {
      // Seeing this on production. Shouldn't really happen but may as well check for safety. Must be from past issues with cache script?
      return;
    }

    const proposalDetails = await votingMachineInstance.getProposal(proposalId);
    const proposalStatus = await votingMachineInstance.getProposalStatus({ proposalId });
    proposal.stakesYes = Util.fromWei(proposalStatus.stakesYes);
    proposal.stakesNo = Util.fromWei(proposalStatus.stakesNo);
    proposal.boostedTime = Number(proposalDetails.boostedPhaseTime);
    proposal.state = Number(await votingMachineInstance.getState({ proposalId }));
    proposal.state = checkProposalExpired(proposal);

    const meta = {
      avatarAddress,
      proposalId,
      prediction,
      stakeAmount,
      stakerAddress,
    };

    dispatch({
      type: ActionTypes.ARC_STAKE,
      sequence: AsyncActionSequence.Success,
      meta,
      payload: {
        dao: {
          currentThresholdToBoost:
            Util.fromWei(await votingMachineInstance.getThresholdForSchemeAndCreator(contributionRewardInstance, avatarAddress)),
        },
        proposal,
      },
    } as StakeAction);
  };
}

export type RedeemAction = IAsyncAction<"ARC_REDEEM", {
  avatarAddress: string,
  proposalId: string,
  accountAddress: string,
}, {
    currentAccount: any,
    beneficiary: any,
    dao: any,
    proposal: any;
    beneficiaryRedemptions: IRedemptionState,
    currentAccountRedemptions: IRedemptionState,
  }>;

export function redeemProposal(daoAvatarAddress: string, proposal: IProposalStateLegacy, accountAddress: string) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const redemption = getState().arc.redemptions[`${proposal.proposalId}-${accountAddress}`];
    const dao = getState().arc.daos[daoAvatarAddress];
    const web3: Web3 = await Arc.Utils.getWeb3();

    const meta = {
      avatarAddress: daoAvatarAddress,
      proposalId: proposal.proposalId,
      accountAddress,
    };

    dispatch({
      type: ActionTypes.ARC_REDEEM,
      sequence: AsyncActionSequence.Pending,
      meta,
    } as RedeemAction);

    try {
      const redeemerInstance = await Arc.RedeemerFactory.deployed();
      await redeemerInstance.redeem({ avatarAddress: daoAvatarAddress, beneficiaryAddress: accountAddress, proposalId: proposal.proposalId });

      // Get all the latest info about redemptions for the success event
      const daoInstance = await Arc.DAO.at(daoAvatarAddress);
      const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
      const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(daoAvatarAddress)).votingMachineAddress;
      const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

      const proposalDetails = await contributionRewardInstance.getProposal(daoAvatarAddress, proposal.proposalId);
      const beneficiaryAddress = proposalDetails.beneficiaryAddress;

      const beneficiaryRedemptions = await getRedemptions(votingMachineInstance, contributionRewardInstance, proposal, beneficiaryAddress);

      proposal.state = Number(await votingMachineInstance.getState({ proposalId: proposal.proposalId }));
      proposal.state = checkProposalExpired(proposal);

      const payload: any = {
        // Update account of the beneficiary
        beneficiary: {
          tokens: Util.fromWei(await daoInstance.token.getBalanceOf(beneficiaryAddress)),
          reputation: Util.fromWei(await daoInstance.reputation.getBalanceOf(beneficiaryAddress)),
        },
        // Update DAO total reputation and tokens
        //   XXX: this doesn't work with MetaMask and ganache right now, there is some weird caching going on
        dao: {
          reputationCount: Util.fromWei(await daoInstance.reputation.contract.totalSupply()), // TODO: replace with wrapper function when available.
          tokenCount: Util.fromWei(await daoInstance.token.getTotalSupply()),
        },
        proposal: {
          proposer: proposal.proposer,
          state: proposal.state,
        },
        beneficiaryRedemptions,
      };

      if (accountAddress !== beneficiaryAddress) {
        payload.currentAccount = {
          address: accountAddress,
          reputation: Util.fromWei(await daoInstance.reputation.getBalanceOf(accountAddress)),
          tokens: Util.fromWei(await daoInstance.token.getBalanceOf(accountAddress)),
        };
        const currentAccountRedemptions = await getRedemptions(votingMachineInstance, contributionRewardInstance, proposal, accountAddress);
        payload.currentAccountRedemptions = currentAccountRedemptions;
      }

      dispatch({
        type: ActionTypes.ARC_REDEEM,
        sequence: AsyncActionSequence.Success,
        meta,
        payload,
      } as RedeemAction);

    } catch (err) {
      console.error(err);
      dispatch({
        type: ActionTypes.ARC_REDEEM,
        sequence: AsyncActionSequence.Failure,
        meta,
      } as RedeemAction);
    }
  };
}

export function onRedeemReward(avatarAddress: string, proposalId: string, beneficiary: string, rewardType: RewardType, isTarget: boolean) {
  return async (dispatch: Dispatch<any>, getState: () => IRootState) => {
    dispatch({
      type: ActionTypes.ARC_ON_REDEEM_REWARD,
      payload: {
        avatarAddress,
        rewardType,
        proposalId,
        beneficiary,
        isTarget,
      },
    });
  };
}
