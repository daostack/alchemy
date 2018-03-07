import * as BigNumber from 'bignumber.js';
import { Utils } from '@daostack/arc.js';
import promisify = require('es6-promisify');
import * as Redux from 'redux';
import * as Web3 from 'web3';

import { IWeb3State } from 'reducers/web3Reducer'
import { ActionTypes } from 'constants/web3Constants';

export function initializeWeb3() {
  return async (dispatch: Redux.Dispatch<any>, getState: Function) => {

    let web3 : Web3;
    try {
      web3 = Utils.getWeb3();
    } catch (e) {
      // No web3 in the browser
      const action = {
        type: ActionTypes.WEB3_CONNECTION_REJECTED,
        action: "Can't connect to web3"
      }
      dispatch(action);
      return
    }

    let payload : IWeb3State = {
      ethAccountAddress: null,
      ethAccountBalance: ""
    };

    const getAccounts = promisify(web3.eth.getAccounts);
    const accounts = await getAccounts();

    if (accounts.length > 0) {
      payload.ethAccountAddress = accounts[0];
    }

    // TODO: actually check if we are connected to right chain
    const getNetwork = promisify(web3.version.getNetwork);
    const network = await getNetwork();

    // TODO: the flow of this code is all so ugly
    if (payload.ethAccountAddress !== null) {
      const getBalance = promisify(web3.eth.getBalance);
      const balance = await getBalance(payload.ethAccountAddress);
      payload.ethAccountBalance = Number(web3.fromWei(balance, "ether")).toFixed(2);
    }

    const action = {
      type: ActionTypes.WEB3_CONNECTED,
      payload: payload
    };
    dispatch(action);
  };
}

export const changeAccount = (accountAddress : string) => (dispatch: Redux.Dispatch<any>, getState: Function) => {
  return dispatch({
    type: ActionTypes.WEB3_CHANGE_ACCOUNT,
    payload: new Promise((resolve, reject) => {
      const web3 = Utils.getWeb3();

      let payload = {
        ethAccountAddress : accountAddress,
        ethAcountBalance : '0'
      }

      // TODO: this is an awkward place to do this, do it in the reducer?
      web3.eth.defaultAccount = accountAddress;

      // TODO: this is duplicate code as above
      web3.eth.getBalance(accountAddress, (error : Error, res : BigNumber.BigNumber) => {
        if (error) { console.log("error getting balance"); reject("Error getting ether account balance"); }

        payload.ethAcountBalance = Number(web3.fromWei(res, "ether")).toFixed(2);

        const action = {
          type: ActionTypes.WEB3_CHANGE_ACCOUNT,
          payload: payload
        }
        return resolve(dispatch(action));
      });
    })
  })
}