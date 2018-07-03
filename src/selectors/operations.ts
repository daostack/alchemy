import { createSelector } from "reselect";
import { IRootState } from '../reducers';
import { INotification, INotificationsState } from "reducers/notifications";
import { ITransaction, ITransactionsState } from "reducers/transactions";

const notifications = (state: IRootState) => state.notifications;
const transactions = (state: IRootState) => {
  const {
    _persist: _, // get rid of the `_persist` key that `redux-persist` stores.
    ...rest
  } = state.transactions;
  return rest;
};

export type LabeledNotification = {type: 'notification', id: string} & INotification;
export type LabeledTransaction = {type: 'transaction', id: string} & ITransaction;
export type LabeledOperation = LabeledNotification | LabeledTransaction;

export const sortedOperations =
  () => createSelector(
    [notifications, transactions],
    (notifications: INotificationsState, transactions: ITransactionsState): LabeledOperation[] => {
      const labeledNotifications = Object.keys(notifications)
        .map((k) => ({...notifications[k], type: 'notification', id: k} as LabeledNotification))
      const labeledTransactions = Object.keys(transactions)
        .map((k) => ({...transactions[k], type: 'transaction', id: k} as LabeledTransaction))
      return [...labeledNotifications, ...labeledTransactions]
        .sort((a, b) => a.timestamp - b.timestamp)
    }
  )
