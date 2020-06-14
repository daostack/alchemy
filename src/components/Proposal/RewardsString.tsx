import BN = require("bn.js");
import * as React from "react";

import { IDAOState, IContributionRewardProposalState } from "@dorgtech/arc.js";
import { baseTokenName, formatTokens, tokenDetails } from "lib/util";

import Reputation from "components/Account/Reputation";

interface IProps {
  daoState: IDAOState;
  proposalState: IContributionRewardProposalState;
  separator?: string;
}

export default class RewardsString extends React.Component<IProps, null> {
  public render(): RenderOutput {
    const { daoState, proposalState, separator } = this.props;

    const rewards = [];
    if (proposalState.ethReward && proposalState.ethReward.gt(new BN(0))) {
      rewards.push(formatTokens(proposalState.ethReward, baseTokenName()));
    }
    if (proposalState.externalToken && proposalState.externalTokenReward && proposalState.externalTokenReward.gt(new BN(0))) {
      const tokenData = tokenDetails(proposalState.externalToken);
      rewards.push(formatTokens(proposalState.externalTokenReward, tokenData ? tokenData["symbol"] : "?", tokenData ? tokenData["decimals"] : 18));
    }
    if (proposalState.nativeTokenReward && proposalState.nativeTokenReward.gt(new BN(0))) {
      rewards.push(formatTokens(proposalState.nativeTokenReward, daoState.tokenSymbol));
    }
    if (proposalState.reputationReward && !proposalState.reputationReward.isZero()) {
      rewards.push(
        <Reputation daoName={daoState.name} totalReputation={daoState.reputationTotalSupply} reputation={proposalState.reputationReward}/>
      );
    }
    return <strong>
      {rewards.reduce((acc, v) => {
        return acc === null ? <React.Fragment>{v}</React.Fragment> : <React.Fragment>{acc} <em>{separator || "+"}</em> {v}</React.Fragment>;
      }, null)}
    </strong>;
  }
}
