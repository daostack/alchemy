import { Address, IDAOState, Proposal } from "@daostack/client";
import { getArc } from "arc";
import { claimableContributionRewards, hasClaimableRewards } from "lib/util";
import Reputation from "components/Account/Reputation";
import Loading from "components/Shared/Loading";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import gql from "graphql-tag";
import { formatTokens, tokenSymbol } from "lib/util";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { RouteComponentProps } from "react-router-dom";
import * as Sticky from "react-stickynode";
import ProposalCard from "../Proposal/ProposalCard";
import * as css from "./Dao.scss";

import BN = require("bn.js");

interface IProps {
  currentAccountAddress: string;
  dao: IDAOState;
  proposals: any[];
}

class DaoRedemptionsPage extends React.Component<IProps, null> {

  public render() {
    const { dao, proposals, currentAccountAddress } = this.props;

    const arc = getArc();
    const proposalsHTML = proposals.map((proposalData: any) => {
      const proposal = new Proposal(proposalData.id, arc);

      // hack to work around https://github.com/daostack/subgraph/issues/304
      let beneficiaryHasRewards = false;
      const proposalState = proposalData;
      const massagedRewardsForCurrentUser = proposalData.gpRewards
        .filter((r: any) => r.beneficiary === currentAccountAddress.toLowerCase())
        .map((r: any) => { return {
          id: r.id,
          beneficiary: r.beneficiary,
          tokensForStaker: r.tokensForStaker && new BN(r.tokensForStaker) || new BN(0),
          tokensForStakerRedeemedAt: Number(r.tokensForStakerRedeemedAt),
          daoBountyForStaker: r.daoBountyForStaker && new BN(r.daoBountyForStaker) || new BN(0),
          daoBountyForStakerRedeemedAt: Number(r.daoBountyForStakerRedeemedAt),
          reputationForVoter: r.reputationForVoter && new BN(r.reputationForVoter) || new BN(0),
          reputationForVoterRedeemedAt: Number(r.reputationForVoterRedeemedAt),
          reputationForProposer: r.reputationForProposer && new BN(r.reputationForProposer) || new BN(0),
          reputationForProposerRedeemedAt: Number(r.reputationForProposerRedeemedAt),
        };});
      const rewardsForCurrentUser = massagedRewardsForCurrentUser && massagedRewardsForCurrentUser[0] || undefined;
      const accountHasGPRewards = rewardsForCurrentUser && hasClaimableRewards(rewardsForCurrentUser) || false;
      if (proposalState.contributionReward) {
        const daoBalances: {[key: string]: BN} = {
          eth: undefined,
          nativeToken: undefined,
          rep: undefined,
          externalToken: undefined,
        };
        const cr = proposalState.contributionReward;
        const contributionRewards = claimableContributionRewards({
          // id: cr.id,
          beneficiary: cr.beneficiary,
          ethReward: cr.ethReward && new BN(cr.ethReward) || new BN(0),
          externalToken: cr.externalToken,
          externalTokenReward: new BN(cr.externalTokenReward || 0),
          nativeTokenReward: new BN(cr.nativeTokenReward || 0),
          periods: Number(cr.periods),
          periodLength: Number(cr.periodLength),
          reputationReward: new BN(cr.reputationReward || 0),
          alreadyRedeemedReputationPeriods: Number(cr.alreadyRedeemedReputationPeriods),
          alreadyRedeemedExternalTokenPeriods: Number(cr.alreadyRedeemedExternalTokenPeriods),
          alreadyRedeemedEthPeriods: Number(cr.alreadyRedeemedEthPeriods),
          alreadyRedeemedNativeTokenPeriods: Number(cr.alreadyRedeemedNativeTokenPeriods),

        }, daoBalances);

        beneficiaryHasRewards = Object.keys(contributionRewards).length > 0;
      }

      if (!accountHasGPRewards && !beneficiaryHasRewards) {
        return null;
      }
      // end of ahck to work around https://github.com/daostack/subgraph/issues/30


      return <ProposalCard
        key={"proposal_" + proposal.id}
        proposal={proposal} dao={dao}
        currentAccountAddress={currentAccountAddress}
      />;
    });

    const genReward = new BN(0);
    const ethReward = new BN(0);
    const reputationReward = new BN(0);
    const externalTokenRewards: { [symbol: string]: BN } = {};

    // calculate the total rewards from the genesisprotocol
    proposals.forEach((proposal) => {
      proposal.gpRewards.forEach((reward: any) => {
        if (reward.beneficiary === currentAccountAddress) {
          if (reward.tokensForStaker && Number(reward.tokensForStakerRedeemedAt) === 0) {
            genReward.iadd(new BN(reward.tokensForStaker));
          }
          if (reward.daoBountyForStaker && Number(reward.daoBountyForStakerRedeemedAt) === 0) {
            genReward.iadd(new BN(reward.daoBountyForStaker));
          }
          if (reward.reputationForVoter && Number(reward.reputationForVoterRedeemedAt) === 0) {
            reputationReward.iadd(new BN(reward.reputationForVoter));
          }
          if (reward.reputationForProposer && Number(reward.reputationForProposerRedeemedAt) === 0) {
            reputationReward.iadd(new BN(reward.reputationForProposer));
          }
        }
      });

      // Add ContributionReward redemptions
      const contributionReward = proposal.contributionReward;
      if (contributionReward && contributionReward.beneficiary === currentAccountAddress) {
        ethReward.iadd(new BN(contributionReward.ethReward));
        reputationReward.iadd(new BN(contributionReward.reputationReward));

        if (contributionReward.externslTokenReward && !contributionReward.externalTokenReward.isZero()) {
          if (externalTokenRewards[contributionReward.externalToken]) {
            externalTokenRewards[contributionReward.externalToken].iadd(new BN(contributionReward.externalTokenReward));
          } else {
            externalTokenRewards[contributionReward.externalToken] = new BN(contributionReward.externalTokenReward);
          }
        }
      }

    });

    const totalRewards: any[] = [];
    if (!ethReward.isZero()) {
      totalRewards.push(formatTokens(ethReward, "ETH"));
    }
    if (!genReward.isZero()) {
      totalRewards.push(formatTokens(genReward, "GEN"));
    }
    Object.keys(externalTokenRewards).forEach((tokenAddress) => {
      totalRewards.push(formatTokens(externalTokenRewards[tokenAddress], tokenSymbol(tokenAddress)));
    });
    if (!reputationReward.isZero()) {
      totalRewards.push(
        <Reputation daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={reputationReward}/>
      );
    }

    const totalRewardsString = <strong>
      {totalRewards.reduce((acc, v) => {
        return acc === null ? <React.Fragment>{v}</React.Fragment> : <React.Fragment>{acc} <em>&amp;</em> {v}</React.Fragment>;
      }, null)}
    </strong>;

    return (
      <div>
        <BreadcrumbsItem to={"/dao/" + dao.address + "/redemptions"}>Redemptions</BreadcrumbsItem>
        <Sticky enabled top={50} innerZ={10000}>
          <div className={css.redemptionsHeader}>
            Redemptions
            {proposals.length > 0 ?
              <span>Pending Protocol Rewards:&nbsp;{totalRewardsString}</span>
              : ""
            }
          </div>
        </Sticky>
        <div>
          {proposals.length > 0 ?
            <div>{proposalsHTML}</div>
            :
            <div className={css.emptyRedemptions}>
              <img src="/assets/images/empty-redemptions.svg"/>
              <h2>Nothing to redeem</h2>
              <p>Get more rewards by proposing a proposal that the DAO accepts, and by voting / staking in alignment with the DAO.</p>
            </div>
          }
        </div>
      </div>
    );
  }

}

export default (props: { dao: IDAOState; currentAccountAddress?: Address } & RouteComponentProps<any>) => {
  if (!props.currentAccountAddress) {
    return <div>Please log in to see your rewards</div>;
  }
  const arc = getArc();
  const query = gql`       {
    proposals(
      where: {
        accountsWithUnclaimedRewards_contains: ["${props.currentAccountAddress}"]
        dao: "${props.dao.address}"
      },
      orderBy: "closingAt"
    ) {
      id
      dao {
        id
      }
      scheme {
        id
        address
      }
      votingMachine
      # next line does not work anymore, apparently...
      # gpRewards (where: { beneficiary: "${props.currentAccountAddress}"}) {
      gpRewards {
        id
        beneficiary
        tokensForStaker
        tokensForStakerRedeemedAt
        daoBountyForStaker
        daoBountyForStakerRedeemedAt
        reputationForVoter
        reputationForVoterRedeemedAt
        reputationForProposer
        reputationForProposerRedeemedAt
      }
      contributionReward {
        id
        beneficiary
        ethReward
        externalToken
        externalTokenReward
        nativeTokenReward
        periods
        periodLength
        reputationReward
        alreadyRedeemedReputationPeriods
        alreadyRedeemedExternalTokenPeriods
        alreadyRedeemedEthPeriods
      }
    }
  }
  `;
  return <Subscribe observable={arc.getObservable(query)}>{(state: IObservableState<any>) => {
    if (state.error) {
      return <div>{ state.error.message }</div>;
    } else if (state.data) {
      return <DaoRedemptionsPage {...props} currentAccountAddress={props.currentAccountAddress as Address} proposals={state.data.data.proposals}/>;
    } else {
      return (<div className={css.loading}><Loading/></div>);
    }
  }
  }</Subscribe>;
};
