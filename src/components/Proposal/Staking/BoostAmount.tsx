import { IProposalStage, IProposalState } from "@daostack/client";

import BN = require("bn.js");
import * as classNames from "classnames";
import { formatTokens } from "lib/util";
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

    return (
      <div className={wrapperClass}>
        {
          proposal.stage === IProposalStage.Queued && !expired && proposal.upstakeNeededToPreBoost.gte(new BN(0)) ?
            <span className={css.boostedAmount}>
              <b>
                {detailView ? <img src="/assets/images/Icon/Boost-slate.svg" /> : ""}
                &gt; {formatTokens(proposal.upstakeNeededToPreBoost, "GEN")} to boost
              </b>
            </span>
            : proposal.stage === IProposalStage.PreBoosted && proposal.downStakeNeededToQueue.lte(new BN(0)) ?
              <span className={css.boostedAmount}>
                <b>
                  {detailView ? <img src="/assets/images/Icon/Boost-slate.svg" /> : ""}
                &gt; {formatTokens(proposal.downStakeNeededToQueue.abs(), "GEN")} Pass to stay boosted
                </b>
              </span>
              : proposal.stage === IProposalStage.PreBoosted && proposal.downStakeNeededToQueue.gt(new BN(0)) ?
                <span className={css.boostedAmount + " " + css.unboostAmount}>
                  <b>
                    {detailView ? <img src="/assets/images/Icon/Boost-slate.svg" /> : ""}
                    {formatTokens(proposal.downStakeNeededToQueue, "GEN")} on Fail to un-boost
                  </b>
                </span>
                : <span className={css.boostedAmount}><b>&nbsp;</b></span>
        }
      </div>
    );
  }
}
