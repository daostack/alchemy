import * as moment from "moment";
import { Action, Dispatch } from "redux";

/** -- Model -- */

export enum NotificationStatus {
  Pending = "Pending",
  Failure = "Failure",
  Success = "Success"
}

export interface INotification {
  id: string;
  status: NotificationStatus;
  title?: string;
  message: string;
  fullErrorMessage?: string;
  url?: string;
  timestamp: number;
}

export type INotificationsState = INotification[];

/** -- Actions -- */

export interface IDismissNotification extends Action {
  type: "Notifications/Dismiss";
  payload: {
    id: string;
  };
}

export interface IShowNotification extends Action {
  type: "Notifications/Show";
  payload: {
    id: string;
    status: NotificationStatus;
    title?: string;
    message: string;
    fullErrorMessage?: string;
    url?: string;
    timestamp: number;
  };
}

const filterUndefined = (obj: any): any => {
  return JSON.parse(JSON.stringify(obj));
};

export const showNotification =
  (
    status: NotificationStatus,
    message: string,
    fullErrorMessage?: string,
    title?: string,
    url?: string,
    id = `${Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)}`,
    timestamp: number = +moment(),
  ): (dispatch: Dispatch<any, any>) => IShowNotification =>
    (dispatch: Dispatch<any, any>): IShowNotification =>
    {
      return dispatch(filterUndefined({
        type: "Notifications/Show",
        payload: {
          id,
          status,
          title,
          url,
          message,
          fullErrorMessage,
          timestamp,
        },
      }) as IShowNotification);
    };

export const dismissNotification = (id: string): (dispatch: Dispatch<any, any>) => IDismissNotification =>
  (dispatch: Dispatch<any, any>): IDismissNotification =>
  {
    return dispatch({
      type: "Notifications/Dismiss",
      payload: {
        id,
      },
    } as IDismissNotification);
  };

export type NotificationsAction = IDismissNotification | IShowNotification;

export const isNotificationsAction = (action: Action): action is NotificationsAction =>
  typeof action.type === "string" && action.type.startsWith("Notifications/");

/** -- Reducer -- */

export const notificationsReducer =
  (state: INotificationsState = [], a: Action): INotification[] => {
    if (isNotificationsAction(a)) {
      if (a.type === "Notifications/Dismiss") {
        const action = a as IDismissNotification;
        return state.filter((x): boolean => x.id !== action.payload.id);
      }

      if (a.type === "Notifications/Show") {
        const action = a as IShowNotification;
        const id = action.payload.id;

        if (state.map((n: INotification): string => n.id).indexOf(id) === -1) {
          return [
            ...state,
            {
              message: "",
              ...action.payload,
            },
          ];
        } else {
          return state.map((n: INotification): INotification =>
            n.id !== id ? n : {
              message: "",
              ...n,
              ...action.payload,
            }
          );
        }
      }
    }

    return state;
  };
