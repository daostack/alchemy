import { routerReducer } from "react-router-redux";
import { combineReducers, Reducer } from "redux";

import arcReducer, { IArcState } from "./arcReducer";
import web3Reducer, { IWeb3State } from "./web3Reducer";
import { IOperationsState, operationsReducer, TransactionStatus, ITransaction } from "./operations";
import { persistReducer, createTransform } from 'redux-persist';
import storage from "redux-persist/lib/storage";

export interface IRootState {
  arc: IArcState;
  web3: IWeb3State;
  router: any;
  operations: IOperationsState
}

const reducers = {
  arc: arcReducer,
  web3: web3Reducer,
  router: routerReducer,
  operations: operationsReducer
};

export default combineReducers(reducers);
