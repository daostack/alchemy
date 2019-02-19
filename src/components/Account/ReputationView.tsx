import BN = require("bn.js")
import Tooltip from "rc-tooltip";
import * as React from "react";
import Util from "lib/util";

interface IProps {
  daoName?: string;
  reputation: BN;
  totalReputation: BN;
}

export default class ReputationView extends React.Component<IProps, null> {
  public render() {
    const { daoName, reputation, totalReputation } = this.props;
    return (
      <Tooltip overlay={<span>{Util.fromWei(reputation).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} {daoName || ""} Reputation in total</span>}>
        <span data-test-id="reputation">
          {(totalReputation.gt(new BN(0)) ? 100 * Util.fromWei(reputation.div(totalReputation)) : 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}% Rep.
        </span>
      </Tooltip>
    );
  }
}
