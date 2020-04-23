import { ICompetitionProposalState } from "@daostack/client-experimental";
import * as React from "react";
import classNames from "classnames";
import { competitionStatus } from "./utils";
import * as css from "./Competitions.scss";

export interface IExternalProps {
  competition: ICompetitionProposalState;
}
/**
 * displays the current status of a competition
 */
export default class StatusBlob extends React.Component<IExternalProps, null> {

  public render(): RenderOutput {
    const status = competitionStatus(this.props.competition);
    const hasNoSubmissions = !this.props.competition.totalSuggestions;
    return <div className={classNames({
      [css.statusBlob]: true,
      [css.open]: status.open,
      [css.voting]: status.voting,
      [css.noSubmissions]: hasNoSubmissions  } )}>{status.text}</div>;
  }
}
