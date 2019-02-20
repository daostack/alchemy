import * as Redux from "redux";

import { IRootState } from "reducers";
import { ActionTypes } from "reducers/uiReducer";

export function showTour() {
  return (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    dispatch({ type: ActionTypes.SHOW_TOUR });
  };
}

export function hideTour() {
  return (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    dispatch({ type: ActionTypes.HIDE_TOUR });
  };
}
