"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const web3Constants_1 = require("constants/web3Constants");
exports.initialState = {
    ethAccountBalance: "",
    ethAccountAddress: null,
    hasProvider: false,
    isConnected: false,
    instance: null,
};
// TODO: make all action types explicit?
const web3Reducer = (state = exports.initialState, action) => {
    switch (action.type) {
        case web3Constants_1.ActionTypes.WEB3_CONNECTED: {
            return Object.assign({}, state, action.payload);
        }
        // case 'web3/RECEIVE_ACCOUNT':
        //   console.log('received account', action);
        //   return state;
        case web3Constants_1.ActionTypes.WEB3_CHANGE_ACCOUNT:
            return Object.assign({}, state, action.payload);
        default: {
            return state;
        }
    }
};
exports.default = web3Reducer;
//# sourceMappingURL=web3Reducer.js.map