import BN = require("bn.js");
import * as Redux from "redux";
import { first } from "rxjs/operators";

import { getProfile } from "actions/profilesActions";
import { getArc } from "arc";
import Util from "lib/util";
import { IRootState } from "reducers";
import { ActionTypes, IWeb3State } from "reducers/web3Reducer";
import { AsyncActionSequence, IAsyncAction } from "./async";

export type ConnectAction = IAsyncAction<"WEB3_CONNECT", void, IWeb3State>;

export function setCurrentAccountAddress(accountAddress: string) {
  return async (dispatch: Redux.Dispatch<any>, getState: Function) => {
    const payload = {
      ethAccountAddress: accountAddress
    };
    const action = {
      type: ActionTypes.WEB3_SET_ACCOUNT,
      payload
    };
    dispatch(action);
  };
}

export function setCurrentAccount(accountAddress: string) {
  return async (dispatch: Redux.Dispatch<any>, getState: Function) => {
    const payload = {
      currentAccountGenBalance: new BN(0),
      currentAccountGenStakingAllowance: new BN(0),
      ethAccountAddress: accountAddress,
      currentAccountEthBalance: new BN(0),
      currentAccountExternalTokenBalance: new BN(0)
    };

    let action;

    // reset the current account to default values
    action = {
      type: ActionTypes.WEB3_SET_ACCOUNT,
      payload
    };
    dispatch(action);

    // if the accountAddress is undefined, we are done
    if (accountAddress === undefined) {
      return;
    }

    const arc = getArc();
    const balance = await Util.getBalance(accountAddress);
    payload.currentAccountEthBalance = balance;

    const stakingToken = arc.GENToken();
    payload.currentAccountGenBalance = await stakingToken.balanceOf(accountAddress).pipe(first()).toPromise();

    const allowance = await arc.allowance(accountAddress).pipe(first()).toPromise();
    if (allowance) {
      payload.currentAccountGenStakingAllowance = allowance.amount;
    } else {
      payload.currentAccountGenStakingAllowance = new BN(0);
    }

    dispatch(getProfile(accountAddress));

    action = {
      type: ActionTypes.WEB3_SET_ACCOUNT,
      payload
    };
    dispatch(action);
  };
}

export function onEthBalanceChanged(balance: BN) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const ethBalance = getState().web3.currentAccountEthBalance;
    if (!ethBalance.eq(balance)) {
      dispatch({
        type: ActionTypes.WEB3_ON_ETH_BALANCE_CHANGE,
        payload: balance
      });
    }
  };
}

export function onGenBalanceChanged(balance: BN) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const genBalance = getState().web3.currentAccountGenBalance;
    if (!genBalance.eq(balance)) {
      dispatch({
        type: ActionTypes.WEB3_ON_GEN_BALANCE_CHANGE,
        payload: balance
      });
    }
  };
}

export function onExternalTokenBalanceChanged(balance: BN) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const currentBalance = getState().web3.currentAccountExternalTokenBalance;
    if (!currentBalance.eq(balance)) {
      dispatch({
        type: ActionTypes.WEB3_ON_EXTERNAL_TOKEN_BALANCE_CHANGE,
        payload: balance
      });
    }
  };
}

export function onGenStakingAllowanceChanged(balance: BN) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
  const genAllowance = getState().web3.currentAccountGenStakingAllowance;
  if (!genAllowance.eq(balance)) {
      dispatch({
        type: ActionTypes.WEB3_ON_GEN_STAKING_ALLOWANCE_CHANGE,
        payload: balance
      });
    }
  };
}

export type ApproveAction = IAsyncAction<ActionTypes.APPROVE_STAKING_GENS, {
  accountAddress: string
}, {
  numTokensApproved: number
}>;

// Approve transfer of 100000 GENs from accountAddress to the GenesisProtocol contract for use in staking
export function approveStakingGens(daoAvatarAddress: string) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const arc = getArc();
    const currentAccountAddress: string = getState().web3.ethAccountAddress;

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
      await arc.approveForStaking(Util.toWei(100000)).send();
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

// GEN transfer approval confirmed
export function onApprovedStakingGens(numTokensApproved: number) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const currentAccountAddress: string = getState().web3.ethAccountAddress;

    const meta = { accountAddress: currentAccountAddress };
    const payload = { numTokensApproved };

    dispatch({
      type: ActionTypes.APPROVE_STAKING_GENS,
      sequence: AsyncActionSequence.Success,
      operation: {
        message: `Approving tokens for staking succeeded!`,
      },
      meta,
      payload
    } as ApproveAction);
  };
}
