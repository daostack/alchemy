import { Address, IDAOState, IProposalState, IRewardState } from "@dorgtech/client";

import BN = require("bn.js");
import Reputation from "components/Account/Reputation";
import { baseTokenName, genName, getCRRewards, getGpRewards, formatTokens, tokenDecimals, tokenSymbol } from "lib/util";
import * as React from "react";

interface IProps {
  currentAccountAddress: Address;
  dao: IDAOState;
  proposal: IProposalState;
  rewards: IRewardState;
  separator?: string;
}

export default class RedemptionsString extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const { currentAccountAddress, dao, proposal, rewards, separator } = this.props;

    const zero = new BN(0);
    const rewardComponents: any = [];
    let reputation = new BN(0);
    let gen = new BN(0);

    const gpRewards = getGpRewards(rewards);

    if (gpRewards) {
      if (gpRewards.reputationForProposer) {
        reputation = reputation.add(gpRewards.reputationForProposer);
      } else if (gpRewards.reputationForVoter) {
        reputation = reputation.add(gpRewards.reputationForVoter);
      } else if (gpRewards.tokensForStaker) {
        gen = gen.add(gpRewards.tokensForStaker);
      }  else if (gpRewards.daoBountyForStaker) {
        gen = gen.add(gpRewards.daoBountyForStaker);
      }
    }

    const contributionReward = proposal.contributionReward;

    if (contributionReward && currentAccountAddress === contributionReward.beneficiary) {
      const rewards = getCRRewards(proposal);
      if (rewards.ethReward) {
        rewardComponents.push(formatTokens(rewards.ethReward, baseTokenName()));
      }
      if (rewards.externalTokenReward) {
        rewardComponents.push(formatTokens(rewards.externalTokenReward, tokenSymbol(contributionReward.externalToken), tokenDecimals(contributionReward.externalToken)));
      }
      if (rewards.nativeTokenReward) {
        rewardComponents.push(formatTokens(rewards.nativeTokenReward, dao.tokenSymbol));
      }
      if (rewards.reputationReward) {
        reputation.add(rewards.reputationReward);
      }
    }

    if (gen.gt(zero)) {
      rewardComponents.push(formatTokens(gen, genName()));
    }

    if (reputation.gt(zero)) {
      rewardComponents.push(
        <Reputation reputation={reputation} totalReputation={dao.reputationTotalSupply} daoName={dao.name} />);
    }

    const redemptionsStyle = {
      position: "relative" as "relative",
      display: "inline-block",
      color: "rgba(49, 120, 202, 1.000)",
    };

    return <span style={redemptionsStyle}>
      {rewardComponents.reduce((acc: any, v: any) => {
        return acc === null ? <React.Fragment>{v}</React.Fragment> : <React.Fragment>{acc} <em>{separator || "+"}</em> {v}</React.Fragment>;
      }, null)}
    </span>;
  }
}
