import { ICompetitionProposalState, ICompetitionSuggestionState } from "@daostack/client";
import * as React from "react";
import classNames from "classnames";
import { competitionStatus } from "./utils";
import * as css from "./Competitions.scss";

export interface IExternalProps {
  competition: ICompetitionProposalState;
  submissions: Array<ICompetitionSuggestionState>;
}

export default class StatusBlob extends React.Component<IExternalProps, null> {

  public render(): RenderOutput {
    const status = competitionStatus(this.props.competition, this.props.submissions);
    return <div className={classNames({[css.statusBlob]: true, [css.open]: status.open, [css.complete]: status.complete, [css.voting]: status.voting, [css.noSubmissions]: !this.props.submissions.length  } )}>{status.text}</div>;
  }
}
