import { createSelector } from "reselect";
import { IRootState } from '../reducers';
import { IOperation, IOperationsState, OperationStatus } from "../reducers/operations";
import { VoteOptions } from "reducers/arcReducer";

const operations = (state: IRootState) => state.operations

export const isVotePending = (proposalId: string, vote: VoteOptions) =>
  createSelector(
    [operations],
    (operations: IOperationsState) => {
      return Object.keys(operations)
        .filter((k) =>
          operations[k].status !== OperationStatus.Complete && !operations[k].error &&
          operations[k].functionName === 'GenesisProtocol.vote' &&
          operations[k].options.proposalId === proposalId &&
          operations[k].options.vote === vote
        )
        .length > 0
    }
  )

export const isStakePending = (proposalId: string, vote: VoteOptions) =>
  createSelector(
    [operations],
    (operations: IOperationsState) => {
      return Object.keys(operations)
        .filter((k) =>
          operations[k].status !== OperationStatus.Complete && !operations[k].error &&
          operations[k].functionName === 'GenesisProtocol.stake' &&
          operations[k].options.proposalId === proposalId &&
          operations[k].options.vote === vote
        )
        .length > 0
    }
  )
