"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Web3 = require("web3");
const web3Constants_1 = require("constants/web3Constants");
exports.initializeWeb3 = () => (dispatch) => {
    let payload = {
        ethAccountAddress: null,
        ethAccountBalance: "",
        hasProvider: false,
        instance: null,
        isConnected: true,
    };
    return new Promise(function (resolve, reject) {
        // TODO: poll/watch for changes to network/account
        if (typeof window.web3 !== 'undefined') {
            // web3 injected by MetaMask
            payload.instance = new Web3(window.web3.currentProvider);
            payload.hasProvider = true;
        }
        else {
            // fallback to localhost
            //let web3Location = `http://${truffleConfig.rpc.host}:${truffleConfig.rpc.port}`
            var provider = new Web3.providers.HttpProvider('http://localhost:8545');
            payload.instance = new Web3(provider);
            window.web3 = payload.instance;
        }
        payload.ethAccountAddress = payload.instance.eth.accounts[0];
        // TODO: this is an awkward place to do this, do it in the reducer?
        payload.instance.eth.defaultAccount = payload.ethAccountAddress;
        payload.instance.eth.getBalance(payload.ethAccountAddress, (error, res) => {
            if (error) {
                console.log("error getting balance");
                reject("Error getting ether account balance");
            }
            payload.ethAccountBalance = Number(payload.instance.fromWei(res, "ether")).toFixed(2);
            const action = {
                type: web3Constants_1.ActionTypes.WEB3_CONNECTED,
                payload: payload
            };
            return 1; //resolve(dispatch(action));
        });
    });
};
exports.changeAccount = (accountAddress) => (dispatch, getState) => {
    return dispatch({
        type: web3Constants_1.ActionTypes.WEB3_CHANGE_ACCOUNT,
        payload: new Promise((resolve, reject) => {
            const web3 = getState().web3.instance;
            let payload = {
                ethAccountAddress: accountAddress,
                ethAcountBalance: '0'
            };
            // TODO: this is an awkward place to do this, do it in the reducer?
            web3.eth.defaultAccount = accountAddress;
            // TODO: this is duplicate code as above
            web3.eth.getBalance(accountAddress, (error, res) => {
                if (error) {
                    console.log("error getting balance");
                    reject("Error getting ether account balance");
                }
                payload.ethAcountBalance = Number(web3.fromWei(res, "ether")).toFixed(2);
                const action = {
                    type: web3Constants_1.ActionTypes.WEB3_CHANGE_ACCOUNT,
                    payload: payload
                };
                return resolve(dispatch(action));
            });
        })
    });
};
//# sourceMappingURL=web3Actions.js.map