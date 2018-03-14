export interface Notification {
  id: number;
  message: string;
  timestamp: Date;
}

export type NotificationState = Notification[];

export type NotificationAction = ShowNotification | DismissNotification;

export interface ShowNotification {
  type: "Notification/Show";
  message: string;
  timestamp: Date;
}

export interface DismissNotification {
  type: "Notification/Dismiss";
  id: number;
}

const example: NotificationState = [
  {
    id: 0,
    message: "Hello 1",
    timestamp: new Date(new Date().getTime() - 30 * 1000),
  },
  {
    id: 1,
    message: "Hello 2",
    timestamp: new Date(new Date().getTime() - 60 * 1000),
  },
  {
    id: 2,
    message: "Hello 3",
    timestamp: new Date(),
  },
];

export const notificationsReducer =
  (state: NotificationState = example, action: NotificationAction) =>
    action.type === "Notification/Show" ?
      [
        ...state,
        {
          id: id(state),
          message: action.message,
          timestamp: action.timestamp,
        },
      ] :

    action.type === "Notification/Dismiss" ?
      state.filter((n) => n.id !== action.id) :

      state;

/**
 * @param state current notification state
 * @returns fresh unique notification id
 */
const id =
  (state: NotificationState): number => {
    const ids = state.map((x) => x.id);
    let id = 0;
    while (ids.indexOf(id) !== -1) {
      id++;
    }
    return id;
  };
