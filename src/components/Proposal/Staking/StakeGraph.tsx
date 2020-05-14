import { IProposalState } from "@dorgtech/arc.js";
import classNames from "classnames";
import { formatTokens, fromWei } from "lib/util";
import * as React from "react";

import * as css from "./StakeGraph.scss";

interface IProps {
  detailView?: boolean;
  historyView?: boolean;
  proposalState: IProposalState;
}

export default class StakeGraph extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const {
      detailView,
      historyView,
      proposalState,
    } = this.props;

    // round second decimal up
    const stakesFor = fromWei(proposalState.stakesFor);
    const stakesAgainst = fromWei(proposalState.stakesAgainst);
    const isPassing = stakesFor >= stakesAgainst;
    const isFailing = stakesAgainst >= stakesFor;
    const maxWidth = Math.max(stakesFor, stakesAgainst);
    const passWidth = stakesFor <= 0.0001 ? 0 : Math.max(stakesFor / maxWidth * 100, 3);
    const failWidth = stakesAgainst <= 0.0001 ? 0 : Math.max(stakesAgainst / maxWidth * 100, 3);

    const wrapperClass = classNames({
      [css.wrapper]: true,
      [css.detailView]: detailView,
      [css.historyView]: historyView,
      [css.isPassing]: isPassing,
      [css.isFailing]: isFailing,
    });

    return (
      <div className={wrapperClass}>

        <div className={css.stakeGraph}>
          <div className={css.leftColumn}>
            <div className={css.stakesFor}>
              <img className={css.defaultIcon} src="/assets/images/Icon/v-small-line.svg"/>
              <img className={css.detailIcon} src="/assets/images/Icon/v-small.svg"/>
              {formatTokens(proposalState.stakesFor)}
            </div>
            <div className={css.stakesAgainst}>
              <img className={css.defaultIcon} src="/assets/images/Icon/x-small-line.svg"/>
              <img className={css.detailIcon} src="/assets/images/Icon/x-small.svg"/>
              {formatTokens(proposalState.stakesAgainst)}
            </div>
          </div>
          <div className={css.rightColumn}>
            <div className={css.forBar}>
              <b>Pass</b>
              <span style={{width: passWidth + "%"}}></span>
            </div>
            <div className={css.againstBar}>
              <b>Fail</b>
              <span style={{width: failWidth + "%"}}></span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
