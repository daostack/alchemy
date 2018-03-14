import { routerReducer } from "react-router-redux";
import { combineReducers, Reducer } from "redux";

import arcReducer, { IArcState } from "./arcReducer";
import notificationsReducer, { INotificationsState, notificationsReducer2, NotificationState } from "./notificationsReducer";
import web3Reducer, { IWeb3State } from "./web3Reducer";

export interface IRootState {
  arc: IArcState;
  notifications: NotificationState;
  web3: IWeb3State;
  router: any;
}

const reducers = {
  arc: arcReducer,
  notifications: notificationsReducer2,
  web3: web3Reducer,
  router: routerReducer,
};

export default combineReducers(reducers);
