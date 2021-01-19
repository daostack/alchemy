export enum AsyncActionSequence {
  Pending = "pending",
  Failure = "failure",
  Success = "success"
}

/**
 * Defines a type-safe action for async actions which can be pending, can fail or successeed.
 * The `type` and `meta` should be the same accross actions which represent the same "operation".
 */
export interface IAsyncAction<Type extends string, Meta, Payload> {
  type: Type;
  meta?: Meta;
  sequence: AsyncActionSequence;
  payload?: Payload;
}
