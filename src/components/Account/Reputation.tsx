import * as BN from "bn.js";
import { fromWei } from "lib/util";
import Tooltip from "rc-tooltip";
import * as React from "react";

interface IExternalProps {
  daoName?: string;
  hideSymbol?: boolean;
  hideTooltip?: boolean;
  reputation: BN;
  totalReputation: BN;
}

export default class Reputation extends React.Component<IExternalProps, null> {
  public render(): RenderOutput {
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
        console.error("percentage is too large to be computed as a number");
        percentageString = "NaN";
      } else {
        percentage = percentageBn.toNumber() / 100;
      }
    } else {
      percentageString = "0";
    }

    if (!percentageString) {
      percentageString = percentage.toLocaleString(undefined, {minimumFractionDigits: PRECISION, maximumFractionDigits: PRECISION});

      if ((percentage === 0) && !reputation.isZero()) {
        percentageString = `+${percentageString}`;
      }
    }

    const totalRepFormatted = fromWei(totalReputation).toLocaleString(
      undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2}
    );

    const repFormatted = fromWei(reputation).toLocaleString(
      undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2}
    );

    return (
      <Tooltip
        placement="bottom"
        overlay={
          <>
            <span>{repFormatted} Rep.</span>
            <br/>
            <span>{totalRepFormatted} {daoName || ""} Reputation in total</span>
          </>
        }
        trigger={hideTooltip ? [] : ["hover"]}
      >
        <span data-test-id="reputation">
          { percentageString}  % {hideSymbol ? "" : "Rep."}
        </span>
      </Tooltip>
    );
  }
}
