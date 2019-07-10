import { DAO, IProposalCreateOptions, IProposalOutcome, ITransactionState, ITransactionUpdate } from "@daostack/client";
import { IAsyncAction } from "actions/async";
import { getArc } from "arc";
import { toWei } from "lib/util";
import { IRedemptionState } from "reducers/arcReducer";
import { IRootState } from "reducers/index";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { Dispatch } from "redux";
import * as Redux from "redux";
import { ThunkAction } from "redux-thunk";

export type CreateProposalAction = IAsyncAction<"ARC_CREATE_PROPOSAL", { avatarAddress: string }, any>;

export function createProposal(proposalOptions: IProposalCreateOptions): ThunkAction<any, IRootState, null> {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    try {
      const arc = getArc();

      const dao = new DAO(proposalOptions.dao, arc);

      // TODO: use the Option stages of the client lib to communicate about the progress
      const observer = operationNotifierObserver(dispatch, "Create proposal");
      // @ts-ignore
      await dao.createProposal(proposalOptions).subscribe(...observer);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
}

export function executeProposal(avatarAddress: string, proposalId: string, accountAddress: string) {
  return async (dispatch: Dispatch<any>) => {
    const arc = getArc();
    // TODO: the subscription should defined in a separate contant so it can be reuse
    const observer = operationNotifierObserver(dispatch, "Execute proposal");
    const proposalObj = await arc.dao(avatarAddress).proposal(proposalId);

    // Call claimRewards to both execute the proposal and redeem the ContributionReward rewards,
    //   pass in null to not redeem any GenesisProtocol rewards
    // @ts-ignore
    await proposalObj.claimRewards(null).subscribe(...observer);
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
    const proposalObj = await arc.dao(daoAvatarAddress).proposal(proposalId);
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
    const proposalObj = await arc.dao(daoAvatarAddress).proposal(proposalId);
    const observer = operationNotifierObserver(dispatch, "Stake");
    // @ts-ignore
    await proposalObj.stake(prediction, toWei(stakeAmount)).subscribe(...observer);
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
    const proposalObj = await arc.dao(daoAvatarAddress).proposal(proposalId);
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
        msg = `${txDescription} transaction sent! Please wait for it to be processed`;
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
      console.warn(msg);
      console.warn(err.message);
      dispatch(showNotification(NotificationStatus.Failure, msg));
    }
  ];
};
