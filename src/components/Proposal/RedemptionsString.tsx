import { Address, IDAOState, IProposalState, IRewardState } from "@daostack/client";

import BN = require("bn.js");
import Reputation from "components/Account/Reputation";
import { formatTokens, tokenSymbol } from "lib/util";
import * as React from "react";

interface IProps {
  currentAccountAddress: Address;
  dao: IDAOState;
  proposal: IProposalState;
  rewards: IRewardState[];
  separator?: string;
}

export default class RedemptionsString extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const { currentAccountAddress, dao, proposal, rewards, separator } = this.props;

    const zero = new BN(0);
    const rewardComponents: any = [];
    let reputation = new BN(0);
    let gen = new BN(0);

    for (const reward of rewards) {
      if (reward.reputationForProposer.gt(zero)) {
        reputation = reputation.add(reward.reputationForProposer);
      } else if (reward.reputationForVoter.gt(zero)) {
        reputation = reputation.add(reward.reputationForVoter);
      } else if (reward.tokensForStaker.gt(zero)) {
        gen = gen.add(reward.tokensForStaker);
      }  else if (reward.daoBountyForStaker.gt(zero)) {
        gen = gen.add(reward.daoBountyForStaker);
      }
    }

    const contributionReward = proposal.contributionReward;

    if (contributionReward && currentAccountAddress === contributionReward.beneficiary) {
      if (contributionReward.ethReward.gt(zero)) {
        rewardComponents.push(formatTokens(contributionReward.ethReward, "ETH"));
      }
      if (contributionReward.externalTokenReward.gt(zero)) {
        rewardComponents.push(formatTokens(contributionReward.externalTokenReward, tokenSymbol(contributionReward.externalToken)));
      }
      if (contributionReward.nativeTokenReward.gt(zero)) {
        rewardComponents.push(formatTokens(contributionReward.nativeTokenReward, dao.tokenSymbol));
      }
      if (!contributionReward.reputationReward.isZero()) {
        reputation.add(contributionReward.reputationReward);
      }
    }

    if (gen.gt(zero)) {
      rewardComponents.push(formatTokens(gen, "GEN"));
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
