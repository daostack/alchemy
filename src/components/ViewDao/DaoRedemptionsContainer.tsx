import * as classNames from "classnames";
import { denormalize } from "normalizr";
import Tooltip from 'rc-tooltip';
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IAccountState, IDaoState, IProposalState, IRedemptionState, closingTime } from "reducers/arcReducer";
import { IWeb3State } from "reducers/web3Reducer";
import * as selectors from "selectors/daoSelectors";
import * as schemas from "schemas";

import ProposalContainer from "../Proposal/ProposalContainer";
import DaoHeader from "./DaoHeader";
import DaoNav from "./DaoNav";

import * as css from "./ViewDao.scss";
import ReputationView from "components/Account/ReputationView";

interface IStateProps extends RouteComponentProps<any> {
  currentAccountAddress: string;
  dao: IDaoState;
  proposals: IProposalState[];
  redemptions: IRedemptionState[];
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  const dao = denormalize(state.arc.daos[ownProps.match.params.daoAvatarAddress], schemas.daoSchema, state.arc);
  const account = denormalize(state.arc.accounts[`${state.web3.ethAccountAddress}-${ownProps.match.params.daoAvatarAddress}`], schemas.accountSchema, state.arc) as IAccountState;

  let proposals: IProposalState[] = [];
  let redemptionsList: IRedemptionState[] = [];

  if (account) {
    redemptionsList = account.redemptions as IRedemptionState[];
    redemptionsList.forEach((redemption: IRedemptionState) => {
      redemption.proposal = state.arc.proposals[redemption.proposalId];
      proposals.push(state.arc.proposals[redemption.proposalId]);
    });
    proposals.sort((a, b) => closingTime(b).unix() - closingTime(a).unix())
  }

  return {
    currentAccountAddress: state.web3.ethAccountAddress,
    dao,
    proposals,
    redemptions: redemptionsList,
  };
};

interface IDispatchProps {
}

const mapDispatchToProps = {
};

type IProps = IStateProps & IDispatchProps;

class DaoRedemptionsContainer extends React.Component<IProps, null> {

  public render() {
    const { dao, proposals, redemptions } = this.props;

    const proposalsHTML = proposals.map((proposal: IProposalState) => {
      return (<ProposalContainer key={"proposal_" + proposal.proposalId} proposalId={proposal.proposalId} />);
    });

    let redeemAllTip: JSX.Element | string = "", ethReward = 0, genReward = 0, reputationReward = 0;
    if (redemptions.length > 0) {
      redemptions.forEach((redemption) => {
        ethReward += redemption.beneficiaryEth;
        genReward += redemption.voterTokens + redemption.stakerTokens + redemption.stakerBountyTokens;
        reputationReward += redemption.voterReputation + redemption.stakerReputation + redemption.beneficiaryReputation + redemption.proposerReputation;
      });
    }

    let totalRewards = [];
    if (ethReward) {
      totalRewards.push(ethReward.toFixed(2).toLocaleString() + " ETH");
    }
    if (genReward) {
      totalRewards.push(genReward.toFixed(2).toLocaleString() + " GEN");
    }
    if (reputationReward) {
      totalRewards.push(
        <ReputationView daoName={dao.name} totalReputation={dao.reputationCount} reputation={reputationReward}/>
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

export default connect(mapStateToProps, mapDispatchToProps)(DaoRedemptionsContainer);
