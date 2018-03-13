import { Utils } from "@daostack/arc.js";
import * as BigNumber from "bignumber.js";
import promisify = require("es6-promisify");
import * as Redux from "redux";
import * as Web3 from "web3";

import { ActionTypes } from "constants/web3Constants";
import Util from "lib/util";
import { IWeb3State } from "reducers/web3Reducer";

export function initializeWeb3() {
  return async (dispatch: Redux.Dispatch<any>, getState: Function) => {

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

export const changeAccount = (accountAddress: string) => (dispatch: Redux.Dispatch<any>, getState: Function) => {
  return dispatch({
    type: ActionTypes.WEB3_CHANGE_ACCOUNT,
    payload: new Promise((resolve, reject) => {
      const web3 = Utils.getWeb3();

      const payload = {
        ethAccountAddress : accountAddress,
        ethAcountBalance : "0",
      };

      // TODO: this is an awkward place to do this, do it in the reducer?
      web3.eth.defaultAccount = accountAddress;

      // TODO: this is duplicate code as above
      web3.eth.getBalance(accountAddress, (error: Error, res: BigNumber.BigNumber) => {
        if (error) { console.log("error getting balance"); reject("Error getting ether account balance"); }

        payload.ethAcountBalance = Util.fromWei(res).toFixed(2);

        const action = {
          type: ActionTypes.WEB3_CHANGE_ACCOUNT,
          payload,
        };
        return resolve(dispatch(action));
      });
    }),
  });
};
