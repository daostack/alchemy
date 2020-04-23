import { INotificationsState, INotification } from "reducers/notifications";
import { createSelector } from "reselect";
import { IRootState } from "../reducers";

const notifications = (state: IRootState): INotificationsState => state.notifications;

export type IStateChecker = (state: IRootState) => INotificationsState;

export const sortedNotifications = (): IStateChecker =>
  createSelector(
    [notifications],
    (notifications: INotificationsState): INotificationsState => {
      return notifications.sort((a: INotification, b: INotification): number => a.timestamp - b.timestamp);
    }
  );
