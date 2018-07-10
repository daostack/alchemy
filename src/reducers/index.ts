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

/**
 * Only persist pending notifications
 */
const filterPendingNotifications = createTransform(
  (state, key) => {
    if (key === 'notifications') {
      return (state as INotificationsState)
        .filter((n) => n.status === NotificationStatus.Pending)
    }
    return state
  },
  (raw, key) => raw
)

export default persistReducer({
  key: 'state',
  transforms: [filterPendingNotifications],
  whitelist: ['operations', 'notifications'],
  storage,
}, combineReducers(reducers));
