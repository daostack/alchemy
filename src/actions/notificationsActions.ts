import { IDismissNotification, IShowNotification } from "reducers/notificationsReducer";

export const showAlert = (message: string) => (dispatch: any) => {
  const show: IShowNotification = {
    type: "Notification/Show",
    payload: {
      message,
      timestamp: new Date(),
    },
  };

  dispatch(show);
};

export const dismissAlert = (id: number) => (dispatch: any) => {
  const dismiss: IDismissNotification = {
    type: "Notification/Dismiss",
    payload: {
      id,
    },
  };

  dispatch(dismiss);
};
