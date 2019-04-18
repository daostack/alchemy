import { routerReducer } from "react-router-redux";
import { combineReducers } from "redux";
import { createTransform, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

import arcReducer, { IArcState } from "./arcReducer";
import { INotificationsState, notificationsReducer } from "./notifications";
import { IOperationsState, operationsReducer, OperationStatus } from "./operations";
import profilesReducer, { IProfilesState } from "./profilesReducer";
import uiReducer, { IUIState } from "./uiReducer";
import web3Reducer, { IWeb3State } from "./web3Reducer";

export interface IRootState {
  arc: IArcState;
  notifications: INotificationsState;
  operations: IOperationsState;
  profiles: IProfilesState;
  router: any;
  ui: IUIState;
  web3: IWeb3State;
}

const reducers = {
  arc: arcReducer,
  notifications: notificationsReducer,
  operations: operationsReducer ,
  profiles: profilesReducer,
  router: routerReducer,
  ui: uiReducer,
  web3: web3Reducer
};

const onlyPending = createTransform(
  (state, key) => {
    if (key === "operations") {
      const out = {...state} as IOperationsState;

      for (const k in out) {
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
);

export default persistReducer({
  key: "state",
  transforms: [onlyPending],
  whitelist: ["operations"],
  storage,
}, combineReducers(reducers));
