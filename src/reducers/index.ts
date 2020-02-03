import { routerReducer } from "react-router-redux";
import { combineReducers } from "redux";
import { INotificationsState, notificationsReducer } from "./notifications";
import profilesReducer, { IProfilesState } from "./profilesReducer";
import uiReducer, { IUIState } from "./uiReducer";
import web3Reducer, { IWeb3State } from "./web3Reducer";

export interface IRootState {
  notifications: INotificationsState;
  profiles: IProfilesState;
  router: any;
  ui: IUIState;
  web3: IWeb3State;
}

const reducers = {
  notifications: notificationsReducer,
  profiles: profilesReducer,
  router: routerReducer,
  ui: uiReducer,
  web3: web3Reducer,
};


export default combineReducers(reducers);
