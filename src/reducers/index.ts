import { routerReducer } from "react-router-redux";
import { combineReducers, Reducer } from "redux";

import arcReducer, { IArcState } from "./arcReducer";
import web3Reducer, { IWeb3State } from "./web3Reducer";
import { persistReducer, createTransform } from 'redux-persist';
import storage from "redux-persist/lib/storage";
import { INotificationsState, notificationsReducer } from "./notifications";
import { ITransactionsState, transactionsReducer, TransactionStatus } from "./transactions";

export interface IRootState {
  arc: IArcState;
  web3: IWeb3State;
  router: any;
  notifications: INotificationsState,
  transactions: ITransactionsState,
}

const reducers = {
  arc: arcReducer,
  web3: web3Reducer,
  router: routerReducer,
  notifications: notificationsReducer,
  transactions: transactionsReducer ,
};

/**
 * Only persist pending transactions
 */
const filterPending = createTransform(
  (state, key) => {
    if (key === 'transactions') {
      const out = {...state} as ITransactionsState;
      const keys = Object.keys(out);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i] as any as number;
        if (out[k].error || (out[k].status && out[k].status !== TransactionStatus.Sent)) {
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
  key: 'transactions',
  transforms: [filterPending],
  whitelist: ['transactions'],
  storage,
}, combineReducers(reducers));
