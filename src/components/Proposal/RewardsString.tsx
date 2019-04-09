import BN = require("bn.js");
import * as React from "react";

import { IDAOState, IProposalState } from "@daostack/client";
import { formatTokens } from "lib/util";

import ReputationView from "components/Account/ReputationView";

interface IProps {
  dao: IDAOState;
  proposal: IProposalState;
  separator?: string;
}

export default class RewardsString extends React.Component<IProps, null> {
  public render() {
    const { dao, proposal, separator } = this.props;

    const rewards = [];
    if (proposal.ethReward.gt(new BN(0))) {
      rewards.push(formatTokens(proposal.ethReward, "ETH"));
    }
    if (dao.externalTokenSymbol && proposal.externalTokenReward.gt(new BN(0))) {
      rewards.push(formatTokens(proposal.externalTokenReward, dao.externalTokenSymbol));
    }
    if (proposal.nativeTokenReward.gt(new BN(0))) {
      rewards.push(formatTokens(proposal.nativeTokenReward, dao.tokenSymbol));
    }
    if (proposal.reputationReward.gt(new BN(0))) {
      rewards.push(
        <ReputationView daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={proposal.reputationReward}/>
      );
    }
    return <strong>
      {rewards.reduce((acc, v) => {
        return acc == null ? <React.Fragment>{v}</React.Fragment> : <React.Fragment>{acc} <em>{separator || "+"}</em> {v}</React.Fragment>;
      }, null)}
    </strong>;
  }
}
