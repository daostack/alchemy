import { Action } from "redux";
import { Dispatch } from "redux";

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
