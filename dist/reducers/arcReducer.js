"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const update = require("immutability-helper");
const ActionTypes = require("constants/arcConstants");
exports.initialState = {
    controllerAddress: null,
    controllerInstance: null,
    daoList: {},
    genesisAddress: null,
    isCorrectChain: false,
    simpleICOAddress: null
};
const arcReducer = (state = exports.initialState, action) => {
    switch (action.type) {
        case ActionTypes.ARC_INITIALIZATION_PENDING: {
            return state;
        }
        case ActionTypes.ARC_INITIALIZATION_FULFILLED: {
            return Object.assign({}, state, action.payload);
        }
        case ActionTypes.ARC_INITIALIZATION_REJECTED: {
            return state;
        }
        case ActionTypes.ARC_GET_DAOS_PENDING: {
            return state;
        }
        case ActionTypes.ARC_GET_DAOS_FULFILLED: {
            return update(state, { daoList: { $set: action.payload } });
        }
        case ActionTypes.ARC_GET_DAOS_REJECTED: {
            return state;
        }
        case ActionTypes.ARC_GET_DAO: {
            return state;
        }
        case ActionTypes.ARC_GET_DAO_PENDING: {
            return state;
        }
        case ActionTypes.ARC_GET_DAO_FULFILLED: {
            // Replace the DAO's state using immutability-helper
            return update(state, { daoList: { [action.payload.avatarAddress]: { $set: action.payload } } });
        }
        case ActionTypes.ARC_GET_DAO_REJECTED: {
            return state;
        }
        case ActionTypes.ARC_CREATE_DAO: {
            return state;
        }
        case ActionTypes.ARC_CREATE_DAO_PENDING: {
            return state;
        }
        case ActionTypes.ARC_CREATE_DAO_FULFILLED: {
            // Add the new DAO to the state using immutability-helper
            return update(state, { daoList: { [action.payload.avatarAddress]: { $set: action.payload } } });
        }
        case ActionTypes.ARC_CREATE_DAO_REJECTED: {
            return state;
        }
        case ActionTypes.ARC_CREATE_PROPOSITION: {
            return state;
        }
        case ActionTypes.ARC_CREATE_PROPOSITION_PENDING: {
            return state;
        }
        case ActionTypes.ARC_CREATE_PROPOSITION_FULFILLED: {
            // Add the new proposal to the DAO's state using immutability-helper
            return update(state, { daoList: { [action.payload.orgAvatarAddress]: { proposals: { [action.payload.proposalId]: { $set: action.payload } } } } });
        }
        case ActionTypes.ARC_CREATE_PROPOSITION_REJECTED: {
            return state;
        }
        case ActionTypes.ARC_VOTE_FULFILLED: {
            // Update the proposal state
            return update(state, { daoList: { [action.payload.orgAvatarAddress]: { proposals: { [action.payload.proposalId]: { $merge: action.payload } } } } });
        }
        case ActionTypes.ARC_VOTE_REJECTED: {
            return state;
        }
        default: {
            return state;
        }
    }
};
exports.default = arcReducer;
//# sourceMappingURL=arcReducer.js.map