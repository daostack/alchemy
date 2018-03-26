import { Action, Middleware } from "redux";
import * as objectHash from 'object-hash';
import * as update from "immutability-helper";
import * as moment from 'moment';
import { isDismissOperation } from 'actions/operationsActions';
import { AsyncActionSequence, IAsyncAction , isAsyncAction } from 'actions/async';

export enum OperationsStatus {
  Pending = 'pending',
  Failure = 'failure',
  Success = 'success'
}

export interface IOperation {
  status: OperationsStatus;
  message: string;
  step: number;
  totalSteps?: number;
  timestamp: number;
}

export interface IOperationsState {
  [hash: string]: IOperation
}
export const operationsReducer =
  (state: IOperationsState = {}, action: Action): IOperationsState => {
      if (isAsyncAction(action)) {
        const { type, meta, sequence, operation } = action;
        const hash = objectHash({ type, meta });

        const operationsConfig = operation || {};

        const defaults: IOperation = {
          status: OperationsStatus.Pending,
          message: operationsConfig.message || `Operation #${hash.substr(0, 4)}`,
          step: 0,
          totalSteps: operationsConfig.totalSteps,
          timestamp: +moment() // TODO: this makes the reducer impure. figure out a better way.
        }

        if (!state[hash]) {
          state = update(state, {
            [hash]: {
              $set: defaults
            }
          });
        }

        switch (action.sequence) {
          case 'reset':
          case 'success':
            return update(state, { $unset: [hash] });
          case 'pending':
            return update(state, {
              [hash]: {
                $merge: {
                  status: OperationsStatus.Pending,
                  step: state[hash].status === OperationsStatus.Pending ? state[hash].step + 1 : 0,
                  message: operationsConfig.message || state[hash].message,
                  timestamp: +moment(),
                }
              }
            });
          case 'failure':
          return update(state, {
            [hash]: {
              $merge: {
                status: OperationsStatus.Failure,
                message: operationsConfig.message || state[hash].message,
                timestamp: +moment(),
              }
            }
          });
        }
      }

      if (isDismissOperation(action)) {
        const { hash } = action.payload;
        return update(state, {$unset: [hash]})
      }

      return state;
    };

export const failureResetter =
  (ttl: number = 5000): Middleware =>
    (store) => (next) => (action: any) => {

      if (isAsyncAction(action) && action.sequence == AsyncActionSequence.Failure) {
        const { operation } = action;
        const timeout = (operation && operation.ttl) || ttl;

        setTimeout(() => {
          store.dispatch({
            type: action.type,
            meta: action.meta,
            sequence: AsyncActionSequence.Reset
          } as IAsyncAction<any, any, any>);
        }, timeout)
      }

      return next(action);
    }
