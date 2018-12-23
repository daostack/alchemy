import { denormalize } from "normalizr";
import * as React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";

import { IRootState } from "reducers";
import { closingTimeLegacy, IAccountState, IDaoState, IProposalState, IRedemptionState } from "reducers/arcReducer";
import * as schemas from "schemas";

import ProposalContainer from "../Proposal/ProposalContainer";

import { DAO, IDAOState, Reward } from '@daostack/client'
import { arc } from 'arc'
import ReputationView from "components/Account/ReputationView";
import Subscribe, { IObservableState } from "components/Shared/Subscribe"
import { Observable, Subscription } from 'rxjs'
import * as css from "./ViewDao.scss";

interface IProps {
  currentAccountAddress: string;
  dao: IDAOState;
  proposals: IProposalState[];
  redemptions: IRedemptionState[];
}

const mapStateToProps = (state: IRootState, ownProps: any ) => {
  // const dao = denormalize(state.arc.daos[ownProps.match.params.daoAvatarAddress], schemas.daoSchema, state.arc);
  // const account = denormalize(state.arc.accounts[`${state.web3.ethAccountAddress}-${ownProps.dao.address}`], schemas.accountSchema, state.arc) as IAccountState;

  const proposals: IProposalState[] = [];
  const redemptionsList: IRedemptionState[] = [];

  // if (account) {
  //   redemptionsList = account.redemptions as IRedemptionState[];
  //   redemptionsList.forEach((redemption: IRedemptionState) => {
  //     redemption.proposal = state.arc.proposals[redemption.proposalId];
  //     proposals.push(state.arc.proposals[redemption.proposalId]);
  //   });
  //   proposals.sort((a, b) => closingTimeLegacy(b).unix() - closingTimeLegacy(a).unix())
  // }
  const rewards = ownProps.rewards
  rewards.forEach((reward: Reward) => {
    // reward.proposal = state.arc.proposals[reward.proposal.id];
    // proposals.push(state.arc.proposals[reward.proposal.id]);
  });
  proposals.sort((a, b) => closingTimeLegacy(b).unix() - closingTimeLegacy(a).unix())

  return {
    currentAccountAddress: state.web3.ethAccountAddress,
    dao: ownProps.dao,
    proposals,
    redemptions: redemptionsList,
  };
};

class DaoRedemptionsContainer extends React.Component<IProps, null> {

  public render() {
    const { dao, proposals, redemptions } = this.props;

    const proposalsHTML = proposals.map((proposal: IProposalState) => {
      return (<ProposalContainer key={"proposal_" + proposal.proposalId} proposalId={proposal.proposalId} />);
    });

    // const redeemAllTip: JSX.Element | string = ""
    let ethReward = 0, genReward = 0, reputationReward = 0, externalTokenReward = 0;

    if (redemptions.length > 0) {
      redemptions.forEach((redemption) => {
        ethReward += redemption.beneficiaryEth;
        externalTokenReward += redemption.beneficiaryExternalToken;
        genReward += redemption.voterTokens + redemption.stakerTokens + redemption.stakerBountyTokens;
        reputationReward += redemption.voterReputation + redemption.stakerReputation + redemption.beneficiaryReputation + redemption.proposerReputation;
      });
    }

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
        {redemptions.length > 0 ?
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

const ConnnectedDAoRedemptionsContainer = connect(mapStateToProps)(DaoRedemptionsContainer);

export default (props: { dao: IDAOState } & RouteComponentProps<any>) => {
  const daoAddress = props.dao.address
  const dao = new DAO(daoAddress, arc)
  return <Subscribe observable={dao.rewards()}>{(state: IObservableState<Reward[]>) => {
      if (state.error) {
        return <div>{ state.error.message }</div>
      } else if (state.data) {
        return <ConnnectedDAoRedemptionsContainer {...props} rewards={state.data}  />
      } else {
        return (<div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>);
      }
    }
  }</Subscribe>
}
