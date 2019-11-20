export enum ActionTypes {
  SHOW_TOUR = "SHOW_TOUR",
  HIDE_TOUR = "HIDE_TOUR",
  SHOW_MENU = "SHOW_MENU",
  HIDE_MENU = "HIDE_MENU",
  ENABLE_TRAINING_TOOLTIPS_ON_HOVER = "ENABLE_TRAINING_TOOLTIPS_ON_HOVER",
  DISABLE_TRAINING_TOOLTIPS_ON_HOVER = "DISABLE_TRAINING_TOOLTIPS_ON_HOVER",
  ENABLE_TRAINING_TOOLTIPS_SHOW_ALL = "ENABLE_TRAINING_TOOLTIPS_SHOW_ALL",
  DISABLE_TRAINING_TOOLTIPS_SHOW_ALL = "DISABLE_TRAINING_TOOLTIPS_SHOW_ALL",
}

export interface IUIState {
  menuOpen: false;
  tourVisible: boolean;
  trainingTooltipsOnHover: true;
  trainingTooltipsShowAll: false;
}

const initialState: IUIState = {
  menuOpen: false,
  tourVisible: false,
  trainingTooltipsOnHover: true,
  trainingTooltipsShowAll: false,
};

const uiReducer = (state = initialState, action: any) => {
  switch (action.type) {

    case ActionTypes.SHOW_TOUR:
      return {...state, tourVisible: true  };

    case ActionTypes.HIDE_TOUR:
      return {...state, tourVisible: false };

    case ActionTypes.SHOW_MENU:
      return {...state, menuOpen: true  };

    case ActionTypes.HIDE_MENU:
      return {...state, menuOpen: false };

    case ActionTypes.ENABLE_TRAINING_TOOLTIPS_ON_HOVER:
      return {...state, trainingTooltipsOnHover: true  };

    case ActionTypes.DISABLE_TRAINING_TOOLTIPS_ON_HOVER:
      return {...state, trainingTooltipsOnHover: false };

    case ActionTypes.ENABLE_TRAINING_TOOLTIPS_SHOW_ALL:
      return {...state, trainingTooltipsShowAll: true  };

    case ActionTypes.DISABLE_TRAINING_TOOLTIPS_SHOW_ALL:
      return {...state, trainingTooltipsShowAll: false };

    default: {
      return state;
    }
  }
};

export default uiReducer;
