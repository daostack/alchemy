import { Address, IDAOState, Proposal } from "@daostack/client";
import { getArc } from "arc";
import BN = require("bn.js");
import ReputationView from "components/Account/ReputationView";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import gql from "graphql-tag";
import { formatTokens } from "lib/util";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { RouteComponentProps } from "react-router-dom";
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

    const proposalsHTML = proposals.map((proposal: Proposal) => {
      return (<ProposalCardContainer key={"proposal_" + proposal.id} proposal={proposal} dao={dao} currentAccountAddress={currentAccountAddress}/>);
    });

    // TODO: the reward object from the subgraph only gives rewards for voting and staking and dao bounty,
    // the original code also considers ethREward and externalTokenRewards
    // let ethReward = 0
    const genReward = new BN("0");
    const reputationReward = new BN(0);
    // , externalTokenReward = 0;
    proposals.forEach((proposal) => {
      // TODO: gpRewards __should__ be a list with a single element, but we need some error handling here anyway, prboably
      const reward = proposal.gpRewards[0];
      if (reward) {
        // ethReward += Util.fromWei(reward.amount);
      //   externalTokenReward += Util.fromWei(reward.amount);
        if (reward.tokensForStaker) {
          genReward.iadd(new BN(reward.tokensForStaker));
        }
        if (reward.daoBountyForStaker) {
          genReward.iadd(new BN(reward.daoBountyForStaker));
        }
        if (reward.reputationForVoter) {
          reputationReward.iadd(new BN(reward.reputationForVoter));
        }
        if (reward.reputationForProposer) {
          reputationReward.iadd(new BN(reward.reputationForProposer));
        }
      }
    });

    const totalRewards = [];
    // if (ethReward) {
    //   totalRewards.push(formatTokens(ethReward, "ETH"));
    // }
    // if (externalTokenReward) {
    //   totalRewards.push(formatTokens(externalTokenReward, dao.externalTokenSymbol));
    // }
    if (genReward) {
      totalRewards.push(formatTokens(genReward, "GEN"));
    }
    if (reputationReward) {
      totalRewards.push(
        <ReputationView daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={reputationReward}/>
      );
    }
    const totalRewardsString = <strong>
        {totalRewards.reduce((acc, v) => {
          return acc == null ? <React.Fragment>{v}</React.Fragment> : <React.Fragment>{acc} <em>&amp;</em> {v}</React.Fragment>;
        }, null)}
      </strong>;

    return(
      <div>
        <BreadcrumbsItem to={"/dao/" + dao.address + "/redemptions"}>Redemptions</BreadcrumbsItem>
        <div className={css.redemptionsHeader}>
          Redemptions
          {proposals.length > 0 ?
              <span>Pending Rewards:&nbsp;{totalRewardsString}</span>
            : ""
          }
        </div>
        <div className={css.proposalsContainer}>
          <div className={css.proposalsContainer}>
          {proposals.length > 0 ?
            {proposalsHTML}
          :
            <div className={css.emptyRedemptions}>
              <img src="/assets/images/empty-redemptions.svg"/>
              <h2>Nothing to redeem</h2>
              <p>Get more rewards by proposing a proposal that the DAO accepts, and by voting / staking in alignment with the DAO.</p>
            </div>
          }
          </div>
        </div>
      </div>
    );
  }

}

export default (props: { dao: IDAOState, currentAccountAddress: Address } & RouteComponentProps<any>) => {
  if (!props.currentAccountAddress) {
    return <div>Please log in to see your rewards</div>;
  }
  const arc = getArc();
  const query = gql`       {
    proposals(where: {
      accountsWithUnclaimedRewards_contains: ["${props.currentAccountAddress}"]
      dao: "${props.dao.address}"
      contributionReward_not: null
    }) {
      id
      dao {
        id
      }
      gpRewards (where: { beneficiary: "${props.currentAccountAddress}"}) {
        tokensForStaker
        daoBountyForStaker
        reputationForVoter
        reputationForProposer
        beneficiary
      }
    }
  }
  `;
  return <Subscribe observable={arc.getObservable(query)}>{(state: IObservableState<any>) => {
      if (state.error) {
        return <div>{ state.error.message }</div>;
      } else if (state.data) {
        return <DaoRedemptionsContainer {...props} dao={props.dao} proposals={state.data.data.proposals}/>;
      } else {
        return (<div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>);
      }
    }
  }</Subscribe>;
};
