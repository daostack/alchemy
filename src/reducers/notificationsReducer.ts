import * as update from "immutability-helper";

export interface INotification {
  id: number;
  message: string;
  timestamp: Date;
}

export type INotificationState = INotification[];

export type NotificationAction = IShowNotification | IDismissNotification;

export interface IShowNotification {
  type: "Notification/Show";
  payload: {
    message: string,
    timestamp: Date,
  };
}

export interface IDismissNotification {
  type: "Notification/Dismiss";
  payload: {
    id: number,
  };
}

export const notificationsReducer =
  (state: INotificationState = [], action: NotificationAction) => {
    switch (action.type) {
      case "Notification/Show":
        return update(state, {
          $push: [{
            id: id(state),
            message: action.payload.message,
            timestamp: action.payload.timestamp,
          }],
        });
      case "Notification/Dismiss":
        return state.filter((n) => n.id !== action.payload.id);
      default:
        return state;
    }
  };

/**
 * @param state current notification state
 * @returns fresh unique notification id
 */
const id =
  (state: INotificationState): number => {
    const ids = state.map((x) => x.id);
    let id = 1;
    while (ids.indexOf(id) !== -1) {
      id++;
    }
    return id;
  };
