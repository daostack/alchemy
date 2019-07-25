import { VoteOptions } from "reducers/arcReducer";
import { createSelector } from "reselect";
import { IRootState } from "../reducers";
import { IOperationsState, OperationStatus } from "../reducers/operations";

const operations = (state: IRootState): IOperationsState => state.operations;

export type IStateChecker = (state: IRootState) => boolean;

export const isVotePending = (proposalId: string, vote: VoteOptions): IStateChecker =>
  createSelector(
    [operations],
    (operations: IOperationsState): boolean => {
      return Object.keys(operations)
        .filter((k: string): boolean =>
          operations[k].status !== OperationStatus.Complete && !operations[k].error &&
          (operations[k].functionName === "GenesisProtocol.vote" || operations[k].functionName === "IntVoteInterface.vote") &&
          operations[k].options.proposalId === proposalId &&
          operations[k].options.vote === vote
        )
        .length > 0;
    }
  );

export const isStakePending = (proposalId: string, vote: VoteOptions): IStateChecker =>
  createSelector(
    [operations],
    (operations: IOperationsState): boolean => {
      return Object.keys(operations)
        .filter((k: string): boolean =>
          operations[k].status !== OperationStatus.Complete && !operations[k].error &&
          (operations[k].functionName === "GenesisProtocol.stake" || operations[k].functionName === "IntVoteInterface.stake") &&
          operations[k].options.proposalId === proposalId &&
          operations[k].options.vote === vote
        )
        .length > 0;
    }
  );
