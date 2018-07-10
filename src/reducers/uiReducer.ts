export enum ActionTypes {
  SHOW_TOUR = "SHOW_TOUR",
  HIDE_TOUR = "HIDE_TOUR"
}

export interface IUIState {
  tourVisible: boolean;
}

export const initialState: IUIState = {
  tourVisible: false
};

// TODO: make all action types explicit?
const uiReducer = (state = initialState, action: any) => {
  switch (action.type) {

    case ActionTypes.SHOW_TOUR:
      return {...state, tourVisible: true  };

    case ActionTypes.HIDE_TOUR:
      return {...state, tourVisible: false };

    default: {
      return state;
    }
  }
};

export default uiReducer;
