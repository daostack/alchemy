import { ICompetitionProposal, Competition, CompetitionSuggestion, ICompetitionSuggestion, CompetitionVote } from "@daostack/client";
import * as Redux from "redux";
import { ThunkAction } from "redux-thunk";

import moment = require("moment");
import { getArc } from "arc";
import { operationNotifierObserver } from "actions/arcActions";
import { IRootState } from "reducers";
import { Observable } from "rxjs";
import { map, first } from "rxjs/operators";

export interface ICompetitionStatus {
  complete: boolean;
  endTime: moment.Moment;
  now: moment.Moment;
  open: boolean;
  paused: boolean;
  startTime: moment.Moment;
  submissionsEndTime: moment.Moment;
  text: string;
  voting: boolean;
  votingStartTime: moment.Moment;
}

export const competitionStatus = (
  competition: ICompetitionProposal,
  submissions: Array<ICompetitionSuggestion>): ICompetitionStatus => {

  const now = moment();
  const startTime = moment(competition.startTime);
  const submissionsEndTime = moment(competition.suggestionsEndTime);
  const votingStartTime = moment(competition.votingStartTime);
  const endTime = moment(competition.endTime);

  let complete = false;
  let voting = false;
  let open = false;
  let paused = false;
  let text = "";

  if (now.isBefore(startTime)){
    text = "Not open yet";
  } else if (now.isBefore(votingStartTime)) {
    if (now.isSameOrAfter(submissionsEndTime)) {
      paused = true;
      text = "Paused";
    } else {
      open = true;
      text = "Open for suggestions";
    }
  } else if (now.isBefore(endTime)) {
    voting = true;
    text = submissions.length ? "Voting started!" : "No submissions";
  } else {
    complete = true;
    text = "Complete";
  }

  return {
    complete,
    endTime,
    now,
    open,
    paused,
    submissionsEndTime,
    startTime,
    text,
    voting,
    votingStartTime,
  };
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
): Observable<Array<ICompetitionSuggestion>> => {
  // FAKE -- until we have IProposalState.competition.suggestions()
  const competition = new Competition(proposalId, getArc());
  // return props.proposalState.competition.suggestions({ where: { proposal: props.proposalState.id }}, { subscribe: true } )
  return competition.suggestions({ where: options }, { subscribe, fetchAllData: true })
    .pipe(
      // FAKE -- until .fetchStaticState() exists on CompetitionSuggestion
      // mergeMap((suggestions: Array<CompetitionSuggestion>) => suggestions.map((suggestion) => from(suggestion.fetchStaticState()) )),
      // concat()  (??)
      // or:
      // map((suggestions: Array<CompetitionSuggestion>) => suggestions.map((suggestion) => suggestion.staticState ))

      // work-around hack because CompetitionSuggestion actually contains all we need
      map((suggestions: Array<CompetitionSuggestion>) => suggestions.map((suggestion) => suggestion as unknown as ICompetitionSuggestion) )
    );
};

export const getProposalSubmissions = (proposalId: string, subscribe = false): Observable<Array<ICompetitionSuggestion>> => {
  return getSubmissions(proposalId, undefined, subscribe);
};

export const getProposalSubmission = (proposalId: string, id: string, subscribe = false): Observable<ICompetitionSuggestion> => {
  /** 
   * won't subscribe here because the only use case is SubmissionDetails where we can assume the suggestion has
   * been subscribed by CompetitionDetails from where SubmissionDetails is loaded.
   **/
  return getSubmissions(proposalId, { id }, subscribe).pipe(
    map((suggestions: Array<ICompetitionSuggestion>) => suggestions.length ? suggestions[0]: null ));
};


export const getSubmissionVoterHasVoted = (submissionId: string, voterAddress: string, subscribe = false): Observable<boolean> => {
  // submissionId is the actual id, not the count
  const submission = new CompetitionSuggestion(submissionId, getArc());
  return submission.votes({ where: { voter: voterAddress, suggestion: submissionId} }, { subscribe, fetchAllData: false })
    .pipe(map((votes: Array<CompetitionVote>) => !!votes.length), first());
};

// export const getCompetitionVotes = (competitionId: string, subscribe = false): Observable<Array<CompetitionVote>> => {
//   const submission = new CompetitionSuggestion(submissionId, getArc());
//   return submission.votes({ where: options }, { subscribe, fetchAllData: true });
// };

export const getSubmissionVotes = (submissionId: string, subscribe = false): Observable<Array<CompetitionVote>> => {
  // submissionId is the actual id, not the count
  const submission = new CompetitionSuggestion(submissionId, getArc());
  return submission.votes({ }, { subscribe, fetchAllData: true });
};
