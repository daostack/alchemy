import { DAO, IProposalOutcome, ITransactionState, ITransactionUpdate } from "@daostack/client";
import { AsyncActionSequence, IAsyncAction } from "actions/async";
import { getArc } from "arc";
import BN = require("bn.js");
import Util from "lib/util";
import { push } from "react-router-redux";
import {
  ActionTypes,
  IRedemptionState,
} from "reducers/arcReducer";
import { IRootState } from "reducers/index";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { Dispatch } from "redux";
import * as Redux from "redux";
import { ThunkAction } from "redux-thunk";

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
      const observer = operationNotifierObserver(dispatch, "Create proposal");
      // @ts-ignore
      await dao.createProposal(proposalOptions).subscribe(...observer);

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
    const observer = operationNotifierObserver(dispatch, "Execute proposal");
    // @ts-ignore
    await arc.dao(avatarAddress).proposal(proposalId).execute().subscribe(...observer);
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
    const observer = operationNotifierObserver(dispatch, "Vote");
    // @ts-ignore
    await proposalObj.vote(voteOption).subscribe(...observer);
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
  return async (dispatch: Redux.Dispatch<any>, ) => {
    const arc = getArc();
    const proposalObj = arc.dao(daoAvatarAddress).proposal(proposalId);
    const observer = operationNotifierObserver(dispatch, "Stake");
    // @ts-ignore
    await proposalObj.stake(prediction, Util.toWei(stakeAmount)).subscribe(...observer);
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
  return async (dispatch: Redux.Dispatch<any>) => {
    const arc = getArc();
    const proposalObj = arc.dao(daoAvatarAddress).proposal(proposalId);
    const observer = operationNotifierObserver(dispatch, "Reward");
    // @ts-ignore
    await proposalObj.claimRewards(accountAddress).subscribe(...observer);
  };
}

/** use like this (unfortunatly you need the @ts-ignore)
 * // @ts-ignore
 * transaction.send().observer(...operationNotifierObserver(dispatch, "Whatever"))
 */
const operationNotifierObserver = (dispatch: Redux.Dispatch<any>, txDescription: string = "") => {

  return [
    (update: ITransactionUpdate<any>) => {
      let msg: string;
      if (update.state === ITransactionState.Sent) {
        msg = `${txDescription} transaction sent!`;
        dispatch(showNotification(NotificationStatus.Success, msg));
      } else if (update.confirmations === 0) {
        msg = `${txDescription} transaction processed succesfully`;
        dispatch(showNotification(NotificationStatus.Success, msg));
      } else if (update.confirmations === 3) {
        msg = `${txDescription} transaction confirmed`;
        dispatch(showNotification(NotificationStatus.Success, msg));
      }
    },
    (err: Error) => {
      let msg: string;
      msg = `${txDescription}: transaction failed :-(`;
      dispatch(showNotification(NotificationStatus.Failure, msg));
    }
  ];
};
