import { IProposalStage, IProposalState } from "@daostack/arc.js";

import BN = require("bn.js");
import classNames from "classnames";
import { fromWei } from "lib/util";
import * as React from "react";

import * as css from "./VoteGraph.scss";

interface IProps {
  proposalState: IProposalState;
  size: number;
  newVotesAgainst?: BN;
  newVotesFor?: BN;
}

export default class VoteGraph extends React.Component<IProps, null> {
  public render(): RenderOutput {
    const { newVotesAgainst, newVotesFor, proposalState, size } = this.props;

    const totalReputationSupply = fromWei(proposalState.totalRepWhenCreated);
    const votesFor = fromWei(proposalState.votesFor.add(newVotesFor || new BN(0)));
    const votesAgainst = fromWei(proposalState.votesAgainst.add(newVotesAgainst || new BN(0)));

    // If percentages are less than 2 then set them to 2 so they can be visibly noticed
    const yesPercentage = totalReputationSupply && votesFor ? Math.max(2, +(votesFor / totalReputationSupply * 100).toFixed(2)) : 0;
    const noPercentage = totalReputationSupply && votesAgainst ? Math.max(2, +(votesAgainst / totalReputationSupply * 100).toFixed(2)) : 0;

    const yesWinning = yesPercentage > noPercentage;
    const noWinning = noPercentage >= yesPercentage;

    const containerClass = classNames({
      [css.container]: true,
      [css.noWinning]: noWinning,
      [css.yesWinning]: yesWinning,
    });

    const relative = proposalState.stage === IProposalStage.Boosted || proposalState.stage === IProposalStage.QuietEndingPeriod;
    const displayYesPercentage = relative ? yesPercentage / Math.max(1, yesPercentage + noPercentage) * 100 : yesPercentage;
    const displayNoPercentage = relative ? noPercentage / Math.max(1, yesPercentage + noPercentage) * 100 : noPercentage;

    return (
      <div className={containerClass}>
        <img className={css.yesWinning} src="/assets/images/Icon/vote/for.svg" />
        <img className={css.noWinning} src="/assets/images/Icon/vote/against.svg" />
        <svg className={css.yesVotesCircle} viewBox="0 0 33.83098862 33.83098862" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
          <circle stroke="#efefef" strokeWidth="2" fill="none" cx="16.91549431" cy="16.91549431" r="15.91549431" />
          {displayYesPercentage ?
            <circle className={css.circleChartCircle} stroke="rgba(2, 190, 144, 1.000)" strokeWidth="2" strokeDasharray={displayYesPercentage + ",100"} strokeLinecap="round" fill="none" cx="16.91549431" cy="16.91549431" r="15.91549431" />
            : ""
          }
        </svg>
        <svg className={css.noVotesCircle} viewBox="0 0 33.83098862 33.83098862" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
          {displayNoPercentage ?
            <circle className={css.circleChartCircle + " " + css.circleChartCircleNegative} stroke="rgba(246, 80, 80, 1.000)" strokeWidth="2" strokeDasharray={displayNoPercentage + ",100"} strokeLinecap="round" fill="none" cx="16.91549431" cy="16.91549431" r="15.91549431" />
            : ""
          }
        </svg>
      </div>
    );
  }
}
