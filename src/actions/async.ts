export enum AsyncActionSequence {
  Reset = 'reset',
  Pending = 'pending',
  Failure = 'failure',
  Success = 'success'
}

export interface IOperationConfig {
  ttl?: number;
  message?: string;
  totalSteps?: number;
}

export interface IAsyncAction<Type extends string, Meta, Payload> {
  type: Type;
  meta: Meta;
  sequence: AsyncActionSequence;
  operation?: IOperationConfig
  payload: Payload;
}

export const isAsyncAction = (action: any): action is IAsyncAction<any, any, any> =>
  typeof action.type === 'string' && Object.keys(AsyncActionSequence).map((k: any) => AsyncActionSequence[k]).indexOf(action.sequence) !== -1;
