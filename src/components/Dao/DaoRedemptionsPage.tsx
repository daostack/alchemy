import { Address, IDAOState, Proposal } from "@daostack/client";
import { getArc } from "arc";
import Reputation from "components/Account/Reputation";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import gql from "graphql-tag";
import { formatTokens, tokenSymbol } from "lib/util";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { RouteComponentProps } from "react-router-dom";
import * as Sticky from "react-stickynode";
import { of } from "rxjs";
import ProposalCard from "../Proposal/ProposalCard";
import * as css from "./Dao.scss";

import BN = require("bn.js");

interface IExternalProps extends RouteComponentProps<any> {
  currentAccountAddress?: Address;
  daoState: IDAOState;
}

type IProps = IExternalProps & ISubscriptionProps<any>;

class DaoRedemptionsPage extends React.Component<IProps, null> {

  public render() {
    const { data } = this.props;

    if (data === null) {
      return <div>Please log in to see your rewards</div>;
    }

    const proposals = data.data.proposals;
    const { daoState, currentAccountAddress } = this.props;

    const arc = getArc();
    const proposalsHTML = proposals.map((proposalData: any) => {
      const proposal = new Proposal(proposalData.id, arc);

      return <ProposalCard
        key={"proposal_" + proposal.id}
        proposal={proposal}
        daoState={daoState}
        currentAccountAddress={currentAccountAddress}
      />;
    });

    const genReward = new BN(0);
    const ethReward = new BN(0);
    const reputationReward = new BN(0);
    const externalTokenRewards: { [symbol: string]: BN } = {};

    // calculate the total rewards from the genesisprotocol
    proposals.forEach((proposal: any) => {
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
        <Reputation daoName={daoState.name} totalReputation={daoState.reputationTotalSupply} reputation={reputationReward}/>
      );
    }

    const totalRewardsString = <strong>
      {totalRewards.reduce((acc, v) => {
        return acc === null ? <React.Fragment>{v}</React.Fragment> : <React.Fragment>{acc} <em>&amp;</em> {v}</React.Fragment>;
      }, null)}
    </strong>;

    return (
      <div>
        <BreadcrumbsItem to={"/dao/" + daoState.address + "/redemptions"}>Redemptions</BreadcrumbsItem>
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

export default withSubscription({
  wrappedComponent: DaoRedemptionsPage,
  loadingComponent: <div className={css.loading}><Loading/></div>,
  errorComponent: (props) => <div>{ props.error.message }</div>,
  checkForUpdate: ["currentAccountAddress"],
  createObservable: (props: IExternalProps) => {
    if (!props.currentAccountAddress) {
      return of(null);
    }

    const arc = getArc();
    const query = gql`       {
      proposals(
        where: {
          accountsWithUnclaimedRewards_contains: ["${props.currentAccountAddress}"]
          dao: "${props.daoState.address}"
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
    return arc.getObservable(query);
  },
});
