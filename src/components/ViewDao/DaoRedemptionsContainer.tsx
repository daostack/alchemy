import * as classNames from "classnames";
import { denormalize } from "normalizr";
import Tooltip from 'rc-tooltip';
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDaoState, IProposalState, IRedemptionState } from "reducers/arcReducer";
import { IWeb3State } from "reducers/web3Reducer";
import * as selectors from "selectors/daoSelectors";
import * as schemas from "../../schemas";

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
  const dao = state.arc.daos[ownProps.match.params.daoAddress];
  let proposals: IProposalState[] = [];
  let redemptionsList: IRedemptionState[] = [];

  if (dao && dao.members.hasOwnProperty(state.web3.ethAccountAddress)) {
    const redemptions = dao.members[state.web3.ethAccountAddress].redemptions;
    Object.keys(redemptions).forEach((proposalId) => {
      const redemption = redemptions[proposalId];
      redemption.proposal = state.arc.proposals[proposalId];
      redemptionsList.push(redemption);
      proposals.push(state.arc.proposals[proposalId]);
    })
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

    let redeemAllTip: JSX.Element | string = "", ethReward = 0, nativeReward = 0, reputationReward = 0;
    if (redemptions.length > 0) {
      redemptions.forEach((redemption) => {
        ethReward += redemption.beneficiaryEth;
        nativeReward += redemption.voterTokens + redemption.stakerTokens + redemption.stakerBountyTokens + redemption.beneficiaryNativeToken;
        reputationReward += redemption.voterReputation + redemption.stakerReputation + redemption.beneficiaryReputation + redemption.proposerReputation;
      });
    }

    return(
      <div>
        {redemptions.length > 0 ?
            <div className={css.clearfix + " " + css.redeemAllContainer}>
              <div className={css.pendingRewards}>
                Pending Rewards:&nbsp;
                {ethReward > 0 ? <strong>{ethReward} ETH </strong> : ""}
                {nativeReward > 0 ? <strong>{nativeReward} GEN </strong> : ""}
                {reputationReward > 0 ? <strong><ReputationView reputation={reputationReward} totalReputation={dao.reputationCount} daoName={dao.name}/></strong> : ""}
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
