import { Utils } from "@daostack/arc.js";
import * as BigNumber from "bignumber.js";
import promisify = require("es6-promisify");
import * as Redux from "redux";
import { Web3 } from "web3";

import { ActionTypes } from "constants/web3Constants";
import Util from "lib/util";
import { IWeb3State } from "reducers/web3Reducer";
import { IAsyncAction, AsyncActionSequence } from "./async";

export type ConnectAction = IAsyncAction<'WEB3_CONNECT', void, {
  accounts: string[],
  ethAccountAddress: string,
  ethAccountBalance: number,
  networkId: number;
}>;

export function initializeWeb3() {
  return async (dispatch: Redux.Dispatch<any>, getState: Function): Promise<any> => {
    dispatch({
      type: ActionTypes.WEB3_CONNECT,
      sequence: AsyncActionSequence.Pending,
      operation: {
        message: 'Connecting...',
        totalSteps: 1,
      },
    } as ConnectAction);

    let web3: Web3;

    try {
      web3 = await Utils.getWeb3();
    } catch (e) {
      console.error(e);
      dispatch({
        type: ActionTypes.WEB3_CONNECT,
        sequence: AsyncActionSequence.Failure,
        operation: {
          message: `Failed to connect to web3`
        },
      } as ConnectAction);

      return;
    }

    const getNetwork = promisify(web3.version.getNetwork);
    const networkId = Number(await getNetwork());

    const payload = {
      accounts: web3.eth.accounts,
      ethAccountAddress: null as string,
      ethAccountBalance: 0,
      networkId,
    };

    try {
      payload.ethAccountAddress = await Utils.getDefaultAccount();
    } catch (e) {
      dispatch({
        type: ActionTypes.WEB3_CONNECT,
        sequence: AsyncActionSequence.Success,
        operation: {
          message: `Connected to web3, but no default account selected.`
        },
        payload
      } as ConnectAction);

      return;
    }

    const getBalance = promisify(web3.eth.getBalance);
    payload.ethAccountBalance = Util.fromWei(await getBalance(payload.ethAccountAddress)).toNumber();

    dispatch({
      type: ActionTypes.WEB3_CONNECT,
      sequence: AsyncActionSequence.Success,
      operation: {
        message: 'Connected to web3!'
      },
      payload
    } as ConnectAction);
  };
}

export function changeAccount(accountAddress: string) {
  return async (dispatch: Redux.Dispatch<any>, getState: Function) => {
    const web3 = await Utils.getWeb3();

    let payload = {
      ethAccountAddress: accountAddress,
      ethAccountBalance: 0,
    }

    const getBalance = promisify(web3.eth.getBalance);
    const balance = await getBalance(payload.ethAccountAddress);
    payload.ethAccountBalance = Util.fromWei(balance).toNumber();

    const action = {
      type: ActionTypes.WEB3_CHANGE_ACCOUNT,
      payload
    };
    dispatch(action);
  };
}
