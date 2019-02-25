import BN = require("bn.js");
import * as React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";

import {  DAO, IDAOState, IRewardState } from "@daostack/client";
import { getArc } from "arc";

import ReputationView from "components/Account/ReputationView";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { IRootState } from "reducers";
import ProposalContainer from "../Proposal/ProposalContainer";
import * as css from "./ViewDao.scss";

interface IProps {
  currentAccountAddress: string;
  dao: IDAOState;
  rewards: IRewardState[];
}

interface IOwnProps {
  dao: IDAOState;
  rewards: IRewardState[];
}
const mapStateToProps = (state: IRootState, ownProps: IOwnProps ) => {
  // const account = denormalize(state.arc.accounts[`${state.web3.ethAccountAddress}-${ownProps.dao.address}`], schemas.accountSchema, state.arc) as IAccountState;

  // const proposals: Proposal[] = [];

  // const rewards = ownProps.rewards;
  // rewards.forEach((reward: IRewardState) => {
  //   proposals.push(new Proposal(reward.proposalId, reward.context));
  // });
  // proposals.sort((a, b) => closingTimeLegacy(b).unix() - closingTimeLegacy(a).unix())

  return {
    currentAccountAddress: state.web3.ethAccountAddress,
    dao: ownProps.dao,
    rewards: ownProps.rewards
  };
};

class DaoRedemptionsContainer extends React.Component<IProps, null> {

  public render() {
    const { dao, rewards, currentAccountAddress } = this.props;

    const proposalsHTML = rewards.map((reward: IRewardState) => {
      return (<ProposalContainer key={"proposal_" + reward.proposalId} proposalId={reward.proposalId} dao={dao} currentAccountAddress={currentAccountAddress}/>);
    });

    // TODO: we should rethink how this component works in the light of the new data model

    // These are the fields avvialable from the reward object:
    // beneficiary: Address
    // createdAt: Date
    // proposalId: string,
    // reputationForVoter: BN,
    // tokensForStaker: BN,
    // daoBountyForStaker: BN,
    // reputationForProposer: BN,
    // tokenAddress: Address,
    // redeemedReputationForVoter: BN,
    // redeemedTokensForStaker: BN,
    // redeemedReputationForProposer: BN,
    // redeemedDaoBountyForStaker: BN

    let ethReward = 0, genReward = 0, reputationReward = new BN(0), externalTokenReward = 0;
    // rewards.forEach((reward) => {
    //   ethReward += Util.fromWei(reward.amount);
    //   externalTokenReward += Util.fromWei(reward.amount);
    //   genReward += Util.fromWei(reward.amount);
    //   reputationReward.iadd(reward.amount);
    // });

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
  const daoAddress = props.dao.address;
  const arc = getArc();
  const dao = new DAO(daoAddress, arc);
  return <Subscribe observable={dao.rewards()}>{(state: IObservableState<IRewardState[]>) => {
      if (state.error) {
        return <div>{ state.error.message }</div>;
      } else if (state.data) {
        return <ConnnectedDaoRedemptionsContainer {...props} dao={props.dao} rewards={state.data}/>;
      } else {
        return (<div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>);
      }
    }
  }</Subscribe>;
};
