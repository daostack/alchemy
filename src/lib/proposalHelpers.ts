import * as moment from "moment";
import { IProposalOutcome, IProposalStage, IProposalState, Proposal } from "@daostack/arc.js";

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


/**
 * Proposal Status:
 * - Passing: On track to pass if nothing changes
 * - Failing: On track to fail if nothing changes
 * - Executable: Passed and hasn't been executed yet
 * - Executed: Passed and executed.
 * - Failed: Failed due to votes or running out of time before reaching quorum/boosting
 */
export const enum IProposalStatus {
  Passing = "Passing",
  Failing = "Failing",
  Executable = "Executable",
  Executed = "Executed",
  Failed = "Failed"
}

/**
 * This function converts Proposal Stage from it's string representation to it's number representation.
 * @param {string} stage Proposal stage string representation
 * @returns {IProposalStage} Proposal stage number representation
 */
export const castProposalStageToNumberRepresentation = (stage: string): IProposalStage => {
  switch (stage) {
    case "ExpiredInQueue":
      return 0;
    case "Executed":
      return 1;
    case "Queued":
      return 2;
    case "PreBoosted":
      return 3;
    case "Boosted":
      return 4;
    case "QuietEndingPeriod":
      return 5;
  }
};

export const closingTime = (proposal: IProposalState) => {
  let stage = proposal.stage;
  if (typeof proposal.stage === "string") {
    stage = castProposalStageToNumberRepresentation(proposal.stage);
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

/**
 * Given a proposal, calculates the proposal status.
 * @param {IProposalState} proposal
 * @returns {ProposalStatus}
 */
export const calculateProposalStatus = (proposal: IProposalState): IProposalStatus => {
  const { winningOutcome, executedAt } = proposal;
  const endDateMoment = moment(closingTime(proposal));
  const now = new Date();
  const complete = endDateMoment.diff(now) <= 0 ? true : false;

  if (String(winningOutcome) === "Pass") {
    if (!complete) {
      return IProposalStatus.Passing;
    }
    if (executedAt) {
      return IProposalStatus.Executed;
    }
    return IProposalStatus.Executable;

  } else {
    if (!complete) {
      return IProposalStatus.Failing;
    }
    return IProposalStatus.Failed;
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

/**
 * Sorts the proposals by:
 * - "Executable" proposals first
 * - Then by closing time, most recent to least.
 * @param proposalA
 * @param proposalB
 */
export const sortProposals = (proposalA: Proposal, proposalB: Proposal) => {
  const proposalAStatus = calculateProposalStatus(proposalA.staticState as IProposalState);
  const proposalBStatus = calculateProposalStatus(proposalB.staticState as IProposalState);
  if (proposalAStatus === IProposalStatus.Executable && proposalBStatus !== IProposalStatus.Executable) {
    return -1;
  }
  if ((proposalAStatus === IProposalStatus.Passing || proposalAStatus === IProposalStatus.Failing) && proposalBStatus !== IProposalStatus.Executable) {
    return -1;
  }
  return 1;
};
