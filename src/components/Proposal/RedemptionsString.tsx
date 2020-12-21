import { Address, IDAOState, IProposalState, IRewardState } from "@daostack/arc.js";

import * as BN from "bn.js";
import Reputation from "components/Account/Reputation";
import { baseTokenName, genName, getCRRewards, getGpRewards, formatTokens, tokenDecimals, tokenSymbol, getNetworkByDAOAddress } from "lib/util";
import * as React from "react";
import * as css from "./RedemptionsString.scss";

interface IProps {
  currentAccountAddress: Address;
  dao: IDAOState;
  proposal: IProposalState;
  rewards: IRewardState;
  separator?: string;
}

export default class RedemptionsString extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const { currentAccountAddress, dao, proposal, rewards } = this.props;
    let separator = this.props.separator;

    const zero = new BN(0);
    const rewardComponents: any = [];
    let reputation = new BN(0);
    let gen = new BN(0);

    const gpRewards = getGpRewards(rewards);

    if (gpRewards) {
      if (gpRewards.reputationForProposer && gpRewards.reputationForProposer.gt(zero)) {
        reputation = reputation.add(gpRewards.reputationForProposer);
      }
      if (gpRewards.reputationForVoter && gpRewards.reputationForVoter.gt(zero)) {
        reputation = reputation.add(gpRewards.reputationForVoter);
      }
      if (gpRewards.tokensForStaker && gpRewards.tokensForStaker.gt(zero)) {
        gen = gen.add(gpRewards.tokensForStaker);
      }
      if (gpRewards.daoBountyForStaker && gpRewards.daoBountyForStaker.gt(zero)) {
        gen = gen.add(gpRewards.daoBountyForStaker);
      }
    }

    const contributionReward = proposal.contributionReward;

    if (contributionReward && currentAccountAddress === contributionReward.beneficiary) {
      const rewards = getCRRewards(proposal);
      if (rewards.ethReward && rewards.ethReward.gt(zero)) {
        rewardComponents.push(formatTokens(rewards.ethReward, baseTokenName(getNetworkByDAOAddress(dao.address))));
      }
      if (rewards.externalTokenReward && rewards.externalTokenReward.gt(zero)) {
        rewardComponents.push(formatTokens(rewards.externalTokenReward, tokenSymbol(contributionReward.externalToken, getNetworkByDAOAddress(this.props.dao.id)), tokenDecimals(contributionReward.externalToken, getNetworkByDAOAddress(this.props.dao.id))));
      }
      if (rewards.nativeTokenReward && rewards.nativeTokenReward.gt(zero)) {
        rewardComponents.push(formatTokens(rewards.nativeTokenReward, dao.tokenSymbol));
      }
      if (rewards.rep && rewards.rep.gt(zero)) {
        reputation = reputation.add(rewards.rep);
      }
    }

    if (gen.gt(zero)) {
      rewardComponents.push(formatTokens(gen, genName(getNetworkByDAOAddress(dao.address))));
    }

    if (reputation.gt(zero)) {
      rewardComponents.push(
        <Reputation reputation={reputation} totalReputation={dao.reputationTotalSupply} daoName={dao.name} />);
    }

    separator = separator || "+";

    return <div className={css.container}>
      {rewardComponents.map((component: any, index: number) => {
        return (
          <div className={css.reward} key={index}>
            {index ? <span className={css.separator}>{separator}</span> : ""}
            {component}
          </div>
        );
      })
      }
    </div>;
  }
}
