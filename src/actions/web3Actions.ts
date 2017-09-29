import * as BigNumber from 'bignumber.js';
import * as Web3 from 'web3';

import { IWeb3State } from 'reducers/web3Reducer'

export const WEB3_CONNECTED = 'WEB3_CONNECTED';

declare global {
  interface Window {
    web3: Web3
  }
}

export const initializeWeb3 = () => (dispatch : any) => {
  let payload : IWeb3State = {
    ethAccountAddress: <string> null,
    ethAccountBalance: "",
    hasProvider: false,
    instance: <Web3> null,
    isConnected: true,
  };

  return new Promise(function(resolve, reject) {
     // TODO: poll/watch for changes to network/account

    if (typeof window.web3 !== 'undefined') {
      // web3 injected by MetaMask
      payload.instance = new Web3(window.web3.currentProvider)
      payload.hasProvider = true;
    } else {
      // fallback to localhost
      //let web3Location = `http://${truffleConfig.rpc.host}:${truffleConfig.rpc.port}`
      var provider = new Web3.providers.HttpProvider('http://localhost:8545');
      payload.instance = new Web3(provider);
      window.web3 = payload.instance;
    }

    payload.ethAccountAddress = payload.instance.eth.accounts[0];
    payload.instance.eth.defaultAccount = payload.ethAccountAddress;

    payload.instance.eth.getBalance(payload.ethAccountAddress, (error : Error, res : BigNumber.BigNumber) => {
      if (error) { console.log("error getting balance"); reject("Error getting ether account balance"); }

      payload.ethAccountBalance = Number(payload.instance.fromWei(res, "ether")).toFixed(2);

      const action = {
        type: WEB3_CONNECTED,
        payload: payload
      }
      return resolve(dispatch(action));
    });
  });
}