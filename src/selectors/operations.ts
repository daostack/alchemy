import { createSelector } from "reselect";
import { IRootState } from '../reducers';
import { IOperation, IOperationsState, OperationStatus } from "../reducers/operations";
import { VoteOptions } from "reducers/arcReducer";
import Util from "../lib/util";

const operations = (state: IRootState) => state.operations

export const isVotePending = (proposalId: string, vote: VoteOptions) =>
  createSelector(
    [operations],
    (operations: IOperationsState) => {
      return Object.keys(operations)
        .filter((k) =>
          operations[k].status !== OperationStatus.Complete && !operations[k].error &&
          (operations[k].functionName === 'GenesisProtocol.vote' || operations[k].functionName === 'IntVoteInterface.vote') &&
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
          (operations[k].functionName === 'GenesisProtocol.stake' || operations[k].functionName === 'IntVoteInterface.stake') &&
          operations[k].options.proposalId === proposalId &&
          operations[k].options.vote === vote
        )
        .length > 0
    }
  )

export const isRedeemPending = (proposalId: string, beneficiary: string) =>
  createSelector(
    [operations],
    (operations: IOperationsState) => {
      return Object.keys(operations)
        .filter((k) =>
          operations[k].status !== OperationStatus.Complete && !operations[k].error &&
          operations[k].functionName === 'Redeemer.redeem' &&
          operations[k].options.proposalId === proposalId &&
          operations[k].options.beneficiaryAddress === beneficiary
        )
        .length > 0
    }
  )
