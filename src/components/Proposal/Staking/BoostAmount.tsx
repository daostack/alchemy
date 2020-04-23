import { formatTokens } from "lib/util";
import { IProposalStage, IProposalState } from "@daostack/client";

import classNames from "classnames";
import * as React from "react";
import * as css from "./BoostAmount.scss";


interface IProps {
  detailView?: boolean;
  expired?: boolean;
  proposal: IProposalState;
}

export default class BoostAmount extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const {
      detailView,
      expired,
      proposal,
    } = this.props;

    const wrapperClass = classNames({
      [css.wrapper]: true,
      [css.detailView]: detailView,
    });
    const nothing = <span className={css.boostedAmount}><b>&nbsp;</b></span>;

    return (
      <div className={wrapperClass}>
        {
          proposal.stage === IProposalStage.Queued && !expired && proposal.upstakeNeededToPreBoost.gten(0) ?
            <span className={css.boostedAmount}>
              <b>
                {detailView ? <img src="/assets/images/Icon/Boost-slate.svg" /> : ""}
                &gt; {formatTokens(proposal.upstakeNeededToPreBoost, "GEN")} on Pass to boost
              </b>
            </span>
            : proposal.stage === IProposalStage.PreBoosted && proposal.downStakeNeededToQueue.lten(0) ?
              <span className={css.boostedAmount}>
                <b>
                  {detailView ? <img src="/assets/images/Icon/Boost-slate.svg" /> : ""}
                &gt; {formatTokens(proposal.downStakeNeededToQueue.abs(), "GEN")} on Pass to stay boosted
                </b>
              </span>
              : proposal.stage === IProposalStage.PreBoosted && proposal.downStakeNeededToQueue.gtn(0) ?
                <span className={css.boostedAmount + " " + css.unboostAmount}>
                  <b>
                    {detailView ? <img src="/assets/images/Icon/Boost-slate.svg" /> : ""}
                &gt;=  {formatTokens(proposal.downStakeNeededToQueue, "GEN")} on Fail to un-boost
                  </b>
                </span>
                : nothing
        }
      </div>
    );
  }
}
