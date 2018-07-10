import { createSelector } from "reselect";
import { IRootState } from '../reducers';
import { INotification, INotificationsState } from "reducers/notifications";
import { IOperation, IOperationsState } from "reducers/operations";

const notifications = (state: IRootState) => state.notifications;

export const sortedNotifications =
  () => createSelector(
    [notifications],
    (notifications: INotificationsState): INotificationsState => {
      return notifications.sort((a, b) => a.timestamp - b.timestamp)
    }
  )
