import BN = require("bn.js");
import * as React from "react";

import { Address, IDAOState, IRewardState, IProposalState } from "@daostack/client";
import Util from "lib/util";

import ReputationView from "components/Account/ReputationView";

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
      let c = null;

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
        rewardComponents.push(Util.fromWei(proposal.ethReward).toFixed(2).toLocaleString() + " ETH")
      }
      if (proposal.externalTokenReward.gt(zero)) {
        rewardComponents.push(Util.fromWei(proposal.externalTokenReward).toFixed(2).toLocaleString() + " " + dao.externalTokenSymbol)
      }
      if (proposal.nativeTokenReward.gt(zero)) {
        rewardComponents.push(Util.fromWei(proposal.nativeTokenReward).toFixed(2).toLocaleString() + " " + dao.tokenSymbol);
      }
      if (proposal.reputationReward.gt(zero)) {
        reputation.add(proposal.reputationReward);
      }
    }

    if (gen.gt(zero)) {
      rewardComponents.push(Util.fromWei(gen).toFixed(2).toLocaleString() + " GEN");
    }

    if (reputation.gt(zero)) {
      rewardComponents.push(<ReputationView reputation={reputation} totalReputation={dao.reputationTotalSupply} daoName={dao.name} />);
    }

    return <span>
    {rewardComponents.reduce((acc: any, v: any) => {
      return acc === null ? <React.Fragment>{v}</React.Fragment> : <React.Fragment>{acc} <em>{separator || "+"}</em> {v}</React.Fragment>
    }, null)}
    </span>;
  }
}
