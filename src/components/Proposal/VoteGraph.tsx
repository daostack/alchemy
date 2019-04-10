import * as React from "react";

import * as classNames from "classnames";

import * as css from "./VoteGraph.scss";

interface IProps {
  detailView?: boolean;
  noPercentage: number;
  relative?: boolean;
  size: number;
  yesPercentage: number;
}

export default class VoteGraph extends React.Component<IProps, null> {
  public render() {
    const { detailView, noPercentage, relative, size, yesPercentage} = this.props;

    const yesWinning = yesPercentage > noPercentage;
    const noWinning = noPercentage > yesPercentage;

    const containerClass = classNames({
      [css.container] : true,
      [css.detailView] : detailView,
      [css.noWinning] : noWinning,
      [css.yesWinning] : yesWinning
     });

    const displayYesPercentage = relative ? yesPercentage / Math.max(1, yesPercentage + noPercentage) * 100 : yesPercentage;
    const displayNoPercentage = relative ? noPercentage / Math.max(1, yesPercentage + noPercentage) * 100 : noPercentage;

    return (
      <div className={containerClass}>
        <img className={css.yesWinning} src="/assets/images/Icon/Vote/for.svg"/>
        <img className={css.noWinning} src="/assets/images/Icon/Vote/against.svg"/>
        <svg className={css.yesVotesCircle} viewBox="0 0 33.83098862 33.83098862" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
          <circle stroke="#efefef" strokeWidth="2" fill="none" cx="16.91549431" cy="16.91549431" r="15.91549431" />
          <circle className={css.circleChartCircle} stroke="rgba(2, 190, 144, 1.000)" strokeWidth="2" strokeDasharray={displayYesPercentage + ",100"} strokeLinecap="round" fill="none" cx="16.91549431" cy="16.91549431" r="15.91549431" />
        </svg>
        <svg className={css.noVotesCircle} viewBox="0 0 33.83098862 33.83098862" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
          <circle className={css.circleChartCircle + " " + css.circleChartCircleNegative} stroke="rgba(246, 80, 80, 1.000)" strokeWidth="2" strokeDasharray={displayNoPercentage + ",100"} strokeLinecap="round" fill="none" cx="16.91549431" cy="16.91549431" r="15.91549431" />
        </svg>
      </div>
    );
  }
}
