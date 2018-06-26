import { routerReducer } from "react-router-redux";
import { combineReducers, Reducer } from "redux";

import arcReducer, { IArcState } from "./arcReducer";
import uiReducer, { IUIState } from './uiReducer';
import web3Reducer, { IWeb3State } from "./web3Reducer";
import { IOperationsState, operationsReducer } from "./operations";

export interface IRootState {
  arc: IArcState;
  operations: IOperationsState;
  router: any;
  ui: IUIState;
  web3: IWeb3State;
}

const reducers = {
  arc: arcReducer,
  operations: operationsReducer,
  router: routerReducer,
  ui: uiReducer,
  web3: web3Reducer,
};

export default combineReducers(reducers);
