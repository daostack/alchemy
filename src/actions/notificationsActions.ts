import { INotificationsState, ActionTypes } from 'reducers/notificationsReducer'

export const showAlert = (alert : string) => (dispatch : any) => {
  let payload : INotificationsState = {
    alert: alert
  };

  const action = {
    type: ActionTypes.ALERT_SHOW,
    payload: payload
  }
  dispatch(action);
}