import * as Arc from '@daostack/arc.js';
import { TransactionReceiptsEventInfo } from '@daostack/arc.js';
import { Action, Dispatch, Middleware } from 'redux';
import * as moment from 'moment';
import { REHYDRATE, RehydrateAction, persistReducer, createTransform } from "redux-persist";
import Util from "../lib/util";
import storage from "redux-persist/lib/storage";
import { IRootState } from "../reducers";
import BigNumber from "bignumber.js";
import { VoteOptions } from "./arcReducer";

/** -- Model -- */

export enum OperationError {
  Canceled = 'Canceled',
  Reverted = 'Reverted',
  OutOfGas = 'OutOfGas',
}

export enum OperationStatus {
  Started = 'Started',
  Sent = 'Sent',
  Mined = 'Mined'
}

export interface IOperation {
  txHash?: string;
  error?: OperationError | string;
  status: OperationStatus;
  functionName: string;
  options: any;
}

export interface IOperationsState {
  [id: string]: IOperation;
}

/** -- Actions -- */

export interface IUpdateOperation extends Action {
  type: 'Operations/Update',
  payload: {
    id: string;
    operation: IOperation;
  }
}

type OperationsAction = IUpdateOperation

export const isOperationsAction = (action: Action): action is OperationsAction =>
  typeof action.type === 'string' && action.type.startsWith('Operations/');

/** -- Reducer -- */

export const operationsReducer =
  (state: IOperationsState = {}, a: Action) => {
    if (isOperationsAction(a)) {
      if (a.type === 'Operations/Update') {
        const action = a as IUpdateOperation;
        return {
          ...state,
          [action.payload.id]: {
            ...state[action.payload.id],
            ...action.payload.operation
          }
        };
      }
    }

    return state;
  }

/** -- Effects -- */

const errorType = (error: Error) => {
  const message = error.message.toLowerCase();
  if (message.includes('user denied')) {
    return OperationError.Canceled;
  } else if (message.includes('revert')) {
    return OperationError.Reverted;
  } else if (message.includes('out of gas')) {
    return OperationError.OutOfGas;
  } else {
    return error.message;
  }
}

export const operationsTracker: Middleware =
  ({ getState, dispatch }) =>
  (next) => {
    Arc.TransactionService.subscribe('TxTracking', (topic, info: TransactionReceiptsEventInfo) => {
      const {
        invocationKey,
        txStage,
        tx,
        error,
        functionName
      } = info;

      // discard the `txEventContext` property since it's not serializable and irelevent.
      const {txEventContext: _,  ...options} = info.options;

      dispatch({
        type: 'Operations/Update',
        payload: {
          id: `${invocationKey}`,
          operation: {
            txHash: tx,
            error: error ? errorType(error) : undefined,
            status:
              txStage === Arc.TransactionStage.sent ?
                OperationStatus.Sent :
              txStage === Arc.TransactionStage.mined || txStage === Arc.TransactionStage.confirmed ?
                OperationStatus.Mined :
                OperationStatus.Started,
            functionName,
            options,
          }
        }
      } as IUpdateOperation)
    });

    return (a: any) => {
      if (a.type === REHYDRATE) {
        /**
         * Resubscribe to sent Operations after rehydrating.
         */
        const action = a as RehydrateAction;
        const payload = action.payload;

        if (payload) {
          const state = payload.operations as IOperationsState
          Object.keys(state).forEach(async (id: string) => {
            if (state[id].status && state[id].status === OperationStatus.Sent) {
              try {
                const receipt = await Arc.TransactionService.watchForMinedTransaction(state[id].txHash);
                dispatch({
                  type: 'Operations/Update',
                  payload: {
                    id: `${id}`,
                    operation: {
                      status: OperationStatus.Mined
                    }
                  }
                } as IUpdateOperation);
              } catch (e) {
                dispatch({
                  type: 'Operations/Update',
                  payload: {
                    id: `${id}`,
                    operation: {
                      error: errorType(e)
                    }
                  }
                } as IUpdateOperation)
              }
            }
          });
        }
      }

      next(a)
    };
  }
;
