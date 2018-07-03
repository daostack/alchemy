import { Action, Dispatch, Middleware } from 'redux';
import * as moment from 'moment';

/** -- Model -- */

export enum NotificationStatus {
  Pending = 'Pending',
  Failure = 'Failure',
  Success = 'Success'
}

export interface INotification {
  status: NotificationStatus
  message: string;
  timestamp: number;
}

export interface INotificationsState {
  [id: string]: INotification
}

/** -- Actions -- */

export interface IDismissNotification extends Action {
  type: 'Notifications/Dismiss',
  payload: {
    id: string;
  }
}

export interface IShowNotification extends Action {
  type: 'Notifications/Show',
  payload: {
    id: string;
    status: NotificationStatus
    message: string;
    timestamp: number;
  }
}

export const showNotification =
  (
    status: NotificationStatus,
    message: string,
    id: string = `${Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)}`,
    timestamp: number = +moment()
  ) => (dispatch: Dispatch<any>) =>
    dispatch({
      type: 'Notifications/Show',
      payload: {
        id,
        status,
        message,
        timestamp
      }
    } as IShowNotification);

export const dismissNotification = (id: string) => (dispatch: Dispatch<any>) =>
  dispatch({
    type: 'Notifications/Dismiss',
    payload: {
      id
    }
  } as IDismissNotification);

export type NotificationsAction = IDismissNotification | IShowNotification

export const isNotificationsAction = (action: Action): action is NotificationsAction =>
  typeof action.type === 'string' && action.type.startsWith('Notifications/');

/** -- Reducer -- */

export const notificationsReducer =
  (state: INotificationsState = {}, a: Action) => {
    if (isNotificationsAction(a)) {
      if (a.type === 'Notifications/Dismiss') {
        const action = a as IDismissNotification;
        const {[a.payload.id]: _, ...rest} = state;
        return rest;
      }

      if (a.type === 'Notifications/Show') {
        const action = a as IShowNotification;
        const { status, message, timestamp } = action.payload;
        const id = action.payload.id;
        return {
          ...state,
          [id]: {
            ...state[id],
            status,
            message,
            timestamp
          }
        };
      }
    }

    return state;
  }

/** -- Effects -- */

/**
 * Automatically dismisses a succeseeded notification after a timeout.
 * @param timeout timout before dismissal in milliseconds
 */
export const successDismisser =
  (timeout: number = 5000): Middleware =>
  ({ getState, dispatch }) =>
  (next) =>
  (action: any) => {
    if (isNotificationsAction(action)) {
      if (action.type === 'Notifications/Show' && (action as IShowNotification).payload.status === NotificationStatus.Success) {
        setTimeout(() => {
          dispatch({
            type: 'Notifications/Dismiss',
            payload: {
              id: action.payload.id
            }
          } as IDismissNotification)
        }, timeout)
      }
    }

    return next(action);
  };
