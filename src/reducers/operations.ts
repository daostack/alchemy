import { Action, MiddlewareAPI } from "redux";
import { Dispatch } from "react-redux";
import { IRootState } from "../reducers";
import * as Arc from '@daostack/arc.js';
import { TransactionReceiptsEventInfo } from "@daostack/arc.js";
import * as moment from 'moment';
import { REHYDRATE, RehydrateAction, persistReducer, createTransform } from "redux-persist";
import { Middleware } from "redux";
import { errorMessage } from "components/CreateProposal/CreateProposal.scss";
import { VoteOptions } from "./arcReducer";
import Util from "lib/util";
import BigNumber from "bignumber.js";
import storage from "redux-persist/lib/storage";

/** -- Model -- */

export enum TransactionError {
  Canceled = 'Canceled',
  Reverted = 'Reverted',
  OutOfGas = 'OutOfGas',
  Unknown = 'Unknown',
}

export enum TransactionStatus {
  Started = 'Started',
  Sent = 'Sent',
  Mined = 'Mined'
}

export interface ITransaction {
  txHash?: string;
  error?: TransactionError;
  status: TransactionStatus;
  message: string;
  timestamp: number;
}

export enum NotificationStatus {
  Pending = 'Pending',
  Failure = 'Failure',
  Success = 'Success'
}

export interface INotification {
  status: NotificationStatus
  message: string;
  timestamp: number;
}

export interface IOperationsState {
  notifications: {
    [id: string]: INotification
  },
  transactions: {
    [id: string]: ITransaction;
  }
}

/** -- Actions -- */

export interface IUpdateTransaction extends Action {
  type: 'Operations/Update',
  payload: {
    id: string;
    transaction: ITransaction;
  }
}

export interface IDismissOperation extends Action {
  type: 'Operations/Dismiss',
  payload: {
    id: string;
  }
}

export interface IShowNotification extends Action {
  type: 'Operations/Show',
  payload: {
    id: string;
    status: NotificationStatus
    message: string;
    timestamp: number;
  }
}

export const showNotification =
  (
    status: NotificationStatus,
    message: string,
    id: string = `${Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)}`,
    timestamp: number = +moment()
  ) => (dispatch: Dispatch<any>) =>
    dispatch({
      type: 'Operations/Show',
      payload: {
        id,
        status,
        message,
        timestamp
      }
    } as IShowNotification);

export const dismissOperation = (id: string) => (dispatch: Dispatch<any>) =>
  dispatch({
    type: 'Operations/Dismiss',
    payload: {
      id
    }
  } as IDismissOperation);

export type OperationsAction = IUpdateTransaction | IDismissOperation | IShowNotification

export const isOperationsAction = (action: Action): action is OperationsAction =>
  typeof action.type === 'string' && action.type.startsWith('Operations/');

/** -- Reducer -- */

const reducer =
  (state: IOperationsState = {notifications: {}, transactions: {}}, a: Action) => {
    if (isOperationsAction(a)) {
      if (a.type === 'Operations/Update') {
        const action = a as IUpdateTransaction;
        return {
          ...state,
          transactions: {
            ...state.transactions,
            [action.payload.id]: {
              ...state.transactions[action.payload.id],
              ...action.payload.transaction
            }
          }
        };
      }

      if (a.type === 'Operations/Dismiss') {
        const action = a as IDismissOperation;
        const {
          notifications: {[a.payload.id]: _, ...restNotifications},
          transactions: {[a.payload.id]: __, ...restTransactions},
        } = state;

        return {
          notifications: restNotifications,
          transactions: restTransactions
        };
      }

      if (a.type === 'Operations/Show') {
        const action = a as IShowNotification;
        const { status, message, timestamp } = action.payload;
        const id = action.payload.id;
        return {
          ...state,
          notifications: {
            ...state.notifications,
            [id]: {
              ...state.notifications[id],
              status,
              message,
              timestamp
            }
          }
        };
      }
    }

    return state;
  }

/**
 * Only persist pending transactions
 */
const filterPending = createTransform(
  (state, key) => {
    if (key === 'transactions') {
      const out = {...state} as {[id: number]: ITransaction};
      const keys = Object.keys(out);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i] as any as number;
        if (out[k].error || (out[k].status && out[k].status !== TransactionStatus.Sent)) {
          delete out[k];
        }
      }
      return out;
    }
    return state
  },
  (raw, key) => raw
)

/**
 * Persist the pending transactions
 */
export const operationsReducer = persistReducer({
  key: 'operations',
  storage,
  transforms: [filterPending],
  whitelist: ['transactions']
}, reducer);

/** -- Effects -- */

const messages: {[key: string]: (state: IRootState, options: any) => string} = {
  'GenesisProtocol.vote': (state, {vote, proposalId}: Arc.VoteOptions) =>
    `Voting "${vote === VoteOptions.Yes ? 'Yes' : 'No'}" on "${state.arc.proposals[proposalId].title}"`,
  'GenesisProtocol.stake': (state, {vote, proposalId, amount}: Arc.StakeConfig) =>
    `Staking ${Util.fromWei(new BigNumber(amount)).toNumber()} GEN for "${vote === VoteOptions.Yes ? 'Yes' : 'No'}" on "${state.arc.proposals[proposalId].title}"`,
  'GenesisProtocol.execute': (state, {proposalId}: Arc.ProposalIdOption) =>
    `Exeuting "${state.arc.proposals[proposalId].title}"`,
  'GenesisProtocol.redeem': (state, {proposalId}: Arc.RedeemConfig) =>
    `Redeeming rewards for "${state.arc.proposals[proposalId].title}"`,
  'GenesisProtocol.redeemDaoBounty': (state, {proposalId}: Arc.RedeemConfig) =>
    `Redeeming bounty rewards for "${state.arc.proposals[proposalId].title}"`,
  'ContributionReward.proposeContributionReward': (state, {}: Arc.ProposeContributionRewardParams) =>
    `Creating proposal`,
  'ContributionReward.redeemContributionReward': (state, {proposalId}: Arc.ContributionRewardRedeemParams) =>
    `Redeeming contribution reward for "${state.arc.proposals[proposalId].title}"`,
  'DAO.new': (state, {}: Arc.NewDaoConfig) =>
    `Creating a new DAO`
}

const errorType = (error: Error) => {
  const message = error.message.toLowerCase();
  if (message.includes('user denied')) {
    return TransactionError.Canceled;
  } else if (message.includes('revert')) {
    return TransactionError.Reverted;
  } else if (message.includes('out of gas')) {
    return TransactionError.OutOfGas;
  } else {
    return TransactionError.Unknown;
  }
}

const filterUndefined = (obj: any): any => {
  return JSON.parse(JSON.stringify(obj));
}

export const transactionsTracker: Middleware =
  ({ getState, dispatch }) =>
  (next) => {
    Arc.TransactionService.subscribe('TxTracking', (topic, info: TransactionReceiptsEventInfo) => {
      const {
        invocationKey,
        txStage,
        tx,
        error,
        functionName,
        options
      } = info;

      const message = messages[functionName] && messages[functionName](getState() as any as IRootState, options)
      dispatch(filterUndefined({
        type: 'Operations/Update',
        payload: {
          id: `${invocationKey}`,
          transaction: {
            timestamp: +moment(),
            txHash: tx,
            message: error ? error.message : message,
            error: error ? errorType(error) : undefined,
            status:
              txStage === Arc.TransactionStage.sent ?
                TransactionStatus.Sent :
              txStage === Arc.TransactionStage.mined || txStage === Arc.TransactionStage.confirmed ?
                TransactionStatus.Mined :
                TransactionStatus.Started
          }
        }
      } as IUpdateTransaction))
    });

    return (a: any) => {
      if (a.type === REHYDRATE) {
        /**
         * Resubscribe to sent transactions after rehydrating.
         */
        const action = a as RehydrateAction;
        const state = action.payload as IOperationsState;

        if (state) {
          Object.keys(state.transactions).forEach(async (id: string) => {
            if (state.transactions[id].status === TransactionStatus.Sent) {
              try {
                const receipt = await Arc.TransactionService.watchForMinedTransaction(state.transactions[id].txHash);
                dispatch({
                  type: 'Operations/Update',
                  payload: {
                    id: `${id}`,
                    transaction: {
                      status: TransactionStatus.Mined
                    }
                  }
                } as IUpdateTransaction);
              } catch (e) {
                dispatch({
                  type: 'Operations/Update',
                  payload: {
                    id: `${id}`,
                    transaction: {
                      message: e.message,
                      error: errorType(e)
                    }
                  }
                } as IUpdateTransaction)
              }
            }
          });
        }
      }

      next(a)
    };
  }
;

/**
 * Automatically dismisses a succeseeded notification/transaction after a timeout.
 * @param timeout timout before dismissal in milliseconds
 */
export const successDismisser =
  (timeout: number = 5000): Middleware =>
  ({ getState, dispatch }) =>
  (next) =>
  (action: any) => {
    if (isOperationsAction(action)) {
      if (
        (action.type === 'Operations/Show' && (action as IShowNotification).payload.status === NotificationStatus.Success) ||
        (action.type === 'Operations/Update' && (action as IUpdateTransaction).payload.transaction.status === TransactionStatus.Mined)
      ) {
        setTimeout(() => {
          dispatch({
            type: 'Operations/Dismiss',
            payload: {
              id: action.payload.id
            }
          } as IDismissOperation)
        }, timeout)
      }
    }

    return next(action);
  };
