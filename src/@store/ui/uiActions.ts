import * as Redux from "redux";

import { IRootState } from "@store/index";
import { ActionTypes } from "@store/ui/uiReducer";
import { ISimpleMessagePopupProps } from "components/Shared/SimpleMessagePopup";

export function showTour() {
  return (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    dispatch({ type: ActionTypes.SHOW_TOUR });
  };
}

export function hideTour() {
  return (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    dispatch({ type: ActionTypes.HIDE_TOUR });
  };
}

export function showMenu() {
  return (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    dispatch({ type: ActionTypes.SHOW_MENU });
  };
}

export function showSimpleMessage(options: ISimpleMessagePopupProps) {
  return (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    dispatch({ type: ActionTypes.SHOW_SIMPLE_MESSAGE, options });
  };
}

export function hideSimpleMessage() {
  return (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    dispatch({ type: ActionTypes.HIDE_SIMPLE_MESSAGE });
  };
}

export function hideMenu() {
  return (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    dispatch({ type: ActionTypes.HIDE_MENU });
  };
}

export function toggleMenu() {
  return (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    dispatch({ type: _getState().ui.menuOpen ? ActionTypes.HIDE_MENU : ActionTypes.SHOW_MENU });
  };
}
