import { ICompetitionProposalState, Competition, CompetitionSuggestion, ICompetitionSuggestionState, CompetitionVote, Address } from "@daostack/client";
import * as Redux from "redux";
import { ThunkAction } from "redux-thunk";

import moment = require("moment");
import { getArc } from "arc";
import { operationNotifierObserver } from "actions/arcActions";
import { IRootState } from "reducers";
import { Observable, of } from "rxjs";
import { map, mergeMap, toArray, first } from "rxjs/operators";

/**
 * Defined in the order that Competition cards should be sorted in the List component.
 * The string values are how the stati should appear in the GUI.
 */
export enum CompetitionStatusEnum {
  VotingStarted = "Voting started!",
  Paused = "Paused",
  OpenForSubmissions = "Open for submissions",
  NotOpenYet = "Not open yet",
  EndingNoSubmissions = "Ending, no submissions",
  Ended = "Ended",
  EndedNoWinners = "Ended, no winners",
  EndedNoSubmissions = "Ended, no submissions",
}

export class CompetitionStatus {
  constructor(public status: CompetitionStatusEnum, public now: moment.Moment) {
  }

  public get open() { return ( this.status === CompetitionStatusEnum.OpenForSubmissions); }
  public get paused() { return ( this.status === CompetitionStatusEnum.Paused); }
  public get voting() { return ( this.status === CompetitionStatusEnum.VotingStarted) || ( this.status === CompetitionStatusEnum.EndingNoSubmissions); }
  public get complete() { return ( this.status === CompetitionStatusEnum.EndedNoSubmissions) || ( this.status === CompetitionStatusEnum.EndingNoSubmissions); }
  public get text(): string { return this.status; }
}

export const competitionStatus = (
  competition: ICompetitionProposalState,
  submissions: Array<ICompetitionSuggestionState>): CompetitionStatus => {

  const now = moment();
  const startTime = moment(competition.startTime);
  const submissionsEndTime = moment(competition.suggestionsEndTime);
  const votingStartTime = moment(competition.votingStartTime);
  const endTime = moment(competition.endTime);
  const hasWinners = !!submissions.filter((submission) => submission.isWinner).length;

  let status: CompetitionStatusEnum;

  if (now.isBefore(startTime)){
    status = CompetitionStatusEnum.NotOpenYet;
  } else if (now.isBefore(votingStartTime)) {
    if (now.isSameOrAfter(submissionsEndTime)) {
      status = CompetitionStatusEnum.Paused;
    } else {
      status = CompetitionStatusEnum.OpenForSubmissions;
    }
  } else if (now.isBefore(endTime)) {
    status = submissions.length ? CompetitionStatusEnum.VotingStarted : CompetitionStatusEnum.EndingNoSubmissions;
  } else {
    status = submissions.length ? (hasWinners ? CompetitionStatusEnum.Ended : CompetitionStatusEnum.EndedNoWinners) : CompetitionStatusEnum.EndedNoSubmissions;
  }

  return new CompetitionStatus(status, now);
};

export interface ICreateSubmissionOptions {
  description: string;
  title: string;
  url: string;
  tags: Array<string>;
}

export const createCompetitionSubmission = (proposalId: string, options: ICreateSubmissionOptions ): ThunkAction<any, IRootState, null> => {
  return async (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    try {
      const observer = operationNotifierObserver(dispatch, "Create Submission");
      const competition = new Competition(proposalId, getArc());
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
      const submission = new CompetitionSuggestion(options.id, getArc());

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
      const submission = new CompetitionSuggestion(options.id, getArc());

      await submission.redeem().subscribe(...observer);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      throw err;
    }
  };
};


/**
 * must be an exact subset of ICompetitionSuggestionQueryOptions
 */
export interface IGetSubmissionsOptions {
  id?: string; // id of the competition
  suggestionId?: string; // the "suggestionId" is a counter that is unique to the scheme
  // - and is not to be confused with suggestion.id
}


const getSubmissions = (
  proposalId: string,
  options?: IGetSubmissionsOptions,
  subscribe = false
): Observable<Array<ICompetitionSuggestionState>> => {
  const competition = new Competition(proposalId, getArc());
  // fetchAllData so .state() comes from cache
  return competition.suggestions({ where: options }, { subscribe, fetchAllData: true })
    .pipe(
      mergeMap(submissions => of(submissions).pipe(
        mergeMap(submissions => submissions),
        mergeMap((submission: CompetitionSuggestion) => submission.state().pipe(first())),
        toArray()
      ))
    );
};

export const getProposalSubmissions = (proposalId: string, subscribe = false): Observable<Array<ICompetitionSuggestionState>> => {
  return getSubmissions(proposalId, undefined, subscribe);
};

export const getProposalSubmission = (proposalId: string, id: string, subscribe = false): Observable<ICompetitionSuggestionState> => {
  return getSubmissions(proposalId, { id }, subscribe).pipe(
    map((suggestions: Array<ICompetitionSuggestionState>) => suggestions.length ? suggestions[0]: null ));
};

export const getCompetitionVotes = (competitionId: string, voterAddress?: Address, subscribe = false): Observable<Array<CompetitionVote>> => {
  const options = Object.assign({ proposal: competitionId }, voterAddress ? { voter: voterAddress } : {} );
  return CompetitionVote.search(getArc(), { where: options}, { subscribe: subscribe, fetchAllData: false });
};

export const getSubmissionVotes = (submissionId: string, voterAddress?: Address, subscribe = false): Observable<Array<CompetitionVote>> => {
  // submissionId is the actual id, not the count
  const submission = new CompetitionSuggestion(submissionId, getArc());
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
