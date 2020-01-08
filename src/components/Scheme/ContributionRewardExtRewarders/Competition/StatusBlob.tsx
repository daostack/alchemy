import { ICompetitionProposal, ICompetitionSuggestion } from "@daostack/client";
import * as React from "react";
import { competitionStatus } from "components/Scheme/ContributionRewardExtRewarders/Competition/utils";
import classNames from "classnames";
import * as css from "./Competitions.scss";

export interface IExternalProps {
  competition: ICompetitionProposal;
  submissions: Array<ICompetitionSuggestion>;
}

export default class StatusBlob extends React.Component<IExternalProps, null> {

  public render(): RenderOutput {
    const status = competitionStatus(this.props.competition, this.props.submissions);
    return <div className={classNames({[css.statusBlob]: true, [css.open]: status.open, [css.voting]: status.voting } )}>{status.text}</div>;
  }
}
