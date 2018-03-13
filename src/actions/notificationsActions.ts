import { ActionTypes, INotificationsState } from "reducers/notificationsReducer";

export const showAlert = (alert: string) => (dispatch: any) => {
  const payload: INotificationsState = {
    alert,
  };

  const action = {
    type: ActionTypes.ALERT_SHOW,
    payload,
  };
  dispatch(action);
};
