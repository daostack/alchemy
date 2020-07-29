import { ISimpleMessagePopupProps } from "components/Shared/SimpleMessagePopup";

export enum ActionTypes {
  SHOW_TOUR = "SHOW_TOUR",
  HIDE_TOUR = "HIDE_TOUR",
  SHOW_MENU = "SHOW_MENU",
  HIDE_MENU = "HIDE_MENU",
  SHOW_SIMPLE_MESSAGE = "SHOW_SIMPLE_MESSAGE",
  HIDE_SIMPLE_MESSAGE = "HIDE_SIMPLE_MESSAGE",
  ENABLE_TRAINING_TOOLTIPS_ON_HOVER = "ENABLE_TRAINING_TOOLTIPS_ON_HOVER",
  DISABLE_TRAINING_TOOLTIPS_ON_HOVER = "DISABLE_TRAINING_TOOLTIPS_ON_HOVER",
  ENABLE_TRAINING_TOOLTIPS_SHOW_ALL = "ENABLE_TRAINING_TOOLTIPS_SHOW_ALL",
  DISABLE_TRAINING_TOOLTIPS_SHOW_ALL = "DISABLE_TRAINING_TOOLTIPS_SHOW_ALL",
}

export interface IUIState {
  menuOpen: boolean;
  simpleMessageOpen: boolean;
  simpleMessageOptions: ISimpleMessagePopupProps;
  tourVisible: boolean;
  trainingTooltipsOnHover: boolean;
  trainingTooltipsShowAll: boolean;
}

const initialState: IUIState = {
  menuOpen: false,
  simpleMessageOpen: false,
  simpleMessageOptions: { body: "" },
  tourVisible: false,
  trainingTooltipsOnHover: true,
  trainingTooltipsShowAll: false,
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const uiReducer = (state = initialState, action: any): any => {
  switch (action.type) {

    case ActionTypes.SHOW_TOUR:
      return { ...state, tourVisible: true };

    case ActionTypes.HIDE_TOUR:
      return { ...state, tourVisible: false };

    case ActionTypes.SHOW_MENU:
      return { ...state, menuOpen: true };

    case ActionTypes.HIDE_MENU:
      return { ...state, menuOpen: false };

    case ActionTypes.SHOW_SIMPLE_MESSAGE:
      return { ...state, simpleMessageOpen: true, simpleMessageOptions: action.options };

    case ActionTypes.HIDE_SIMPLE_MESSAGE:
      return { ...state, simpleMessageOpen: false };

    case ActionTypes.ENABLE_TRAINING_TOOLTIPS_ON_HOVER:
      return { ...state, trainingTooltipsOnHover: true };

    case ActionTypes.DISABLE_TRAINING_TOOLTIPS_ON_HOVER:
      return { ...state, trainingTooltipsOnHover: false };

    case ActionTypes.ENABLE_TRAINING_TOOLTIPS_SHOW_ALL:
      return { ...state, trainingTooltipsShowAll: true };

    case ActionTypes.DISABLE_TRAINING_TOOLTIPS_SHOW_ALL:
      return { ...state, trainingTooltipsShowAll: false };

    default: {
      return state;
    }
  }
};

export default uiReducer;
