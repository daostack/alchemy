import { Action } from "redux";
import { Dispatch } from "redux";
import { OperationsStatus } from "reducers/operations";
import { IOperationConfig } from "actions/async";

export interface IDismissOperation {
  type: 'Operation/Dismiss';
  payload: {
    hash: string;
  }
}

export const isDismissOperation =
  (action: Action): action is IDismissOperation =>
    action.type === 'Operation/Dismiss';

export const dismissOperation =
  (hash: string) => (dispatch: Dispatch<any>) =>
    dispatch({
      type: 'Operation/Dismiss',
      payload: { hash }
    } as IDismissOperation);

export interface IShowOperation {
  type: 'Operation/Show';
  operation?: IOperationConfig;
  payload: {
    status: OperationsStatus;
    message: string;
  }
}

export const isShowOperation =
  (action: Action): action is IShowOperation =>
    action.type === 'Operation/Show';

export const showOperation =
  (status: OperationsStatus, message: string, operation?: IOperationConfig) => (dispatch: Dispatch<any>) =>
    dispatch({
      type: 'Operation/Show',
      operation,
      payload: {
        status,
        message
      }
    } as IShowOperation);
