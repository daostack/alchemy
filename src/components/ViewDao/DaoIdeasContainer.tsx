import * as classNames from "classnames";
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

import * as css from "./ViewDao.scss";

interface IStateProps extends RouteComponentProps<any> {
  ideaProposalsExecuted: IProposalState[];
  web3: IWeb3State;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    ideaProposalsExecuted: selectors.createIdeaProposalsSelector()(state, ownProps),
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

class DaoIdeasContainer extends React.Component<IProps, null> {

  public render() {
    const { ideaProposalsExecuted } = this.props;

    const proposalsHTML = ideaProposalsExecuted.map((proposal: IProposalState) => {
      return (<ProposalContainer key={"proposal_" + proposal.proposalId} proposalId={proposal.proposalId} />);
    });

    return(
        <div>
          <div className={css.proposalsHeader}>
            Passed Idea Proposals
          </div>
          <div className={css.proposalsSubheader}>
            The DAO has expressed support for future proposals that execute
            these ideas.
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

export default connect(mapStateToProps, mapDispatchToProps)(DaoIdeasContainer);
