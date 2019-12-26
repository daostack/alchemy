import { ICompetitionProposal } from "@daostack/client";

import moment = require("moment");

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
