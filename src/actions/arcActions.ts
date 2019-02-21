import { DAO, ProposalOutcome } from "@daostack/client";
import BigNumber from "bignumber.js";
import BN = require("bn.js");
import { push } from "react-router-redux";
import { IRootState } from "reducers/index";
import { Dispatch } from "redux";
import * as Redux from "redux";
import { ThunkAction } from "redux-thunk";
import { first, take } from "rxjs/operators";
import { Web3 } from "web3";

import { AsyncActionSequence, IAsyncAction } from "actions/async";
import { getArc } from "arc";
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
import Util from "lib/util";

async function getRedemptions(votingMachineInstance: any, proposalInstance: any, proposal: any, accountAddress: string): Promise<IRedemptionState> {
  throw Error(`Not ported to the new client lib yet`);
}

async function getProposalRedemptions(proposal: IProposalStateLegacy, state: IRootState): Promise<{ entities: any, redemptions: string[] }> {
  throw Error(`Not ported to the new client lib yet`);
}

export type CreateProposalAction = IAsyncAction<"ARC_CREATE_PROPOSAL", { avatarAddress: string }, any>;

export function createProposal(
  daoAvatarAddress: string,
  title: string,
  description: string,
  nativeTokenReward: BN,
  reputationReward: BN,
  ethReward: BN,
  externalTokenReward: BN,
  beneficiaryAddress: string
): ThunkAction<any, IRootState, null> {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const meta = {
      avatarAddress: daoAvatarAddress,
    };

    try {
      // TODO: the client lib should (and will) provide and set the default account: https://github.com/daostack/client/issues/42
      // const defaultAccount = await Arc.Utils.getDefaultAccount()
      const arc = getArc();
      // arc.web3.eth.defaultAccount = defaultAccount.toLowerCase()

      if (!beneficiaryAddress.startsWith("0x")) { beneficiaryAddress = "0x" + beneficiaryAddress; }
      beneficiaryAddress = beneficiaryAddress.toLowerCase();

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
      const dao = new DAO(daoAvatarAddress, arc);
      const proposalOptions = {
        beneficiary: beneficiaryAddress,
        description,
        nativeTokenReward: nativeTokenReward,
        reputationReward: reputationReward,
        ethReward: ethReward,
        externalTokenReward: externalTokenReward,
        externalTokenAddress: "",
        periodLength: 0, // TODO: check what the default "periodLength" should be here
        periods: 1, // "periodLength 0 requires periods to be 1"
        title,
        url: description
      };

      // TODO: use the Option stages of the client lib to communicate about the progress
      await dao.createProposal(proposalOptions)
        .pipe(take(2)).toPromise();
    } catch (err) {
      console.error(err);
      dispatch({
        type: ActionTypes.ARC_CREATE_PROPOSAL,
        sequence: AsyncActionSequence.Failure,
        meta,
      } as CreateProposalAction);
      throw err;
    }
  };
}

export function executeProposal(avatarAddress: string, proposalId: string) {
  return async (dispatch: Dispatch<any>) => {
    const arc = getArc();
    await arc.dao(avatarAddress).proposal(proposalId).execute().pipe(first()).toPromise();
  };
}

export type VoteAction = IAsyncAction<"ARC_VOTE", {
  avatarAddress: string,
  proposalId: string,
  reputation: number,
  voteOption: ProposalOutcome,
  voterAddress: string,
}, {
    entities: any,
    proposal: any,
    voter: any,
  }>;

export function voteOnProposal(daoAvatarAddress: string, proposalId: string, voteOption: ProposalOutcome) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const arc = getArc();
    const proposalObj = arc.dao(daoAvatarAddress).proposal(proposalId);
    await proposalObj.vote(voteOption).pipe(first()).toPromise();

  //
  //     dispatch({
  //       type: ActionTypes.ARC_VOTE,
  //       sequence: AsyncActionSequence.Pending,
  //       meta,
  //     } as VoteAction);
  //
  //     await votingMachineInstance.vote({
  //       proposalId,
  //       vote: voteOption,
  //     });
  //
  //   } catch (err) {
  //     console.error(err);
  //     dispatch({
  //       type: ActionTypes.ARC_VOTE,
  //       sequence: AsyncActionSequence.Failure,
  //       meta,
  //     } as VoteAction);
  //   }
  };
}

export type StakeAction = IAsyncAction<"ARC_STAKE", {
  avatarAddress: string,
  proposalId: string,
  prediction: ProposalOutcome,
  stakeAmount: number,
  stakerAddress: string,
}, {
    dao: any,
    proposal: any,
  }>;

export function stakeProposal(daoAvatarAddress: string, proposalId: string, prediction: number, stakeAmount: number) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const arc = getArc();
    const proposalObj = arc.dao(daoAvatarAddress).proposal(proposalId);
    await proposalObj.stake(prediction, Util.toWei(stakeAmount)).pipe(first()).toPromise();
    // const web3: Web3 = await Arc.Utils.getWeb3();
    // const currentAccountAddress: string = getState().web3.ethAccountAddress;
    // const proposal: IProposalStateLegacy = getState().arc.proposals[proposalId];
    //
    // const meta = {
    //   avatarAddress: daoAvatarAddress,
    //   proposalId,
    //   stakeAmount,
    //   prediction,
    //   stakerAddress: currentAccountAddress,
    // };
    //
    // // We currently requires already pre-approving a bunch of GENs to stake with, so we don't do the approve call again
    // Arc.ConfigService.set("autoApproveTokenTransfers", false);
    //
    // try {
    //   const daoInstance = await Arc.DAO.at(daoAvatarAddress);
    //   const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
    //   const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(daoAvatarAddress)).votingMachineAddress;
    //   const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);
    //
    //   const votingMachineParamsHash = await
    //     (await contributionRewardInstance.getSchemeParameters(daoInstance.avatar.address)).voteParametersHash;
    //
    //   const votingMachineParams = await votingMachineInstance.getParameters(votingMachineParamsHash);
    //
    //   const minimumStakingFee = votingMachineParams.minimumStakingFee;
    //
    //   const amount = new BigNumber(Util.toWei(stakeAmount));
    //   if (amount.lt(minimumStakingFee)) { throw new Error(`Staked less than the minimum: ${Util.fromWei(minimumStakingFee)}!`); }
    //
    //   dispatch({
    //     type: ActionTypes.ARC_STAKE,
    //     sequence: AsyncActionSequence.Pending,
    //     meta,
    //   } as StakeAction);
    //
    //   await votingMachineInstance.stake({
    //     proposalId,
    //     vote: prediction,
    //     amount,
    //   });
    // } catch (err) {
    //   console.error(err);
    //   dispatch({
    //     type: ActionTypes.ARC_STAKE,
    //     sequence: AsyncActionSequence.Failure,
    //     meta,
    //   } as StakeAction);
    // }
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
    throw Error(`Still needs tob e ported to client library`);
    // const redemption = getState().arc.redemptions[`${proposal.proposalId}-${accountAddress}`];
    // const dao = getState().arc.daos[daoAvatarAddress];
    // const web3: Web3 = await Arc.Utils.getWeb3();
    //
    // const meta = {
    //   avatarAddress: daoAvatarAddress,
    //   proposalId: proposal.proposalId,
    //   accountAddress,
    // };
    //
    // dispatch({
    //   type: ActionTypes.ARC_REDEEM,
    //   sequence: AsyncActionSequence.Pending,
    //   meta,
    // } as RedeemAction);
    //
    // try {
    //   const redeemerInstance = await Arc.RedeemerFactory.deployed();
    //   await redeemerInstance.redeem({ avatarAddress: daoAvatarAddress, beneficiaryAddress: accountAddress, proposalId: proposal.proposalId });
    //
    //   // Get all the latest info about redemptions for the success event
    //   const daoInstance = await Arc.DAO.at(daoAvatarAddress);
    //   const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
    //   const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(daoAvatarAddress)).votingMachineAddress;
    //   const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);
    //
    //   const proposalDetails = await contributionRewardInstance.getProposal(daoAvatarAddress, proposal.proposalId);
    //   const beneficiaryAddress = proposalDetails.beneficiaryAddress;
    //
    //   const beneficiaryRedemptions = await getRedemptions(votingMachineInstance, contributionRewardInstance, proposal, beneficiaryAddress);
    //
    //   proposal.state = Number(await votingMachineInstance.getState({ proposalId: proposal.proposalId }));
    //   proposal.state = checkProposalExpired(proposal);
    //
    //   const payload: any = {
    //     // Update account of the beneficiary
    //     beneficiary: {
    //       tokens: Util.fromWei(await daoInstance.token.getBalanceOf(beneficiaryAddress)),
    //       reputation: Util.fromWei(await daoInstance.reputation.getBalanceOf(beneficiaryAddress)),
    //     },
    //     // Update DAO total reputation and tokens
    //     //   XXX: this doesn't work with MetaMask and ganache right now, there is some weird caching going on
    //     dao: {
    //       reputationCount: Util.fromWei(await daoInstance.reputation.contract.totalSupply()), // TODO: replace with wrapper function when available.
    //       tokenCount: Util.fromWei(await daoInstance.token.getTotalSupply()),
    //     },
    //     proposal: {
    //       proposer: proposal.proposer,
    //       state: proposal.state,
    //     },
    //     beneficiaryRedemptions,
    //   };
    //
    //   if (accountAddress !== beneficiaryAddress) {
    //     payload.currentAccount = {
    //       address: accountAddress,
    //       reputation: Util.fromWei(await daoInstance.reputation.getBalanceOf(accountAddress)),
    //       tokens: Util.fromWei(await daoInstance.token.getBalanceOf(accountAddress)),
    //     };
    //     const currentAccountRedemptions = await getRedemptions(votingMachineInstance, contributionRewardInstance, proposal, accountAddress);
    //     payload.currentAccountRedemptions = currentAccountRedemptions;
    //   }
    //
    //   dispatch({
    //     type: ActionTypes.ARC_REDEEM,
    //     sequence: AsyncActionSequence.Success,
    //     meta,
    //     payload,
    //   } as RedeemAction);
    //
    // } catch (err) {
    //   console.error(err);
    //   dispatch({
    //     type: ActionTypes.ARC_REDEEM,
    //     sequence: AsyncActionSequence.Failure,
    //     meta,
    //   } as RedeemAction);
    // }
  };
}
