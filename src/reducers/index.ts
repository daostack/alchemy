import { routerReducer } from "react-router-redux";
import { combineReducers, Reducer } from "redux";

import arcReducer, { IArcState } from "./arcReducer";
import web3Reducer, { IWeb3State } from "./web3Reducer";
import { persistReducer, createTransform } from 'redux-persist';
import storage from "redux-persist/lib/storage";
import { INotificationsState, notificationsReducer } from "./notifications";
import { IOperationsState, operationsReducer, OperationStatus } from "./operations";

export interface IRootState {
  arc: IArcState;
  web3: IWeb3State;
  router: any;
  notifications: INotificationsState,
  transactions: IOperationsState,
}

const reducers = {
  arc: arcReducer,
  web3: web3Reducer,
  router: routerReducer,
  notifications: notificationsReducer,
  operations: operationsReducer ,
};

/**
 * Only persist pending transactions
 */
const filterPending = createTransform(
  (state, key) => {
    if (key === 'operations') {
      const out = {...state} as IOperationsState;
      const keys = Object.keys(out);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i] as any as number;
        if (out[k].error || (out[k].status && out[k].status !== OperationStatus.Sent)) {
          delete out[k];
        }
      }
      return out;
    }
    return state
  },
  (raw, key) => raw
)

export default persistReducer({
  key: 'operations',
  transforms: [filterPending],
  whitelist: ['operations'],
  storage,
}, combineReducers(reducers));
