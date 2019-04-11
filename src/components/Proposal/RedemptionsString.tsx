import { Address, IDAOState, IProposalState, IRewardState } from "@daostack/client";
import BN = require("bn.js");
import ReputationView from "components/Account/ReputationView";
import { formatTokens, tokenSymbol } from "lib/util";
import * as React from "react";
import * as css from "./Proposal.scss";

interface IProps {
  currentAccountAddress: Address;
  dao: IDAOState;
  proposal: IProposalState;
  rewards: IRewardState[];
  separator?: string;
}

export default class RedemptionsString extends React.Component<IProps, null> {

  public render() {
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

    if (currentAccountAddress === proposal.beneficiary) {
      if (proposal.ethReward.gt(zero)) {
        rewardComponents.push(formatTokens(proposal.ethReward, "ETH"));
      }
      if (proposal.externalTokenReward.gt(zero)) {
        rewardComponents.push(formatTokens(proposal.externalTokenReward, tokenSymbol(proposal.externalToken)));
      }
      if (proposal.nativeTokenReward.gt(zero)) {
        rewardComponents.push(formatTokens(proposal.nativeTokenReward, dao.tokenSymbol));
      }
      if (proposal.reputationReward.gt(zero)) {
        reputation.add(proposal.reputationReward);
      }
    }

    if (gen.gt(zero)) {
      rewardComponents.push(formatTokens(gen, "GEN"));
    }

    if (reputation.gt(zero)) {
      rewardComponents.push(
        <ReputationView reputation={reputation} totalReputation={dao.reputationTotalSupply} daoName={dao.name} />);
    }

    return <span className={css.redemptionString}>
    {rewardComponents.reduce((acc: any, v: any) => {
      return acc === null ? <React.Fragment>{v}</React.Fragment> : <React.Fragment>{acc} <em>{separator || "+"}</em> {v}</React.Fragment>;
    }, null)}
    </span>;
  }
}
