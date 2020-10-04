import { ICompetitionProposalState, CompetitionProposal, CompetitionSuggestion, ICompetitionSuggestionState, CompetitionVote, Address } from "@daostack/arc.js";
import * as Redux from "redux";
import { ThunkAction } from "redux-thunk";

import moment = require("moment");
import { getArc } from "arc";
import { operationNotifierObserver } from "actions/arcActions";
import { IRootState } from "reducers";
import { Observable, of } from "rxjs";
import { map, mergeMap, toArray, first } from "rxjs/operators";
import { safeMoment } from "lib/util";

/**
 * Defined in the order that Competition cards should be sorted in the List component.
 * The string values are how the stati should appear in the GUI.
 */
export enum CompetitionStatusEnum {
  Voting = "Voting started!",
  Paused = "Paused",
  OpenForSubmissions = "Open for submissions",
  NotOpenYet = "Not open yet",
  EndingNoSubmissions = "Ending, no submissions",
  Ended = "Ended with winners",
  EndedNoWinners = "Ended, no winners",
  EndedNoSubmissions = "Ended, no submissions",
}

export class CompetitionStatus {
  constructor(
    public status: CompetitionStatusEnum,
    public now: moment.Moment,
    public competition: ICompetitionProposalState,
    public hasWinners: boolean) {
  }
  public get notStarted(): boolean { return this.status === CompetitionStatusEnum.NotOpenYet; }
  /**
   * open for submissions
   */
  public get open(): boolean { return this.status === CompetitionStatusEnum.OpenForSubmissions; }
  /**
   * In between submissions and voting period, and there exist submissions.
   */
  public get paused(): boolean { return this.status === CompetitionStatusEnum.Paused; }
  /**
   * in voting period, but not implying there are any submissions
   */
  public get inVotingPeriod(): boolean {
    return this.now.isSameOrAfter(this.competition.votingStartTime) && (this.status !== CompetitionStatusEnum.Ended);
  }
  /**
   * in voting period and there are submissions
   */
  public get voting(): boolean { return this.status === CompetitionStatusEnum.Voting; }
  /**
   * Voting can no longer occur. Implies neither thatn any voting has occurred,
   * nor the actual current stage (entire competition may or may not be over).
   */
  public get votingIsOver(): boolean {
    return ((this.status === CompetitionStatusEnum.Ended) ||
            (this.status === CompetitionStatusEnum.EndedNoWinners) ||
            (this.status === CompetitionStatusEnum.EndedNoSubmissions));
  }
  /**
   * competition is over, with or without submissions or winners
   */
  public get over(): boolean { return this.now.isSameOrAfter(this.competition.endTime); }
  /**
   * Competition is over with winners
   */
  public get overWithWinners(): boolean { return this.status === CompetitionStatusEnum.Ended; }
  public get text(): string { return this.status; }
}

export const competitionStatus = (competition: ICompetitionProposalState): CompetitionStatus => {
  const now = moment();
  const startTime = safeMoment(competition.startTime);
  const submissionsEndTime = safeMoment(competition.suggestionsEndTime);
  const votingStartTime = safeMoment(competition.votingStartTime);
  const endTime = safeMoment(competition.endTime);
  const hasSubmissions = !!competition.totalSuggestions;
  const hasWinners = !!competition.numberOfWinningSuggestions;
  let status: CompetitionStatusEnum;

  if (now.isBefore(startTime)){
    status = CompetitionStatusEnum.NotOpenYet;
  } else if (now.isBefore(votingStartTime)) {
    if (now.isSameOrAfter(submissionsEndTime)) {
      status = hasSubmissions ? CompetitionStatusEnum.Paused : CompetitionStatusEnum.EndingNoSubmissions;
    } else {
      status = CompetitionStatusEnum.OpenForSubmissions;
    }
  } else if (now.isBefore(endTime)) {
    status = hasSubmissions ? CompetitionStatusEnum.Voting : CompetitionStatusEnum.EndingNoSubmissions;
  } else {
    status = hasSubmissions ? (hasWinners ? CompetitionStatusEnum.Ended : CompetitionStatusEnum.EndedNoWinners) : CompetitionStatusEnum.EndedNoSubmissions;
  }

  return new CompetitionStatus(status, now, competition, hasWinners);
};

export interface ICreateSubmissionOptions {
  beneficiary?: Address;
  description: string;
  title: string;
  url: string;
  tags: Array<string>;
}

export const createCompetitionSubmission = (proposalId: string, options: ICreateSubmissionOptions ): ThunkAction<any, IRootState, null> => {
  return async (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    try {
      const observer = operationNotifierObserver(dispatch, "Create Submission");
      const competition = new CompetitionProposal(getArc(), proposalId);
      await competition.createSuggestion(options).subscribe(...observer);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      throw err;
    }
  };
};

export interface IVoteSubmissionOptions {
  id: string; // actual id, not the counter
}

export const voteForSubmission = (options: IVoteSubmissionOptions ): ThunkAction<any, IRootState, null> => {
  return async (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    try {
      const observer = operationNotifierObserver(dispatch, "Vote Submission");
      const submission = new CompetitionSuggestion(getArc(), options.id);

      await submission.vote().subscribe(...observer);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      throw err;
    }
  };
};

export interface IVoteSubmissionOptions {
  id: string; // actual id, not the counter
}

export const redeemForSubmission = (options: IVoteSubmissionOptions ): ThunkAction<any, IRootState, null> => {
  return async (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    try {
      const observer = operationNotifierObserver(dispatch, "Redeem Submission");
      const submission = new CompetitionSuggestion(getArc(), options.id);

      await submission.redeem().subscribe(...observer);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      throw err;
    }
  };
};

export const getProposalSubmissions = (proposalId: string, subscribe = false): Observable<Array<ICompetitionSuggestionState>> => {
  // fetchAllData so .state() comes from cache
  const competition = new CompetitionProposal(getArc(), proposalId);
  return competition.suggestions({}, { subscribe, fetchAllData: true })
    .pipe(
      mergeMap(submissions => of(submissions).pipe(
        mergeMap(submissions => submissions),
        mergeMap((submission: CompetitionSuggestion) => submission.state().pipe(first())),
        toArray()
      )));
};

export const getSubmission = (id: string, subscribe = false): Observable<ICompetitionSuggestionState> => {
  const submission = new CompetitionSuggestion(getArc(), id);
  return submission.state({ subscribe });
};

export const getCompetitionVotes = (competitionId: string, voterAddress: Address, subscribe = false): Observable<Array<CompetitionVote>> => {
  const competition = new CompetitionProposal(getArc(), competitionId);
  /**
   * none of the current uses require the vote state
   */
  return competition.competitionVotes({ where: { voter: voterAddress.toLowerCase() } } as any,
    { subscribe: subscribe, fetchAllData: true });
};

const getSubmissionVotes = (submissionId: string, voterAddress?: Address, subscribe = false): Observable<Array<CompetitionVote>> => {
  // submissionId is the actual id, not the count
  const submission = new CompetitionSuggestion(getArc(), submissionId);
  return submission.votes(voterAddress ? { where: { voter: voterAddress } } : {}, { subscribe, fetchAllData: true });
};

export const getSubmissionVoterHasVoted = (submissionId: string, voterAddress: string, subscribe = false): Observable<boolean> => {
  if (!voterAddress) {
    return of(false);
  }
  // submissionId is the actual id, not the count
  return getSubmissionVotes(submissionId, voterAddress, subscribe)
    .pipe(map((votes: Array<CompetitionVote>) => !!votes.length));
};
