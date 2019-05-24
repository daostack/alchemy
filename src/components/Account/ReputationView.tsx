import BN = require("bn.js");
import Util from "lib/util";
import Tooltip from "rc-tooltip";
import * as React from "react";
import * as css from "./ReputationView.scss";

interface IProps {
  daoName?: string;
  hideSymbol?: boolean;
  reputation: BN;
  totalReputation: BN;
}

export default class ReputationView extends React.Component<IProps, null> {
  public render() {
    const { daoName, hideSymbol, reputation, totalReputation } = this.props;

    return (
      <Tooltip placement="bottom" overlay={<span>{Util.fromWei(reputation).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})} {daoName || ""} Reputation in total</span>}>
        <span data-test-id="reputation">
          <span className={css.reputationAmount}>{Util.fromWei(reputation).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}</span>
          ({(totalReputation.gt(new BN(0)) ? 100 * Util.fromWei(reputation) / Util.fromWei(totalReputation) : 0).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}% {hideSymbol ? "" : "Rep."})
        </span>
      </Tooltip>
    );
  }
}
