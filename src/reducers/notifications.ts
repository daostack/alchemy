import { Action, Dispatch, Middleware } from 'redux';
import * as moment from 'moment';
import { isOperationsAction, OperationStatus, OperationError, IOperationsState } from './operations';
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
    id: string = `${Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)}`,
    timestamp: number = +moment(),
  ) => (dispatch: Dispatch<any>) =>
    dispatch(filterUndefined({
      type: 'Notifications/Show',
      payload: {
        id,
        status,
        title,
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

/**
 * A map of messages to show for each type of action.
 */
const messages: {[key: string]: (state: IRootState, options: any) => string} = {
  'GenesisProtocol.vote': (state, {vote, proposalId}: Arc.VoteOptions) =>
    `Voting ${vote === VoteOptions.Yes ? 'Yes' : 'No'} on ${state.arc.proposals[proposalId].title}`,
  'GenesisProtocol.stake': (state, {vote, proposalId, amount}: Arc.StakeConfig) =>
    `Predicting ${vote === VoteOptions.Yes ? 'Pass' : 'Fail'} on ${state.arc.proposals[proposalId].title} with ${Util.fromWei(new BigNumber(amount)).toNumber()} GEN`,
  'GenesisProtocol.execute': (state, {proposalId}: Arc.ProposalIdOption) =>
    `Exeuting "${state.arc.proposals[proposalId].title}"`,
  'GenesisProtocol.redeem': (state, {proposalId}: Arc.RedeemConfig) =>
    `Redeeming rewards for "${state.arc.proposals[proposalId].title}"`,
  'GenesisProtocol.redeemDaoBounty': (state, {proposalId}: Arc.RedeemConfig) =>
    `Redeeming bounty rewards for "${state.arc.proposals[proposalId].title}"`,
  'ContributionReward.proposeContributionReward': (state, {title}: Arc.ProposeContributionRewardParams & {title: string}) =>
    `Creating proposal ${title}`,
  'ContributionReward.redeemContributionReward': (state, {proposalId}: Arc.ContributionRewardRedeemParams) =>
    `Redeeming contribution reward for "${state.arc.proposals[proposalId].title}"`,
  'DAO.new': (state, {}: Arc.NewDaoConfig) =>
    `Creating a new DAO`,
  'StandardToken.approve': (state, {amount}: Arc.StandardTokenApproveOptions) =>
    `Approving ${Util.fromWei(new BigNumber(amount)).toNumber()} GEN for staking`
}

/**
 * Effect for automatically showing and updating notifications based on transaction updates.
 */
export const notificationUpdater: Middleware =
  ({ getState, dispatch }) =>
  (next) => (action: any) => {

    if (isOperationsAction(action) && action.type === 'Operations/Update') {
      const {id, operation: {error, status, functionName, options}} = action.payload;

      const actionMessage = messages[functionName] && messages[functionName](getState() as any as IRootState, options);
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
      if (error && error !== OperationError.Canceled && error !== OperationError.Canceled && error !== OperationError.Canceled) {
        fullErrorMessage = error;
      }

      const message = actionMessage && `${actionMessage} ${error ? `failed because ${errorReason}` : ''}`;

      /**
       * Translate a transaction update into a notification.
       */
      showNotification(
        error ?
          NotificationStatus.Failure :
        status === OperationStatus.Mined ?
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
          'transaction mined',
        id,
        +moment()
      )(dispatch)
    }

    return next(action);
  }
