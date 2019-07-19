import { Action } from "redux";

/** -- Model -- */

export enum OperationError {
  Canceled = "Canceled",
  Reverted = "Reverted",
  OutOfGas = "OutOfGas",
}

export enum OperationStatus {
  Started = "Started",
  Sent = "Sent",
  Complete = "Complete"
}

export interface IOperation {
  txHash?: string;
  error?: OperationError | string;
  status: OperationStatus;
  functionName: string;
  options: any;
  proposalTitle?: string;
}

export interface IOperationsState {
  [id: string]: IOperation;
}

/** -- Actions -- */

export interface IUpdateOperation extends Action {
  type: "Operations/Update";
  payload: {
    id: string;
    operation: IOperation;
  };
}

export interface IDismissOperation extends Action {
  type: "Operations/Dismiss";
  payload: {
    id: string;
  };
}

type OperationsAction = IUpdateOperation | IDismissOperation;

const isOperationsAction = (action: Action): action is OperationsAction =>
  typeof action.type === "string" && action.type.startsWith("Operations/");

/** -- Reducer -- */

export const operationsReducer =
  (state: IOperationsState = {}, a: Action): IOperationsState => {
    if (isOperationsAction(a)) {
      if (a.type === "Operations/Update") {
        const action = a as IUpdateOperation;
        return {
          ...state,
          [action.payload.id]: {
            ...state[action.payload.id],
            ...action.payload.operation,
          },
        };
      }

      if (a.type === "Operations/Dismiss") {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {[a.payload.id]: _, ...rest } = state;
        return rest;
      }
    }

    return state;
  };
