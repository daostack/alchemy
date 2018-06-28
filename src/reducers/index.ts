import { routerReducer } from "react-router-redux";
import { combineReducers, Reducer } from "redux";

import arcReducer, { IArcState } from "./arcReducer";
import web3Reducer, { IWeb3State } from "./web3Reducer";
import { IOperationsState, operationsReducer } from "./operations";
import { IOperationsState as IOperationsState2, operationsReducer as operationsReducer2, TransactionStatus, ITransaction } from "./operations2";
import { persistReducer, createTransform } from 'redux-persist';
import storage from "redux-persist/lib/storage";

export interface IRootState {
  arc: IArcState;
  operations: IOperationsState;
  web3: IWeb3State;
  router: any;
  operations2: IOperationsState2
}

const reducers = {
  arc: arcReducer,
  operations: operationsReducer,
  web3: web3Reducer,
  router: routerReducer,
  operations2: operationsReducer2
};

export default combineReducers(reducers);
