import * as moment from "moment";

import { IProposalOutcome, IProposalStage, IProposalState } from "@daostack/arc.js";
import { safeMoment } from "lib/util";

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

export const closingTime = (proposal: IProposalState): moment.Moment => {
  switch (proposal.stage) {
    case IProposalStage.ExpiredInQueue:
    case IProposalStage.Queued:
      return safeMoment(proposal.createdAt).add(proposal.genesisProtocolParams.queuedVotePeriodLimit, "seconds");
    case IProposalStage.PreBoosted:
      return safeMoment(proposal.preBoostedAt).add(proposal.genesisProtocolParams.preBoostedVotePeriodLimit, "seconds");
    case IProposalStage.Boosted:
      return safeMoment(proposal.boostedAt).add(proposal.genesisProtocolParams.boostedVotePeriodLimit, "seconds");
    case IProposalStage.QuietEndingPeriod:
      return safeMoment(proposal.quietEndingPeriodBeganAt).add(proposal.genesisProtocolParams.quietEndingPeriod, "seconds");
    case IProposalStage.Executed:
      return safeMoment(proposal.executedAt);
  }
};

export function proposalExpired(proposal: IProposalState): boolean {
  const res = (
    (proposal.stage === IProposalStage.ExpiredInQueue) ||
    (proposal.stage === IProposalStage.Queued && closingTime(proposal) <= moment())
  );
  return res;
}

export function proposalEnded(proposal: IProposalState): boolean {
  const res = (
    (proposal.stage === IProposalStage.Executed) || proposalExpired(proposal));
  return res;
}

export function proposalPassed(proposal: IProposalState): boolean {
  const res = (
    (proposal.stage === IProposalStage.Executed && proposal.winningOutcome === IProposalOutcome.Pass)
  );
  return res;
}

export function proposalFailed(proposal: IProposalState): boolean {
  const res = (
    (proposal.stage === IProposalStage.Executed && proposal.winningOutcome === IProposalOutcome.Fail) ||
    proposalExpired(proposal)
  );
  return res;
}
