import * as Redux from "redux";

import { IRootState } from "reducers";
import { ActionTypes } from "reducers/uiReducer";

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

export function enableTrainingTooltipsOnHover() {
  return (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    dispatch({ type: ActionTypes.ENABLE_TRAINING_TOOLTIPS_ON_HOVER });
  };
}

export function disableTrainingTooltipsOnHover() {
  return (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    dispatch({ type: ActionTypes.DISABLE_TRAINING_TOOLTIPS_ON_HOVER });
  };
}

export function toggleTrainingTooltipsOnHover() {
  return (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    dispatch({ type: _getState().ui.trainingTooltipsOnHover? ActionTypes.DISABLE_TRAINING_TOOLTIPS_ON_HOVER: ActionTypes.ENABLE_TRAINING_TOOLTIPS_ON_HOVER });
  };
}

export function enableTrainingTooltipsShowAll() {
  return (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    dispatch({ type: ActionTypes.ENABLE_TRAINING_TOOLTIPS_SHOW_ALL});
  };
}

export function disableTrainingTooltipsShowAll() {
  return (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    dispatch({ type: ActionTypes.DISABLE_TRAINING_TOOLTIPS_SHOW_ALL});
  };
}

export function toggleTrainingTooltipsShowAll() {
  return (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    dispatch({ type: _getState().ui.trainingTooltipsShowAll ? ActionTypes.DISABLE_TRAINING_TOOLTIPS_SHOW_ALL: ActionTypes.ENABLE_TRAINING_TOOLTIPS_SHOW_ALL});
  };
}
