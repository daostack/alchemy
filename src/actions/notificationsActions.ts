import { IDismissNotification, IShowNotification, nextId } from "reducers/notificationsReducer";
import { IRootState } from "reducers";

export const showAlert = (message: string, ttl: number = 10000) =>
  (dispatch: any, getState: () => IRootState) => {
    const show: IShowNotification = {
      type: "Notification/Show",
      payload: {
        message,
        timestamp: new Date(),
      },
    };

    const hide: IDismissNotification = {
      type: "Notification/Dismiss",
      payload: {
        id: nextId(getState().notifications)
      },
    };

    dispatch(show);

    if (ttl) {
      setTimeout(() => {
        dispatch(hide)
      }, ttl);
    }
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
