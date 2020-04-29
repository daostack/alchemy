import * as moment from "moment";

import { IProposalOutcome, IProposalStage, IProposalState } from "@daostack/arc.js";

export interface IRedemptionState {
  accountAddress: string;
  beneficiaryEth: number;
  beneficiaryNativeToken: number;
  beneficiaryReputation: number;
  beneficiaryExternalToken: number;
  proposalId: string;
  proposerReputation: number;
  proposal?: IProposalState;
  stakerReputation: number;
  stakerTokens: number;
  stakerBountyTokens: number;
  voterTokens: number;
  voterReputation: number;
}

export const closingTime = (proposal: IProposalState) => {
  switch (proposal.stage) {
    case IProposalStage.ExpiredInQueue:
    case IProposalStage.Queued:
      return moment((proposal.createdAt + proposal.genesisProtocolParams.queuedVotePeriodLimit) * 1000);
    case IProposalStage.PreBoosted:
      return moment((proposal.preBoostedAt + proposal.genesisProtocolParams.preBoostedVotePeriodLimit) * 1000);
    case IProposalStage.Boosted:
      return moment((proposal.boostedAt + proposal.genesisProtocolParams.boostedVotePeriodLimit) * 1000);
    case IProposalStage.QuietEndingPeriod:
      return moment((proposal.quietEndingPeriodBeganAt + proposal.genesisProtocolParams.quietEndingPeriod) * 1000);
    case IProposalStage.Executed:
      return moment(proposal.executedAt * 1000);
  }
};

export function proposalExpired(proposal: IProposalState) {
  const res = (
    (proposal.stage === IProposalStage.ExpiredInQueue) ||
    (proposal.stage === IProposalStage.Queued && closingTime(proposal) <= moment())
  );
  return res;
}

export function proposalEnded(proposal: IProposalState) {
  const res = (
    (proposal.stage === IProposalStage.Executed) || proposalExpired(proposal));
  return res;
}

export function proposalPassed(proposal: IProposalState) {
  const res = (
    (proposal.stage === IProposalStage.Executed && proposal.winningOutcome === IProposalOutcome.Pass)
  );
  return res;
}

export function proposalFailed(proposal: IProposalState) {
  const res = (
    (proposal.stage === IProposalStage.Executed && proposal.winningOutcome === IProposalOutcome.Fail) ||
    proposalExpired(proposal)
  );
  return res;
}
