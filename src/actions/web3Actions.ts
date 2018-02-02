import * as BigNumber from 'bignumber.js';
import { Utils } from 'daostack-arc.js';
import * as Redux from 'redux';
import * as Web3 from 'web3';

import { IWeb3State } from 'reducers/web3Reducer'
import { ActionTypes } from 'constants/web3Constants';

export const initializeWeb3 = () => (dispatch : any) => {
  let payload : IWeb3State = {
    ethAccountAddress: <string> null,
    ethAccountBalance: "",
    hasProvider: false,
    isConnected: true,
  };

  return new Promise(function(resolve, reject) {
     // TODO: poll/watch for changes to network/account

    const web3 = Utils.getWeb3();
    payload.ethAccountAddress = web3.eth.defaultAccount;

    // TODO: seems like there should be more different kinds of error handling here
    web3.version.getNetwork((err : any, currentNetworkId : string) => {
      if (err) {
        reject("Error getting web3 network");
      }
    });

    web3.eth.getBalance(payload.ethAccountAddress, (error : Error, res : BigNumber.BigNumber) => {
      if (error) { reject("Error getting ether account balance"); }

      payload.ethAccountBalance = Number(web3.fromWei(res, "ether")).toFixed(2);

      const action = {
        type: ActionTypes.WEB3_CONNECTED,
        payload: payload
      }
      resolve(dispatch(action));
    });
  });
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