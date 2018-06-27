import * as Redux from "redux";

import { ActionTypes, IUIState } from "reducers/uiReducer";
import { IRootState } from "reducers";

export function showTour() {
  return (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    dispatch({ type: ActionTypes.SHOW_TOUR });
  }
}

export function hideTour() {
  return (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    dispatch({ type: ActionTypes.HIDE_TOUR });
  }
}
