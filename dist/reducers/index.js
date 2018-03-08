"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_router_redux_1 = require("react-router-redux");
const redux_1 = require("redux");
const arcReducer_1 = require("./arcReducer");
const web3Reducer_1 = require("./web3Reducer");
const reducers = {
    arc: arcReducer_1.default,
    web3: web3Reducer_1.default,
    router: react_router_redux_1.routerReducer
};
exports.default = redux_1.combineReducers(reducers);
//# sourceMappingURL=index.js.map