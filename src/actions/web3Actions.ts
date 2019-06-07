import { Address } from "@daostack/client";
import * as Sentry from "@sentry/browser";
import { getProfile } from "actions/profilesActions";
import { getArc } from "arc";
import Util from "lib/util";
import { IRootState } from "reducers";
import { ActionTypes, ConnectionStatus, IWeb3State } from "reducers/web3Reducer";
import * as Redux from "redux";
import { AsyncActionSequence, IAsyncAction } from "./async";

export type ConnectAction = IAsyncAction<"WEB3_CONNECT", void, IWeb3State>;

export function setCurrentAccount(accountAddress: string) {
  return async (dispatch: Redux.Dispatch<any>, getState: Function) => {
    const payload = {
      currentAccountAddress: accountAddress,
      connectionStatus : ConnectionStatus.Connected
    };

    let action;

    action = {
      type: ActionTypes.WEB3_SET_ACCOUNT,
      payload
    };
    dispatch(action);

    if (process.env.NODE_ENV === "PRODUCTION") {
      Sentry.configureScope((scope) => {
        scope.setUser({ id: accountAddress || "" });
      });
    }

    // if the accountAddress is undefined, we are done
    if (accountAddress === undefined) {
      return;
    }

    dispatch(getProfile(accountAddress));
  };
}

export type ApproveAction = IAsyncAction<ActionTypes.APPROVE_STAKING_GENS, {
  accountAddress: string
}, {
  numTokensApproved: number
}>;

// Approve transfer of 100000 GENs from accountAddress to the GenesisProtocol contract for use in staking
export function approveStakingGens(spender: Address) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const arc = getArc();
    const currentAccountAddress: string = getState().web3.currentAccountAddress;

    const meta = { accountAddress: currentAccountAddress };

    dispatch({
      type: ActionTypes.APPROVE_STAKING_GENS,
      sequence: AsyncActionSequence.Pending,
      operation: {
        message: `Approving tokens for staking...`,
        totalSteps: 1
      },
      meta
    } as ApproveAction);

    try {
      await arc.approveForStaking(spender, Util.toWei(100000)).send();
    } catch (err) {
      console.error(err);
      dispatch({
        type: ActionTypes.APPROVE_STAKING_GENS,
        sequence: AsyncActionSequence.Failure,
        meta,
        operation: {
          message: `Approving tokens for staking failed`
        }
      } as ApproveAction);
    }
  };
}
