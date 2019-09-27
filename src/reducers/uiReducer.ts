export enum ActionTypes {
  SHOW_TOUR = "SHOW_TOUR",
  HIDE_TOUR = "HIDE_TOUR",
  SHOW_MENU = "SHOW_MENU",
  HIDE_MENU = "HIDE_MENU",
}

export interface IUIState {
  menuOpen: false;
  tourVisible: boolean;
}

const initialState: IUIState = {
  menuOpen: false,
  tourVisible: false,
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

    default: {
      return state;
    }
  }
};

export default uiReducer;
