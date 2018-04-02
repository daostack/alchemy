import * as classNames from "classnames";
import { denormalize } from "normalizr";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDaoState, IProposalState, IRedemptionState } from "reducers/arcReducer";
import { IWeb3State } from "reducers/web3Reducer";
import * as selectors from "selectors/daoSelectors";
import * as schemas from "../../schemas";
import * as ReactTooltip from 'react-tooltip';

import ProposalContainer from "../Proposal/ProposalContainer";
import DaoHeader from "./DaoHeader";
import DaoNav from "./DaoNav";

import * as css from "./ViewDao.scss";

interface IStateProps extends RouteComponentProps<any> {
  proposals: IProposalState[];
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  const dao = state.arc.daos[ownProps.match.params.daoAddress];
  const redeemableProposalIds = Object.keys(dao.members[state.web3.ethAccountAddress].redemptions);
  const proposals = redeemableProposalIds.map((proposalId) => state.arc.proposals[proposalId]);

  return {
    proposals
  };
};

interface IDispatchProps {
}

const mapDispatchToProps = {};

type IProps = IStateProps & IDispatchProps;

class DaoRedemptionsContainer extends React.Component<IProps, null> {

  public render() {
    const { proposals } = this.props;

    const proposalsHTML = proposals.map((proposal: IProposalState) => {
      return (<ProposalContainer key={"proposal_" + proposal.proposalId} proposalId={proposal.proposalId} />);
    });

    return(
        <div>
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
