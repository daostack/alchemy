import BN = require("bn.js");
import { fromWei } from "lib/util";
import Tooltip from "rc-tooltip";
import * as React from "react";

interface IProps {
  daoName?: string;
  hideSymbol?: boolean;
  hideTooltip?: boolean;
  reputation: BN;
  totalReputation: BN;
}

export default class Reputation extends React.Component<IProps, null> {
  public render() {
    /**
     * totalReputation is a BN in WEI
     * reputation is a BN in WEI
     */
    const { daoName, hideSymbol, hideTooltip, reputation, totalReputation } = this.props;
    const PRECISION = 2;
    let percentageString: string;
    let percentage = 0;

    if (totalReputation.gtn(0)) {
      const percentageBn = reputation.muln(10000).div(totalReputation);
      if (percentageBn.bitLength() > 53) {
        // eslint-disable-next-line no-console
        console.log("");
        percentageString = "NaN";
      } else {
        percentage = percentageBn.toNumber() / 100;
      }
    } else {
      // eslint-disable-next-line no-console
      console.log("totalReputation is <= 0");
      percentageString = "NaN";
    }

    if (!percentageString) {
      percentageString = percentage.toLocaleString(undefined, {minimumFractionDigits: PRECISION, maximumFractionDigits: PRECISION});
      
      if ((percentage === 0) && !reputation.isZero()) {
        percentageString = `+${percentageString}`;
      }
    }

    return (
      <Tooltip
        placement="bottom"
        overlay={<span>{fromWei(totalReputation).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})} {daoName || ""} Reputation in total</span>}
        trigger={hideTooltip ? [] : ["hover"]}
      >
        <span data-test-id="reputation">
          { percentageString}  % {hideSymbol ? "" : "Rep."}
        </span>
      </Tooltip>
    );
  }
}
