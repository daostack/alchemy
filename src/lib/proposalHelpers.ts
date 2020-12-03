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

type ProposalStatus = "Passing" | "Failing" | "Executable" | "Executed" | "Failed";

export const castProposalStageToNumber = (stage: string): IProposalStage => {
  switch (stage) {
    case "ExpiredInQueue":
      return 0;
    case "Queued":
      return 2;
    case "PreBoosted":
      return 3;
    case "Boosted":
      return 4;
    case "QuietEndingPeriod":
      return 5;
    case "Executed":
      return 1;
  }
};

export const closingTime = (proposal: IProposalState) => {
  let stage = proposal.stage;
  if (typeof proposal.stage === "string") {
    stage = castProposalStageToNumber(proposal.stage);
  }
  switch (stage) {
    case IProposalStage.ExpiredInQueue:
    case IProposalStage.Queued:
      return moment((Number(proposal.createdAt) + Number(proposal.genesisProtocolParams.queuedVotePeriodLimit)) * 1000);
    case IProposalStage.PreBoosted:
      return moment((Number(proposal.preBoostedAt) + Number(proposal.genesisProtocolParams.preBoostedVotePeriodLimit)) * 1000);
    case IProposalStage.Boosted:
      return moment((Number(proposal.boostedAt) + Number(proposal.genesisProtocolParams.boostedVotePeriodLimit)) * 1000);
    case IProposalStage.QuietEndingPeriod:
      return moment((Number(proposal.quietEndingPeriodBeganAt) + Number(proposal.genesisProtocolParams.quietEndingPeriod)) * 1000);
    case IProposalStage.Executed:
      return moment(Number(proposal.executedAt) * 1000);
  }
};

export const calculateProposalStatus = (proposal: IProposalState): ProposalStatus => {
  const { winningOutcome, executedAt } = proposal;
  const endDateMoment = moment(closingTime(proposal));
  const now = new Date();
  const complete = endDateMoment.diff(now) <= 0 ? true : false;

  if (String(winningOutcome) === "Pass") {
    if (!complete) {
      return "Passing";
    }
    if (executedAt) {
      return "Executed";
    }
    return "Executable";

  } else {
    if (!complete) {
      return "Failing";
    }
    return "Failed";
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
