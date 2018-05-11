import Tooltip from "rc-tooltip";
import * as React from "react";

interface IProps {
  daoName?: string;
  reputation: number;
  totalReputation: number;
}

export default class ReputationView extends React.Component<IProps, null> {
  public render() {
    const { daoName, reputation, totalReputation } = this.props;

    return (
      <Tooltip overlay={<span>{reputation} {daoName || ''} Reputation in total</span>}>
        <span>
          {(totalReputation > 0 ? 100 * reputation / totalReputation : 0).toFixed(1)}% Reputation
        </span>
      </Tooltip>
    );
  }
}
