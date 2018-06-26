export enum ActionTypes {
  SHOW_TOUR = "SHOW_TOUR",
  HIDE_TOUR = "HIDE_TOUR"
}

export interface IUIState {
  showTour: boolean;
}

export const initialState: IUIState = {
  showTour: false
};

// TODO: make all action types explicit?
const uiReducer = (state = initialState, action: any) => {
  switch (action.type) {

    case ActionTypes.SHOW_TOUR:
      return {...state, showTour: true  };

    case ActionTypes.HIDE_TOUR:
      return {...state, showTour: false };

    default: {
      return state;
    }
  }
};

export default uiReducer;
