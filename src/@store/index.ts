import { routerReducer } from "react-router-redux";
import { combineReducers } from "redux";
import { INotificationsState, notificationsReducer } from "@store/notifications/notifications.reducer";
import profilesReducer, { IProfilesState } from "@store/profiles/profilesReducer";
import uiReducer, { IUIState } from "@store/ui/uiReducer";
import web3Reducer, { IWeb3State } from "@store/web3/web3Reducer";

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
