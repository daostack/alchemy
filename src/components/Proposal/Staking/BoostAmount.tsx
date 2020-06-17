import { formatTokens } from "lib/util";
import { IProposalStage, IProposalState } from "@daostack/arc.js";

import classNames from "classnames";
import * as React from "react";
import * as css from "./BoostAmount.scss";


interface IProps {
  detailView?: boolean;
  expired?: boolean;
  proposalState: IProposalState;
}

export default class BoostAmount extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const {
      detailView,
      expired,
      proposalState,
    } = this.props;

    const wrapperClass = classNames({
      [css.wrapper]: true,
      [css.detailView]: detailView,
    });
    const nothing = <span className={css.boostedAmount}><b>&nbsp;</b></span>;

    return (
      <div className={wrapperClass}>
        {
          proposalState.stage === IProposalStage.Queued && !expired && proposalState.upstakeNeededToPreBoost.gten(0) ?
            <span className={css.boostedAmount}>
              <b>
                {detailView ? <img src="/assets/images/Icon/Boost-slate.svg" /> : ""}
                &gt; {formatTokens(proposalState.upstakeNeededToPreBoost, "GEN")} on Pass to boost
              </b>
            </span>
            : proposalState.stage === IProposalStage.PreBoosted && proposalState.downStakeNeededToQueue.lten(0) ?
              <span className={css.boostedAmount}>
                <b>
                  {detailView ? <img src="/assets/images/Icon/Boost-slate.svg" /> : ""}
                &gt; {formatTokens(proposalState.downStakeNeededToQueue.abs(), "GEN")} on Pass to stay boosted
                </b>
              </span>
              : proposalState.stage === IProposalStage.PreBoosted && proposalState.downStakeNeededToQueue.gtn(0) ?
                <span className={css.boostedAmount + " " + css.unboostAmount}>
                  <b>
                    {detailView ? <img src="/assets/images/Icon/Boost-slate.svg" /> : ""}
                &gt;=  {formatTokens(proposalState.downStakeNeededToQueue, "GEN")} on Fail to un-boost
                  </b>
                </span>
                : nothing
        }
      </div>
    );
  }
}
