import * as React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";

import {  DAO, IDAOState, IRewardState, Proposal, RewardType } from '@daostack/client'
import { arc } from 'arc'
import ReputationView from "components/Account/ReputationView";
import Subscribe, { IObservableState } from "components/Shared/Subscribe"
import { IRootState } from "reducers";
import ProposalContainer from "../Proposal/ProposalContainer";
import * as css from "./ViewDao.scss";

interface IProps {
  currentAccountAddress: string
  dao: IDAOState
  proposals: Proposal[]
  rewards: IRewardState[]
}

interface IOwnProps {
  dao: IDAOState,
  rewards: IRewardState[]
}
const mapStateToProps = (state: IRootState, ownProps: IOwnProps ) => {
  // const account = denormalize(state.arc.accounts[`${state.web3.ethAccountAddress}-${ownProps.dao.address}`], schemas.accountSchema, state.arc) as IAccountState;

  const proposals: Proposal[] = [];

  const rewards = ownProps.rewards
  rewards.forEach((reward: IRewardState) => {
    proposals.push(reward.proposal);
  });
  // proposals.sort((a, b) => closingTimeLegacy(b).unix() - closingTimeLegacy(a).unix())

  return {
    currentAccountAddress: state.web3.ethAccountAddress,
    dao: ownProps.dao,
    proposals,
    rewards: ownProps.rewards
  };
};

class DaoRedemptionsContainer extends React.Component<IProps, null> {

  public render() {
    const { dao, proposals, rewards, currentAccountAddress } = this.props;

    const proposalsHTML = proposals.map((proposal: Proposal) => {
      return (<ProposalContainer key={"proposal_" + proposal.id} proposalId={proposal.id} dao={dao} currentAccountAddress={currentAccountAddress}/>);
    });

    // const redeemAllTip: JSX.Element | string = ""
    let ethReward = 0, genReward = 0, reputationReward = 0, externalTokenReward = 0;

    rewards.forEach((reward) => {
      if (reward.type === RewardType.ETH) {
        ethReward += reward.amount
      }
      if (reward.type === RewardType.External) {
        externalTokenReward += reward.amount
      }
      if (reward.type === RewardType.Token) {
        genReward += reward.amount
      }
      if (reward.type === RewardType.Reputation) {
        reputationReward += reward.amount
      }
    })

    const totalRewards = [];
    if (ethReward) {
      totalRewards.push(ethReward.toFixed(2).toLocaleString() + " ETH");
    }
    if (externalTokenReward) {
      totalRewards.push(externalTokenReward.toFixed(2).toLocaleString() + " " + dao.externalTokenSymbol);
    }
    if (genReward) {
      totalRewards.push(genReward.toFixed(2).toLocaleString() + " GEN");
    }
    if (reputationReward) {
      totalRewards.push(
        <ReputationView daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={reputationReward}/>
      );
    }
    const totalRewardsString = <strong>{totalRewards.reduce((acc, v) => acc == null ? <React.Fragment>{v}</React.Fragment> : <React.Fragment>{acc} <em>&amp;</em> {v}</React.Fragment>, null)}</strong>;

    return(
      <div>
        {rewards.length > 0 ?
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

const ConnnectedDaoRedemptionsContainer = connect(mapStateToProps)(DaoRedemptionsContainer);

export default (props: { dao: IDAOState } & RouteComponentProps<any>) => {
  const daoAddress = props.dao.address
  const dao = new DAO(daoAddress, arc)
  return <Subscribe observable={dao.rewards()}>{(state: IObservableState<IRewardState[]>) => {
      if (state.error) {
        return <div>{ state.error.message }</div>
      } else if (state.data) {
        return <ConnnectedDaoRedemptionsContainer {...props} dao={props.dao} rewards={state.data}/>
      } else {
        return (<div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>);
      }
    }
  }</Subscribe>
}
