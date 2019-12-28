import { ICompetitionProposal, Competition, CompetitionScheme } from "@daostack/client";
import * as Redux from "redux";
import { ThunkAction } from "redux-thunk";

import moment = require("moment");
import { getArc } from "arc";
import { operationNotifierObserver } from "actions/arcActions";
import { IRootState } from "reducers";

export interface ICompetitionStatus {
  complete: boolean;
  endTime: moment.Moment;
  now: moment.Moment;
  open: boolean;
  paused: boolean;
  startTime: moment.Moment;
  solutionsEndTime: moment.Moment;
  text: string;
  voting: boolean;
  votingStartTime: moment.Moment;
}

export const competitionStatus = (competition: ICompetitionProposal): ICompetitionStatus => {
  const now = moment();
  const startTime = moment(competition.startTime);
  const solutionsEndTime = moment(competition.suggestionsEndTime);
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
    if (now.isSameOrAfter(solutionsEndTime)) {
      paused = true;
      text = "Paused";
    } else {
      open = true;
      text = "Open for suggestions";
    }
  } else if (now.isBefore(endTime)) {
    voting = true;
    text = "Voting started!";
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
    solutionsEndTime,
    startTime,
    text,
    voting,
    votingStartTime,
  };
};

export interface ICreateSolutionOptions {
  description: string;
  title: string;
  url: string;
  tags: Array<string>;
}

export const createCompetitionSolution = (proposalId: string, options: ICreateSolutionOptions ): ThunkAction<any, IRootState, null> => {
  return async (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    try {
      const observer = operationNotifierObserver(dispatch, "Create Solution");
      const competition = new Competition(proposalId, getArc());
      await competition.createSuggestion(options).subscribe(...observer);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      throw err;
    }
  };
};

export interface IVoteSolutionOptions {
  suggestionId: number;
}

export const voteForSolution = (schemeId: string, options: IVoteSolutionOptions ): ThunkAction<any, IRootState, null> => {
  return async (dispatch: Redux.Dispatch<any, any>, _getState: () => IRootState) => {
    try {
      const observer = operationNotifierObserver(dispatch, "Vote Solution");
      const competitionScheme = new CompetitionScheme(schemeId, getArc());

      await competitionScheme.vote({suggestionId: options.suggestionId.toString()}).subscribe(...observer);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      throw err;
    }
  };
};
