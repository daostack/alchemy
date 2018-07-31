import { routerReducer } from "react-router-redux";
import { combineReducers, Reducer } from "redux";

import arcReducer, { IArcState } from "./arcReducer";
import uiReducer, { IUIState } from './uiReducer';
import web3Reducer, { IWeb3State } from "./web3Reducer";
import { persistReducer, createTransform } from 'redux-persist';
import storage from "redux-persist/lib/storage";
import { INotificationsState, notificationsReducer, NotificationStatus } from "./notifications";
import { IOperationsState, operationsReducer, OperationStatus } from "./operations";

export interface IRootState {
  arc: IArcState;
  notifications: INotificationsState,
  operations: IOperationsState,
  router: any;
  ui: IUIState;
  web3: IWeb3State;
}

const reducers = {
  arc: arcReducer,
  notifications: notificationsReducer,
  operations: operationsReducer ,
  router: routerReducer,
  ui: uiReducer,
  web3: web3Reducer,
};

const onlyPending = createTransform(
  (state, key) => {
    if (key === 'operations') {
      const out = {...state} as IOperationsState;

      for (let k in out) {
        if (!(out[k].status === OperationStatus.Sent || out[k].error)) {
          delete out[k];
        }
      }

      return out;
    } else {
      return state;
    }
  },
  (raw, key) => raw
)

export default persistReducer({
  key: 'state',
  transforms: [onlyPending],
  whitelist: ['operations'],
  storage,
}, combineReducers(reducers));
