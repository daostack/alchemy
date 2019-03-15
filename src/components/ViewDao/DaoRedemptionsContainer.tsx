import { Address, DAO, IDAOState, IRewardState, Proposal } from "@daostack/client";
import { getArc } from "arc";
import BN = require("bn.js");
import ReputationView from "components/Account/ReputationView";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import gql from "graphql-tag";
import Util from "lib/util";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { RouteComponentProps } from "react-router-dom";
import ProposalContainer from "../Proposal/ProposalContainer";
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
      return (<ProposalContainer key={"proposal_" + proposal.id} proposalId={proposal.id} dao={dao} currentAccountAddress={currentAccountAddress}/>);
    });

    // TODO: the reward object from the subgraph only gives rewards for voting and staking and dao bounty,
    // the original code also considers ethREward and externalTokenRewards
    // let ethReward = 0
    let genReward = new BN("0");
    let reputationReward = new BN(0);
    // , externalTokenReward = 0;
    proposals.forEach((proposal) => {
      // TODO: gpRewards __should__ be a list with a single element, but we need some error handling here anyway, prboably
      const reward = proposal.gpRewards[0];
      // ethReward += Util.fromWei(reward.amount);
    //   externalTokenReward += Util.fromWei(reward.amount);
      if (reward.tokensForStaker) {
        genReward.iadd(reward.tokensForStaker);
      }
      if (reward.daoBountyForStaker) {
        genReward.iadd(reward.daoBountyForStaker);
      }
      if (reward.reputationForVoter) {
        reputationReward.iadd(reward.reputationForVoter);
        }
      if (reward.reputationForProposer) {
        reputationReward.iadd(reward.reputationForProposer);
      }
    });

    const totalRewards = [];
    // if (ethReward) {
    //   totalRewards.push(ethReward.toFixed(2).toLocaleString() + " ETH");
    // }
    // if (externalTokenReward) {
    //   totalRewards.push(externalTokenReward.toFixed(2).toLocaleString() + " " + dao.externalTokenSymbol);
    // }
    if (genReward) {
      totalRewards.push(Util.fromWei(genReward).toFixed(2).toLocaleString() + " GEN");
    }
    if (reputationReward) {
      totalRewards.push(
        <ReputationView daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={reputationReward}/>
      );
    }
    const totalRewardsString = <strong>{totalRewards.reduce((acc, v) => acc == null ? <React.Fragment>{v}</React.Fragment> : <React.Fragment>{acc} <em>&amp;</em> {v}</React.Fragment>, null)}</strong>;

    return(
      <div>
        <BreadcrumbsItem to={"/dao/" + dao.address + "/redemptions"}>Redemptions</BreadcrumbsItem>

        {proposals.length > 0 ?
            <div className={css.clearfix + " " + css.redeemAllContainer}>
              <div className={css.pendingRewards}>
                Pending Rewards:&nbsp;{totalRewardsString}
              </div>
            </div>
          : ""
        }
        <div className={css.proposalsHeader}>
          Proposals with rewards for you to redeem
        </div>
        <div className={css.proposalsContainer}>
          <div className={css.proposalsContainer}>
            {proposalsHTML}
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
