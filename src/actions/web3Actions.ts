import { Utils } from "@daostack/arc.js";
import * as BigNumber from "bignumber.js";
import promisify = require("es6-promisify");
import * as Redux from "redux";
import * as Web3 from "web3";

import { ActionTypes } from "constants/web3Constants";
import Util from "lib/util";
import { IWeb3State } from "reducers/web3Reducer";
import { IAsyncAction, AsyncActionSequence } from "./async";

export type ConnectAction = IAsyncAction<'WEB3_CONNECT', void, {
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
    try {
      const web3: Web3 = await Utils.getWeb3();

      if (!web3.isConnected()) {
        throw new Error('Could not connect to web3');
      }

      const ethAccountAddress = await Utils.getDefaultAccount();

      const getBalance = promisify(web3.eth.getBalance);
      const ethAccountBalance = Util.fromWei(await getBalance(ethAccountAddress)).toNumber();

      const getNetwork = promisify(web3.version.getNetwork);
      const networkId = Number(await getNetwork());

      const payload = {
        ethAccountAddress,
        ethAccountBalance,
        networkId,
      };

      dispatch({
        type: ActionTypes.WEB3_CONNECT,
        sequence: AsyncActionSequence.Success,
        operation: {
          message: 'Connected to web3!'
        },
        payload
      } as ConnectAction);

    } catch (e) {
      console.error(e);
      dispatch({
        type: ActionTypes.WEB3_CONNECT,
        sequence: AsyncActionSequence.Failure,
        operation: {
          message: `Failed to connect to web3`
        },
      } as ConnectAction);
    }
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
