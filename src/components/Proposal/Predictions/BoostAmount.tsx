import { IProposalStage, IProposalState } from "@daostack/client";
import BN = require("bn.js");
import * as classNames from "classnames";
import { formatTokens } from "lib/util";
import * as React from "react";

import * as css from "./BoostAmount.scss";

interface IProps {
  detailView?: boolean;
  proposal: IProposalState;
}

export default class BoostAmount extends React.Component<IProps, null> {

  public render() {
    const {
      detailView,
      proposal,
    } = this.props;

    const wrapperClass = classNames({
      [css.wrapper]: true,
      [css.detailView]: detailView
    });

    return (
      <div className={wrapperClass}>
        {
          proposal.stage === IProposalStage.Queued && proposal.upstakeNeededToPreBoost.gt(new BN(0)) ?
            <span className={css.boostedAmount}>
              <b>
                {detailView ? <img src="/assets/images/Icon/Boost-slate.svg" /> : ""}
                {formatTokens(proposal.upstakeNeededToPreBoost, "GEN")} to boost
              </b>
            </span>
          : proposal.stage === IProposalStage.PreBoosted && proposal.downStakeNeededToQueue.gt(new BN(0)) ?
            <span className={css.boostedAmount}>
              <b>
                {detailView ? <img src="/assets/images/Icon/Boost-slate.svg" /> : ""}
                {formatTokens(proposal.downStakeNeededToQueue, "GEN")} to un-boost
              </b>
            </span>
          : ""
        }
      </div>
    );
  }
}
