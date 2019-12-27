import { ICompetitionProposal, Competition } from "@daostack/client";
import * as Redux from "redux";
import { ThunkAction } from "redux-thunk";

import moment = require("moment");
import { getArc } from "arc";
import { operationNotifierObserver } from "actions/arcActions";
import { ICreateSolutionOptions } from "components/Scheme/ContributionRewardExtRewarders/Competition/CreateSolution";
import { IRootState } from "reducers";

export interface ICompetitionStatus {
  endTime: moment.Moment;
  now: moment.Moment;
  open: boolean;
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

  let voting = false;
  let open = false;
  let text = "";

  if (now.isBefore(startTime)){
    text = "Not open yet";
  } else if (now.isBefore(votingStartTime)) {
    if (now.isSameOrAfter(solutionsEndTime)) {
      text = "Paused";
    } else {
      open = true;
      text = "Open for suggestions";
    }
  } else if (now.isBefore(endTime)) {
    voting = true;
    text = "Voting started!";
  } else {
    text = "Complete";
  }

  return {
    endTime,
    now,
    open,
    solutionsEndTime,
    startTime,
    text,
    voting,
    votingStartTime,
  };
};

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
