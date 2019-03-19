import { DAO, IProposalOutcome, ITransactionState, ITransactionUpdate } from "@daostack/client";
import { AsyncActionSequence, IAsyncAction } from "actions/async";
import { getArc } from "arc";
import BN = require("bn.js");
import Util from "lib/util";
import { push } from "react-router-redux";
import {
  ActionTypes,
  anyRedemptions,
  IAccountState,
  IProposalState as IProposalStateLegacy,
  IRedemptionState,
  IStakeState,
  IVoteState,
  newAccount,
  ProposalStates,
  RewardType,
  VoteOptions,
} from "reducers/arcReducer";
import { IRootState } from "reducers/index";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { Dispatch } from "redux";
import * as Redux from "redux";
import { ThunkAction } from "redux-thunk";
import { first, take } from "rxjs/operators";
import * as schemas from "schemas";
import Web3 = require("web3");

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
  url: string,
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
      const arc = getArc();

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

      const dao = new DAO(daoAvatarAddress, arc);
      const proposalOptions = {
        beneficiary: beneficiaryAddress,
        description,
        nativeTokenReward,
        reputationReward,
        ethReward,
        externalTokenReward,
        externalTokenAddress: "",
        periodLength: 0, // TODO: check what the default "periodLength" should be here
        periods: 1, // "periodLength 0 requires periods to be 1"
        title,
        url
      };

      // TODO: use the Option stages of the client lib to communicate about the progress
      await dao.createProposal(proposalOptions).subscribe((update: ITransactionUpdate<any>) => {
        let msg: string;
        if (update.state === ITransactionState.Sent) {
          msg = `Create proposal transaction sent!`;
        } else {
          msg = `Create proposal transaction processed succesfully (with ${update.confirmations} confirmation)`;
        }
        dispatch(showNotification(NotificationStatus.Success, msg));
      });

      // Go back to home page while action create proposal operation gets carried out
      dispatch(push("/dao/" + daoAvatarAddress));
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
    // TODO: the subscription should defined in a separate contant so it can be reuse
    await arc.dao(avatarAddress).proposal(proposalId).execute()
      .subscribe((update: ITransactionUpdate<any>) => {
        let msg: string;
        if (update.state === ITransactionState.Sent) {
          msg = `Execute transaction sent!`;
        } else {
          msg = `Execute transaction processed succesfully (with ${update.confirmations} confirmation)`;
        }
        dispatch(showNotification(NotificationStatus.Success, msg));
      });
  };
}

export type VoteAction = IAsyncAction<"ARC_VOTE", {
  avatarAddress: string,
  proposalId: string,
  reputation: number,
  voteOption: IProposalOutcome,
  voterAddress: string,
}, {
    entities: any,
    proposal: any,
    voter: any,
  }>;

export function voteOnProposal(daoAvatarAddress: string, proposalId: string, voteOption: IProposalOutcome) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const arc = getArc();
    const proposalObj = arc.dao(daoAvatarAddress).proposal(proposalId);
    //await proposalObj.vote(voteOption).pipe(first()).toPromise();
    await proposalObj.vote(voteOption).subscribe((update: ITransactionUpdate<any>) => {
        let msg: string;
        if (update.state === ITransactionState.Sent) {
          msg = `Vote transaction sent!`;
        } else {
          msg = `Vote transaction processed succesfully (with ${update.confirmations} confirmation)`;
        }
        dispatch(showNotification(NotificationStatus.Success, msg));
      });
  };
}

export type StakeAction = IAsyncAction<"ARC_STAKE", {
  avatarAddress: string,
  proposalId: string,
  prediction: IProposalOutcome,
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
    await proposalObj.stake(prediction, Util.toWei(stakeAmount)).subscribe((update: ITransactionUpdate<any>) => {
        let msg: string;
        if (update.state === ITransactionState.Sent) {
          msg = `Stake transaction sent!`;
        } else {
          msg = `Stake transaction processed succesfully (with ${update.confirmations} confirmation)`;
        }
        dispatch(showNotification(NotificationStatus.Success, msg));
      });
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

export function redeemProposal(daoAvatarAddress: string, proposalId: string, accountAddress: string) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const arc = getArc();
    const proposalObj = arc.dao(daoAvatarAddress).proposal(proposalId);
    await proposalObj.claimRewards(accountAddress).subscribe((update: ITransactionUpdate<any>) => {
        let msg: string;
        if (update.state === ITransactionState.Sent) {
          msg = `Redeem transaction sent!`;
        } else {
          msg = `Redeem transaction processed succesfully (with ${update.confirmations} confirmation)`;
        }
        dispatch(showNotification(NotificationStatus.Success, msg));
      });
  };
}
