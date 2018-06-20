import * as classNames from "classnames";
import { denormalize } from "normalizr";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDaoState, IProposalState } from "reducers/arcReducer";
import { IWeb3State } from "reducers/web3Reducer";
import * as selectors from "selectors/daoSelectors";
import * as schemas from "schemas";

import ProposalContainer from "../Proposal/ProposalContainer";
import DaoHeader from "./DaoHeader";
import DaoNav from "./DaoNav";

import * as css from "./ViewDao.scss";

interface IStateProps extends RouteComponentProps<any> {
  proposalsExecuted: IProposalState[];
  web3: IWeb3State;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    proposalsExecuted: selectors.createHistoryProposalsSelector()(state, ownProps),
    web3: state.web3,
  };
};

interface IDispatchProps {
  getDAO: typeof arcActions.getDAO;
}

const mapDispatchToProps = {
  getDAO: arcActions.getDAO,
};

type IProps = IStateProps & IDispatchProps;

class DaoHistoryContainer extends React.Component<IProps, null> {

  public render() {
    const { proposalsExecuted } = this.props;

    const proposalsHTML = proposalsExecuted.map((proposal: IProposalState) => {
      return (<ProposalContainer key={"proposal_" + proposal.proposalId} proposalId={proposal.proposalId} />);
    });

    return(
        <div>
          <div className={css.proposalsHeader}>
            Executed Proposals
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

export default connect(mapStateToProps, mapDispatchToProps)(DaoHistoryContainer);
