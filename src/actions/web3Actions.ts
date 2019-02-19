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

// TODO: remove this commented function eventually (leaving it for now for reference)
// export function initializeWeb3() {
//   return async (dispatch: Redux.Dispatch<any>, getState: Function): Promise<any> => {
//     dispatch({ll
//       type: ActionTypes.WEB3_CONNECT,
//       sequence: AsyncActionSequence.Pending,
//       operation: {
//         message: "Connecting...",
//         totalSteps: 1,
//       },
//     } as ConnectAction);
//
//     let web3: Web3;
//
//     try {
//       web3 = await Util.getWeb3();
//     } catch (e) {
//       console.error(e);
//       dispatch({
//         type: ActionTypes.WEB3_CONNECT,
//         sequence: AsyncActionSequence.Failure,
//         operation: {
//           message: `Failed to connect to web3`
//         },
//       } as ConnectAction);
//
//       return;
//     }
//
//     const networkId = Number(await Util.getNetworkId());
//     let accounts: string[]
//     try {
//       accounts = web3.eth.accounts
//     } catch (err) {
//       accounts = []
//       console.log(`Error getting web3.eth.accounts: ${err.message}`)
//     }
//     const payload: IWeb3State = {
//       accounts,
//       currentAccountEthBalance: 0,
//       currentAccountExternalTokenBalance: 0,
//       currentAccountGenBalance: 0,
//       currentAccountGenStakingAllowance: 0,
//       ethAccountAddress: null as string,
//       networkId,
//     };
//
//     try {
//       payload.ethAccountAddress = (await Util.defaultAccount()).toLowerCase();
//     } catch (e) {
//       dispatch({
//         type: ActionTypes.WEB3_CONNECT,
//         sequence: AsyncActionSequence.Success,
//         operation: {
//           message: `Connected to web3, but no default account selected.`
//         },
//         payload
//       } as ConnectAction);
//       return;
//     }
//
//     payload.currentAccountEthBalance = Util.fromWei(await Util.getBalance(payload.ethAccountAddress));
//
//     dispatch({
//       type: ActionTypes.WEB3_CONNECT,
//       sequence: AsyncActionSequence.Success,
//       operation: {
//         message: "Connected to web3!"
//       },
//       payload
//     } as ConnectAction);
//   };
// }

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

    action = {
      type: ActionTypes.WEB3_SET_ACCOUNT,
      payload
    };
    dispatch(action);

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
    console.log("got account with paylod", payload);
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
      await arc.approveForStaking(Util.toWei(100000));
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
