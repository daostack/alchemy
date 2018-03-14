import { ActionTypes, DismissNotification, INotificationsState, ShowNotification } from "reducers/notificationsReducer";

export const showAlert = (message: string) => (dispatch: any) => {
  const show: ShowNotification = {
    type: "Notification/Show",
    message,
    timestamp: new Date(),
  };

  dispatch(show);
};

export const dismissAlert = (id: number) => (dispatch: any) => {
  const dismiss: DismissNotification = {
    type: "Notification/Dismiss",
    id,
  };

  dispatch(dismiss);
};
