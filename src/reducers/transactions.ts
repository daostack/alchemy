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

export interface ITransactionsState {
  [id: string]: ITransaction;
}

/** -- Actions -- */

export interface IUpdateTransaction extends Action {
  type: 'Transactions/Update',
  payload: {
    id: string;
    transaction: ITransaction;
  }
}

export interface IDismissTransaction extends Action {
  type: 'Transactions/Dismiss',
  payload: {
    id: string;
  }
}

export const dismissTransaction = (id: string) => (dispatch: Dispatch<any>) =>
  dispatch({
    type: 'Transactions/Dismiss',
    payload: {
      id
    }
  } as IDismissTransaction);

export type TransactionsAction = IUpdateTransaction | IDismissTransaction

export const isTransactionsAction = (action: Action): action is TransactionsAction =>
  typeof action.type === 'string' && action.type.startsWith('Transactions/');

/** -- Reducer -- */

export const transactionsReducer =
  (state: ITransactionsState = {}, a: Action) => {
    if (isTransactionsAction(a)) {
      if (a.type === 'Transactions/Update') {
        const action = a as IUpdateTransaction;
        return {
          ...state,
          [action.payload.id]: {
            message: '',
            ...state[action.payload.id],
            ...action.payload.transaction
          }
        };
      }

      if (a.type === 'Transactions/Dismiss') {
        const action = a as IDismissTransaction;
        const {[a.payload.id]: _, ...rest} = state;
        return rest;
      }
    }

    return state;
  }

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
    `Creating a new DAO`,
  'StandardToken.approve': (state, {amount}: Arc.StandardTokenApproveOptions) =>
    `Approving ${Util.fromWei(new BigNumber(amount)).toNumber()} GEN for staking`
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
        type: 'Transactions/Update',
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
        const state = action.payload as ITransactionsState;

        if (state) {
          Object.keys(state).forEach(async (id: string) => {
            if (state[id].status && state[id].status === TransactionStatus.Sent) {
              try {
                const receipt = await Arc.TransactionService.watchForMinedTransaction(state[id].txHash);
                dispatch({
                  type: 'Transactions/Update',
                  payload: {
                    id: `${id}`,
                    transaction: {
                      status: TransactionStatus.Mined
                    }
                  }
                } as IUpdateTransaction);
              } catch (e) {
                dispatch({
                  type: 'Transactions/Update',
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
 * Automatically dismisses a succeseeded transaction after a timeout.
 * @param timeout timout before dismissal in milliseconds
 */
export const successDismisser =
  (timeout: number = 5000): Middleware =>
  ({ getState, dispatch }) =>
  (next) =>
  (action: any) => {
    if (isTransactionsAction(action)) {
      if (action.type === 'Transactions/Update' && (action as IUpdateTransaction).payload.transaction.status === TransactionStatus.Mined) {
        setTimeout(() => {
          dispatch({
            type: 'Transactions/Dismiss',
            payload: {
              id: action.payload.id
            }
          } as IDismissTransaction)
        }, timeout)
      }
    }

    return next(action);
  };
