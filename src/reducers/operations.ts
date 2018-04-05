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

/**
 * Each operation is given a stable key which is simply the hash of it's action's `type` and `meta`.
 * This means that that actions with the same `type` and different `meta` will be treated as different.
 */
export interface IOperationsState {
  [hash: string]: IOperation
}

/**
 * A reducer that keeps track of currently running operations.
 * Multiple `pending` actions with the same key will increment the `step` until either a `failure`, a `succeess` or a `cancel` happens.
 */
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

        /* initialize with defaults if does not exist yet */
        if (!state[hash] && sequence === AsyncActionSequence.Pending) {
          state = update(state, {
            [hash]: {
              $set: defaults
            }
          });
        }

        if (state[hash]) {
          switch (sequence) {
            case AsyncActionSequence.Cancel:
              return update(state, { $unset: [hash] });
            case AsyncActionSequence.Pending:
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
            case AsyncActionSequence.Failure:
              return update(state, {
                [hash]: {
                  $merge: {
                    status: OperationsStatus.Failure,
                    message: operationsConfig.message || state[hash].message,
                    timestamp: +moment(),
                  }
                }
              });
            case AsyncActionSequence.Success:
              return update(state, {
                [hash]: {
                  $merge: {
                    status: OperationsStatus.Success,
                    message: operationsConfig.message || state[hash].message,
                    timestamp: +moment(),
                  }
                }
              });
          }
        }
      }

      if (isDismissOperation(action) && state[action.payload.hash].status !== OperationsStatus.Pending) {
        const { hash } = action.payload;
        return update(state, {$unset: [hash]})
      }

      return state;
    };

/**
 * A middleware that cancels a failed/successful action after timeout.
 * It respects AsyncAction.ttl if it's defined.
 * @param ttl default timeout before cancelling a failed action. zero means: do not cancel.
 */
export const actionCanceler =
  (ttl: number = 5000): Middleware =>
    (store) => (next) => (action: any) => {

      if (isAsyncAction(action) && action.sequence === AsyncActionSequence.Success) {
        const { operation } = action;
        const timeout = (operation && typeof operation.ttl === 'number') ? operation.ttl : ttl;

        if (timeout > 0) {
          setTimeout(() => {
            store.dispatch({
              type: action.type,
              meta: action.meta,
              sequence: AsyncActionSequence.Cancel
            } as IAsyncAction<any, any, any>);
          }, timeout)
        }
      }

      return next(action);
    }
