import {
  Address,
  DAO,
  IProposalOutcome,
  IProposalBaseCreateOptions,
  ITransactionState,
  ITransactionUpdate,
  ReputationFromTokenPlugin,
  Proposal,
  FundingRequestProposal,
  JoinAndQuitProposal,
  IProposalState,
  TokenTradeProposal,
} from "@daostack/arc.js";
import { IAsyncAction } from "actions/async";
import { getArc } from "arc";
import { toWei } from "lib/util";
import { IRedemptionState } from "lib/proposalHelpers";
import { IRootState } from "reducers/index";
import { NotificationStatus, showNotification } from "reducers/notifications";
import * as Redux from "redux";
import { ThunkAction } from "redux-thunk";
import { Wallet } from "ethers";

export type CreateProposalAction = IAsyncAction<"ARC_CREATE_PROPOSAL", { avatarAddress: string }, any>;

/** use like this (unfortunately you need the @ts-ignore)
 * // @ts-ignore
 * transaction.send().observer(...operationNotifierObserver(dispatch, "Whatever"))
 */
export const operationNotifierObserver = (dispatch: Redux.Dispatch<any, any>, txDescription = ""): [(update: ITransactionUpdate<any>) => void, (err: Error) => void] => {
  return [
    (update: ITransactionUpdate<any>) => {
      let msg: string;
      if (update.state === ITransactionState.Sent) {
        msg = `${txDescription} transaction sent! Please wait for it to be processed`;
        dispatch(showNotification(NotificationStatus.Success, msg));
      } else if (update.confirmations === 0) {
        msg = `${txDescription} transaction processed successfully`;
        dispatch(showNotification(NotificationStatus.Success, msg));
      } else if (update.confirmations === 3) {
        msg = `${txDescription} transaction confirmed`;
        dispatch(showNotification(NotificationStatus.Success, msg));
      }
    },
    (err: Error) => {
      const msg = `${txDescription}: transaction failed :-( - ${err.message}`;
      // eslint-disable-next-line no-console
      console.warn(msg);
      dispatch(showNotification(NotificationStatus.Failure, msg));
    },
  ];
};

export function createProposal(proposalOptions: IProposalBaseCreateOptions): ThunkAction<any, IRootState, null> {
  return async (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    try {
      const arc = getArc();

      const dao = new DAO(arc, proposalOptions.dao);

      const observer = operationNotifierObserver(dispatch, "Create proposal");
      await (await dao.createProposal(proposalOptions)).subscribe(...observer);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      throw err;
    }
  };
}

async function tryRedeemProposal(proposalId: string, accountAddress: string, observer: any) {
  const arc = getArc();
  const proposal = await Proposal.create(arc, proposalId);

  switch (proposal.coreState.name) {
    case "GenericScheme":
    case "ContributionReward":
    case "Competition":
    case "ContributionRewardExt":
    case "SchemeRegistrarRemove":
    case "SchemeRegistrarAdd":
    case "SchemeRegistrar":
    case "SchemeFactory":
      await (proposal as Proposal<IProposalState>).redeemRewards(
        accountAddress
      ).subscribe(...observer);
      break;
    case "FundingRequest":
      await (proposal as FundingRequestProposal).redeem().subscribe(...observer);
      break;
    case "JoinAndQuit":
      await (proposal as JoinAndQuitProposal).redeem().subscribe(...observer);
      break;
    case "TokenTrade":
      await (proposal as TokenTradeProposal).redeem().subscribe(...observer);
      break;
    default:
      break;
  }

  return Promise.resolve();
}

export function executeProposal(avatarAddress: string, proposalId: string, accountAddress: string) {
  return async (dispatch: Redux.Dispatch<any, any>) => {
    const arc = getArc();
    const observer = operationNotifierObserver(dispatch, "Execute proposal");
    const proposalObj = await arc.dao(avatarAddress).proposal({ where: { id: proposalId } });

    // Call redeemRewards to both execute the proposal and redeem the ContributionReward rewards,
    //   pass in null to not redeem any GenesisProtocol rewards
    const originalErrorHandler = observer[1];
    observer[1] = async (_error: any): Promise<any> => {
      observer[1] = originalErrorHandler;
      return await proposalObj.execute().subscribe(...observer);
    };

    return tryRedeemProposal(proposalId, accountAddress, observer);
  };
}

export type VoteAction = IAsyncAction<"ARC_VOTE", {
  avatarAddress: string;
  proposalId: string;
  reputation: number;
  voteOption: IProposalOutcome;
  voterAddress: string;
}, {
  entities: any;
  proposal: any;
  voter: any;
}>;

export function voteOnProposal(daoAvatarAddress: string, proposalId: string, voteOption: IProposalOutcome) {
  return async (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    const arc = getArc();
    const proposalObj = await arc.dao(daoAvatarAddress).proposal({ where: { id: proposalId } });
    const observer = operationNotifierObserver(dispatch, "Vote");
    await proposalObj.vote(voteOption).subscribe(...observer);
  };
}

export type StakeAction = IAsyncAction<"ARC_STAKE", {
  avatarAddress: string;
  proposalId: string;
  prediction: IProposalOutcome;
  stakeAmount: number;
  stakerAddress: string;
}, {
  dao: any;
  proposal: any;
}>;

export function stakeProposal(daoAvatarAddress: string, proposalId: string, prediction: number, stakeAmount: number) {
  return async (dispatch: Redux.Dispatch<any, any>, ) => {
    const arc = getArc();
    const proposalObj = await arc.dao(daoAvatarAddress).proposal({ where: { id: proposalId } });
    const observer = operationNotifierObserver(dispatch, "Stake");
    await proposalObj.stake(prediction, toWei(stakeAmount)).subscribe(...observer);
  };
}

// Approve transfer of 100000 GENs from accountAddress to the GenesisProtocol contract for use in staking
export function approveStakingGens(spender: Address) {
  return async (dispatch: Redux.Dispatch<any, any>, ) => {
    const arc = getArc();
    const observer = operationNotifierObserver(dispatch, "Approve GEN");
    await arc.approveForStaking(spender, toWei(100000)).subscribe(...observer);
  };
}

export type RedeemAction = IAsyncAction<"ARC_REDEEM", {
  avatarAddress: string;
  proposalId: string;
  accountAddress: string;
}, {
  currentAccount: any;
  beneficiary: any;
  dao: any;
  proposal: any;
  beneficiaryRedemptions: IRedemptionState;
  currentAccountRedemptions: IRedemptionState;
}>;

export function redeemProposal(proposalId: string, accountAddress: string) {
  return async (dispatch: Redux.Dispatch<any, any>) => {
    const observer = operationNotifierObserver(dispatch, "Reward");
    return tryRedeemProposal(proposalId, accountAddress, observer);
  };
}

export function redeemReputationFromToken(reputationFromTokenPlugin: ReputationFromTokenPlugin, addressToRedeem: string, privateKey: string|undefined, redeemerAddress: Address|undefined, redemptionSucceededCallback: () => void) {
  return async (dispatch: Redux.Dispatch<any, any>) => {
    const arc = getArc();

    const state = await reputationFromTokenPlugin.fetchState();

    if (privateKey) {
      const contract = arc.getContract(state.address);
      const block = await arc.web3.getBlock("latest");
      const gas = block.gasLimit.toNumber() - 100000;
      const redeemMethod = contract.interface.functions["redeem"].encode([addressToRedeem]);
      let gasPrice = (await arc.web3.getGasPrice()).toNumber();
      gasPrice = gasPrice * 1.2;
      const txToSign = {
        gas,
        gasPrice,
        data: redeemMethod,
        to: state.address,
        value: "0",
      };
      const gasEstimate = (await arc.web3.estimateGas(txToSign)).toNumber();
      txToSign.gas = gasEstimate;
      // if the gas cost is higher then the users balance, we lower it to fit
      const userBalance = (await arc.web3.getBalance(redeemerAddress)).toNumber();
      if (userBalance < gasEstimate * gasPrice) {
        txToSign.gasPrice = Math.floor(userBalance/gasEstimate);
      }
      const wallet = new Wallet(privateKey);
      const signedTransaction = await wallet.sign(txToSign);
      dispatch(showNotification(NotificationStatus.Success, "Sending redeem transaction, please wait for it to be mined"));
      try {
        await arc.web3.sendTransaction(signedTransaction);
        dispatch(showNotification(NotificationStatus.Success, "Transaction was succesful!"));
        redemptionSucceededCallback();
      } catch (err) {
        dispatch(showNotification(NotificationStatus.Failure, `Transaction failed: ${err.message}`));
      }
    } else {
      const observer = operationNotifierObserver(dispatch, "Redeem reputation");

      // send the transaction and get notifications
      if (reputationFromTokenPlugin) {
        reputationFromTokenPlugin.redeem(addressToRedeem).subscribe(observer[0], observer[1], redemptionSucceededCallback);
      }
    }
  };
}
