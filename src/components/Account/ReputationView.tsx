import BN = require("bn.js");
import Util from "lib/util";
import Tooltip from "rc-tooltip";
import * as React from "react";

interface IProps {
  daoName?: string;
  hideSymbol?: boolean;
  reputation: BN;
  totalReputation: BN;
}

export default class ReputationView extends React.Component<IProps, null> {
  public render() {
    const { daoName, hideSymbol, reputation, totalReputation } = this.props;
    const PRECISION  = 5; // home many digits behind
    let percentage: number = 0;
    if (totalReputation.gt(new BN(0))) {
      percentage = new BN(100 * 10 ** PRECISION).mul(reputation).div(totalReputation).toNumber() / (10 ** PRECISION);
    }
    const percentageString = percentage.toLocaleString(undefined, {minimumFractionDigits: PRECISION, maximumFractionDigits: PRECISION});
    return (
      <Tooltip placement="bottom" overlay={<span>{Util.fromWei(reputation).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})} {daoName || ""} Reputation in total</span>}>
        <span data-test-id="reputation">{ percentageString}  % {hideSymbol ? "" : "Rep."}</span>
      </Tooltip>
    );
  }
}
