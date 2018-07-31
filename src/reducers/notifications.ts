import { Action, Dispatch, Middleware } from 'redux';
import * as moment from 'moment';
import { isOperationsAction, OperationStatus, OperationError, IOperationsState, IOperation, dismissOperation, IUpdateOperation } from './operations';
import { IRootState } from 'reducers';
import { VoteOptions } from 'reducers/arcReducer';
import BigNumber from 'bignumber.js';
import Util from 'lib/util';
import * as Arc from '@daostack/arc.js';
import { REHYDRATE, RehydrateAction } from 'redux-persist';

/** -- Model -- */

export enum NotificationStatus {
  Pending = 'Pending',
  Failure = 'Failure',
  Success = 'Success'
}

export interface INotification {
  id: string;
  status: NotificationStatus;
  title?: string;
  message: string;
  fullErrorMessage?: string;
  url?: string;
  timestamp: number;
}

export type INotificationsState = INotification[]

/** -- Actions -- */

export interface IDismissNotification extends Action {
  type: 'Notifications/Dismiss',
  payload: {
    id: string;
  }
}

export interface IShowNotification extends Action {
  type: 'Notifications/Show',
  payload: {
    id: string;
    status: NotificationStatus;
    title?: string;
    message: string;
    fullErrorMessage?: string;
    url?: string;
    timestamp: number;
  }
}

const filterUndefined = (obj: any): any => {
  return JSON.parse(JSON.stringify(obj));
}

export const showNotification =
  (
    status: NotificationStatus,
    message: string,
    fullErrorMessage?: string,
    title?: string,
    url?: string,
    id: string = `${Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)}`,
    timestamp: number = +moment(),
  ) => (dispatch: Dispatch<any>) =>
    dispatch(filterUndefined({
      type: 'Notifications/Show',
      payload: {
        id,
        status,
        title,
        url,
        message,
        fullErrorMessage,
        timestamp
      }
    }) as IShowNotification);

export const dismissNotification = (id: string) => (dispatch: Dispatch<any>) =>
  dispatch({
    type: 'Notifications/Dismiss',
    payload: {
      id
    }
  } as IDismissNotification);

export type NotificationsAction = IDismissNotification | IShowNotification

export const isNotificationsAction = (action: Action): action is NotificationsAction =>
  typeof action.type === 'string' && action.type.startsWith('Notifications/');

/** -- Reducer -- */

export const notificationsReducer =
  (state: INotificationsState = [], a: Action) => {
    if (isNotificationsAction(a)) {
      if (a.type === 'Notifications/Dismiss') {
        const action = a as IDismissNotification;
        return state.filter((x) => x.id !== action.payload.id);
      }

      if (a.type === 'Notifications/Show') {
        const action = a as IShowNotification;
        const { status, title, message, timestamp } = action.payload;
        const id = action.payload.id;

        if (state.map((n) => n.id).indexOf(id) === -1) {
          return [
            ...state,
            {
              message: '',
              ...action.payload
            }
          ]
        } else {
          return state.map((n) =>
            n.id !== id ? n : {
              message: '',
              ...n,
              ...action.payload
            }
          )
        }
      }
    }

    return state;
  }

/** -- Effects -- */

/**
 * Automatically dismisses a succeseeded notification after a timeout.
 * @param timeout timout before dismissal in milliseconds
 */
export const successDismisser =
  (timeout: number = 5000): Middleware =>
  ({ getState, dispatch }) =>
  (next) =>
  (action: any) => {
    if (isNotificationsAction(action)) {
      if (action.type === 'Notifications/Show' && (action as IShowNotification).payload.status === NotificationStatus.Success) {
        setTimeout(() => {
          dispatch({
            type: 'Notifications/Dismiss',
            payload: {
              id: action.payload.id
            }
          } as IDismissNotification)
        }, timeout)
      }
    }

    return next(action);
  };

function elipsis(str: string, n: number) {
  return str.length <= n - 3 ? str : str.slice(0, n - 3) + '...';
}

/**
 * A map of messages to show for each type of action.
 */
const messages: {[key: string]: (proposalTitle: string | undefined, options: any) => string} = {
  'GenesisProtocol.vote': (proposalTitle, {vote, proposalId}: Arc.VoteOptions) =>
    `Voting ${vote === VoteOptions.Yes ? 'Yes' : 'No'} on ${elipsis(proposalTitle, 22)}`,
  'GenesisProtocol.stake': (proposalTitle, {vote, proposalId, amount}: Arc.StakeConfig) =>
    `Predicting ${vote === VoteOptions.Yes ? 'Pass' : 'Fail'} on ${elipsis(proposalTitle, 22)} with ${Util.fromWei(new BigNumber(amount))} GEN`,
  'GenesisProtocol.execute': (proposalTitle, {proposalId}: Arc.ProposalIdOption) =>
    `Executing "${elipsis(proposalTitle, 22)}"`,
  'Redeemer.redeem': (proposalTitle, {proposalId}: Arc.RedeemConfig) =>
    `Redeeming rewards for "${elipsis(proposalTitle, 22)}"`,
  'GenesisProtocol.redeemDaoBounty': (proposalTitle, {proposalId}: Arc.RedeemConfig) =>
    `Redeeming bounty rewards for "${elipsis(proposalTitle, 22)}"`,
  'ContributionReward.proposeContributionReward': (proposalTitle, {}: Arc.ProposeContributionRewardParams) =>
    `Creating proposal ${elipsis(proposalTitle, 22)}`,
  'ContributionReward.redeemContributionReward': (proposalTitle, {proposalId}: Arc.ContributionRewardRedeemParams) =>
    `Redeeming contribution reward for "${elipsis(proposalTitle, 22)}"`,
  'DAO.new': (proposalTitle, {}: Arc.NewDaoConfig) =>
    `Creating a new DAO`,
  'StandardToken.approve': (proposalTitle, {amount}: Arc.StandardTokenApproveOptions) =>
    `Approving ${Util.fromWei(new BigNumber(amount))} GEN for staking`
}

/**
 * Effect for automatically showing and updating notifications based on transaction updates.
 */
export const notificationUpdater: Middleware =
  ({ getState, dispatch }) =>
  (next) => {
    const transaction2Notification = (network: string, id: string, {error, status, functionName, options, txHash, proposalTitle}: IOperation) => {
      const actionMessage = messages[functionName] && messages[functionName](proposalTitle, options);
      const errorReason = error ?
        (
          error === OperationError.Canceled ?
            'you canceled the tx' :
          error === OperationError.Reverted ?
            'the tx was reverted' :
          error === OperationError.OutOfGas ?
            'of insufficient gas' :
            `of unknown reason, contact us at https://discord.gg/3d5C2y7`
        ) : '';

      let fullErrorMessage;
      if (error && error !== OperationError.Canceled && error !== OperationError.Reverted && error !== OperationError.OutOfGas) {
        fullErrorMessage = error;
      }

      const message = actionMessage && `${actionMessage} ${error ? `failed because ${errorReason}` : ''}`;

      /**
       * Translate a transaction update into a notification.
       */
      showNotification(
        error ?
          NotificationStatus.Failure :
        status === OperationStatus.Complete ?
          NotificationStatus.Success :
          NotificationStatus.Pending,
        message,
        fullErrorMessage,
        error ?
          'transaction failed' :
        status === OperationStatus.Started ?
          'waiting for signature' :
        status === OperationStatus.Sent ?
          'transaction sent' :
          'transaction complete',
        txHash && `https://${network !== 'live' ? `${network}.` : ''}etherscan.io/tx/${txHash}`,
        id,
        +moment()
      )(dispatch)
    }

    return (action: any) => {

      (async () => {

        const state = getState() as any as IRootState;
        const network = (await Arc.Utils.getNetworkName()).toLowerCase();

        if (action.type === REHYDRATE) {
          const a = action as RehydrateAction;
          if (a.payload) {
            const operations = a.payload.operations as IOperationsState;
            Object.keys(operations).forEach((id) => {
              if (operations[id].status === OperationStatus.Sent || operations[id].error) {
                transaction2Notification(network, id, operations[id]);
              }
            })
          }
        }

        if (isOperationsAction(action) && action.type === 'Operations/Update') {
          const {payload: {id, operation}} = action as IUpdateOperation;
          transaction2Notification(network, id, operation)
        }

        // also dismiss the corrosponding operation if it exists.
        if (isNotificationsAction(action) && action.type === 'Notifications/Dismiss') {
          const {payload: {id}} = action as IDismissNotification;
          dismissOperation(action.payload.id)(dispatch);
        }
      })()

      return next(action);
    }
  }
