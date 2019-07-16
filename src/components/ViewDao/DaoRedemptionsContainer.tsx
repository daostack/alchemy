import { Address, IDAOState, Proposal } from "@daostack/client";
import { getArc } from "arc";
import BN = require("bn.js");
import ReputationView from "components/Account/ReputationView";
import Loading from "components/Shared/Loading";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import gql from "graphql-tag";
import { formatTokens, tokenSymbol } from "lib/util";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { RouteComponentProps } from "react-router-dom";
import * as Sticky from "react-stickynode";
import ProposalCardContainer from "../Proposal/ProposalCardContainer";
import * as css from "./ViewDao.scss";

interface IProps {
  currentAccountAddress: string;
  dao: IDAOState;
  proposals: any[];
}

class DaoRedemptionsContainer extends React.Component<IProps, null> {

  public render() {
    const { dao, proposals, currentAccountAddress } = this.props;

    const arc = getArc();
    const proposalsHTML = proposals.map((proposalData: any) => {
      const proposal = new Proposal(proposalData.id, dao.address, proposalData.scheme.address, proposalData.votingMachine, arc);

      return <ProposalCardContainer
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
        <ReputationView daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={reputationReward}/>
      );
    }

    const totalRewardsString = <strong>
        {totalRewards.reduce((acc, v) => {
          return acc == null ? <React.Fragment>{v}</React.Fragment> : <React.Fragment>{acc} <em>&amp;</em> {v}</React.Fragment>;
        }, null)}
      </strong>;

    return (
      <div>
        <BreadcrumbsItem to={"/dao/" + dao.address + "/redemptions"}>Redemptions</BreadcrumbsItem>
        <Sticky enabled={true} top={50} innerZ={10000}>
          <div className={css.redemptionsHeader}>
            Redemptions
            {proposals.length > 0 ?
                <span>Pending Protocol Rewards:&nbsp;{totalRewardsString}</span>
              : ""
            }
          </div>
        </Sticky>
        <div className={css.proposalsContainer}>
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

export default (props: { dao: IDAOState, currentAccountAddress?: Address } & RouteComponentProps<any>) => {
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
        return <DaoRedemptionsContainer {...props} currentAccountAddress={props.currentAccountAddress as Address} proposals={state.data.data.proposals}/>;
      } else {
        return (<div className={css.loading}><Loading/></div>);
      }
    }
  }</Subscribe>;
};
