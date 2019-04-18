import { INotificationsState } from "reducers/notifications";
import { createSelector } from "reselect";
import { IRootState } from "../reducers";

const notifications = (state: IRootState) => state.notifications;

export const sortedNotifications =
  () => createSelector(
    [notifications],
    (notifications: INotificationsState): INotificationsState => {
      return notifications.sort((a, b) => a.timestamp - b.timestamp);
    }
  );
