import { createSelector } from "reselect";
import { IRootState } from '../reducers';
import { IOperationsState, INotification, ITransaction } from "../reducers/operations";

const operations = (state: IRootState) => state.operations;

export type LabeledNotification = {type: 'notification', id: string} & INotification;
export type LabeledTransaction = {type: 'transaction', id: string} & ITransaction;
export type LabeledOperation = LabeledNotification | LabeledTransaction;

export const sortedOperations =
  () => createSelector(
    [operations],
    (operations: IOperationsState): LabeledOperation[] => {
      const notifications = Object.keys(operations.notifications)
        .map((k) => ({...operations.notifications[k], type: 'notification', id: k} as LabeledNotification))
      const transactions = Object.keys(operations.transactions)
        .map((k) => ({...operations.transactions[k], type: 'transaction', id: k} as LabeledTransaction))
      return [...notifications, ...transactions]
        .sort((a, b) => a.timestamp - b.timestamp)
    }
  )
