import { Address, IDAOState, AnyProposal, IRewardState, IContributionRewardProposalState } from "@dorgtech/arc.js";

import BN = require("bn.js");
import Reputation from "components/Account/Reputation";
import { baseTokenName, genName, getCRRewards, getGpRewards, formatTokens, tokenDecimals, tokenSymbol } from "lib/util";
import * as React from "react";

interface IProps {
  currentAccountAddress: Address;
  daoState: IDAOState;
  proposal: AnyProposal;
  rewards: IRewardState | null;
  separator?: string;
}

export default class RedemptionsString extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const { currentAccountAddress, daoState, proposal, rewards, separator } = this.props;

    const zero = new BN(0);
    const rewardComponents: any = [];
    let reputation = new BN(0);
    let gen = new BN(0);

    const gpRewards = getGpRewards(rewards);

    if (gpRewards !== {}) {
      if (gpRewards.reputationForProposer) {
        reputation = reputation.add(gpRewards.reputationForProposer);
      } else if (gpRewards.reputationForVoter) {
        reputation = reputation.add(gpRewards.reputationForVoter);
      } else if (gpRewards.tokensForStaker) {
        gen = gen.add(gpRewards.tokensForStaker);
      } else if (gpRewards.daoBountyForStaker) {
        gen = gen.add(gpRewards.daoBountyForStaker);
      }
    }

    const proposalState = proposal.coreState;
    const contributionReward = proposal.coreState as IContributionRewardProposalState;

    if (proposalState.name === "ContributionReward" && currentAccountAddress === contributionReward.beneficiary) {
      const rewards = getCRRewards(contributionReward);
      if (rewards.ethReward) {
        rewardComponents.push(formatTokens(rewards.ethReward, baseTokenName()));
      }
      if (rewards.externalTokenReward) {
        rewardComponents.push(formatTokens(rewards.externalTokenReward, tokenSymbol(contributionReward.externalToken), tokenDecimals(contributionReward.externalToken)));
      }
      if (rewards.nativeTokenReward) {
        rewardComponents.push(formatTokens(rewards.nativeTokenReward, daoState.tokenSymbol));
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
        <Reputation reputation={reputation} totalReputation={daoState.reputationTotalSupply} daoName={daoState.name} />);
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
