import * as Redux from "redux";

import { IRootState } from "reducers";
import { ActionTypes } from "reducers/uiReducer";

export function showMenu() {
  return (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    dispatch({ type: ActionTypes.SHOW_MENU });
  };
}

export function hideMenu() {
  return (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    dispatch({ type: ActionTypes.HIDE_MENU });
  };
}

export function toggleMenu() {
  return (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    dispatch({ type: _getState().ui.menuOpen? ActionTypes.HIDE_MENU: ActionTypes.SHOW_MENU });
  };
}
