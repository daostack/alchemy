
/**
 * Defines different optional features that affect how the `operationsReducer` will treat the action.
 */
export interface IOperationConfig {
  ttl?: number;
  message?: string;
  totalSteps?: number;
}

export enum AsyncActionSequence {
  Reset = 'reset',
  Pending = 'pending',
  Failure = 'failure',
  Success = 'success'
}

/**
 * Defines a type-safe action for async actions which can be pending, can fail or successeed and can be resetted/canceled.
 * The `type` and `meta` should be the same accross actions which represent the same "operation".
 */
export interface IAsyncAction<Type extends string, Meta, Payload> {
  type: Type;
  meta: Meta;
  sequence: AsyncActionSequence;
  operation?: IOperationConfig
  payload?: Payload;
}

export const isAsyncAction = (action: any): action is IAsyncAction<any, any, any> =>
  typeof action.type === 'string' && Object.keys(AsyncActionSequence).map((k: any) => AsyncActionSequence[k]).indexOf(action.sequence) !== -1;
