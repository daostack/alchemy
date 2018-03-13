export enum ActionTypes {
  ALERT_SHOW = "ALERT_SHOW",
}

export interface INotificationsState {
  alert: string;
}

export const initialState: INotificationsState = {
  alert: "",
};

const notificationsReducer = (state = initialState, action: any) => {
  if (action.payload && action.payload.alert) {
    return {...state, alert : action.payload.alert };
  } else {
    return {...state, alert : "" };
  }
};

export default notificationsReducer;
