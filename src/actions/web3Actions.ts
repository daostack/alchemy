import { Utils } from "@daostack/arc.js";
import * as BigNumber from "bignumber.js";
import promisify = require("es6-promisify");
import * as Redux from "redux";
import * as Web3 from "web3";

import { ActionTypes } from "constants/web3Constants";
import Util from "lib/util";
import { IWeb3State } from "reducers/web3Reducer";

export function initializeWeb3() {
  return async (dispatch: Redux.Dispatch<any>, getState: Function): Promise<any> => {

    let web3: Web3;
    try {
      web3 = await Utils.getWeb3();
    } catch (e) {
      // No web3 accessible
      const action = {
        type: ActionTypes.WEB3_CONNECTION_REJECTED,
        action: "Can't connect to web3",
      };
      dispatch(action);
      return;
    }
    if (!web3.isConnected()) {
      const action = {
        type: ActionTypes.WEB3_CONNECTION_REJECTED,
        action: "Can't connect to web3",
      };
      dispatch(action);
      return;
    }

    // TODO: actually check if we are connected to right chain
    // TODO: is this presently needed?
    const getNetwork = promisify(web3.version.getNetwork);
    // await the network
    await getNetwork();

    const payload: IWeb3State = {
      ethAccountAddress: null,
      ethAccountBalance: "",
    };

    try {
      // this throws an exception if default account isn't found
      payload.ethAccountAddress = await Utils.getDefaultAccount();
      const getBalance = promisify(web3.eth.getBalance);
      const balance = await getBalance(payload.ethAccountAddress);
      payload.ethAccountBalance = Util.fromWei(balance).toFixed(2);
    } catch { }

    const action = {
      type: ActionTypes.WEB3_CONNECTED,
      payload,
    };

    dispatch(action);
  };
}

export function changeAccount(accountAddress: string) {
  return async (dispatch: Redux.Dispatch<any>, getState: Function) => {
    const web3 = Utils.getWeb3();

    let payload = {
      ethAccountAddress: accountAddress,
      ethAccountBalance: '0',
    }

    const getBalance = promisify(web3.eth.getBalance);
    const balance = await getBalance(payload.ethAccountAddress);
    payload.ethAccountBalance = Util.fromWei(balance).toFixed(2);

    const action = {
      type: ActionTypes.WEB3_CHANGE_ACCOUNT,
      payload
    };
    dispatch(action);
  };
}
