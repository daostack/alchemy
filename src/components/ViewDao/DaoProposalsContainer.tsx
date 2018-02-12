import * as classNames from 'classnames';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Link, RouteComponentProps } from 'react-router-dom'

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IProposalState } from 'reducers/arcReducer';
import { IWeb3State } from 'reducers/web3Reducer'
import * as schemas from '../../schemas';
import * as selectors from 'selectors/daoSelectors';

import DaoHeader from './DaoHeader';
import DaoNav from './DaoNav';
import ProposalContainer from '../Proposal/ProposalContainer';

import * as css from './ViewDao.scss';

interface IStateProps extends RouteComponentProps<any> {
  proposalsBoosted: IProposalState[],
  proposalsNotBoosted: IProposalState[]
  web3: IWeb3State
}

const mapStateToProps = (state : IRootState, ownProps: any) => {
  return {
    proposalsBoosted: selectors.makeDaoBoostedProposalsSelector()(state, ownProps),
    proposalsNotBoosted: selectors.makeDaoNotBoostedProposalsSelector()(state, ownProps),
    web3: state.web3
  };
};

interface IDispatchProps {}

const mapDispatchToProps = {};

type IProps = IStateProps & IDispatchProps

class DaoProposalsContainer extends React.Component<IProps, null> {

  render() {
    const { proposalsBoosted, proposalsNotBoosted } = this.props;

    const boostedProposalsHTML = proposalsBoosted.map((proposal : IProposalState) => {
      return (<ProposalContainer key={"proposal_" + proposal.proposalId} proposalId={proposal.proposalId} />);
    });
    const notBoostedProposalsHTML = proposalsNotBoosted.map((proposal : IProposalState) => {
      return (<ProposalContainer key={"proposal_" + proposal.proposalId} proposalId={proposal.proposalId} />);
    });

    return(
      <div className={css.proposalsContainer}>
        <div className={css.proposalsHeader}>
          Boosted Proposals
          <span>Available funds: <span>13,000 ETH - 327 KIN</span></span>
        </div>
        <div className={css.proposalsContainer}>
          {boostedProposalsHTML}
        </div>
        <div className={css.proposalsHeader}>
          All Proposals
        </div>
        <div className={css.proposalsContainer}>
          {notBoostedProposalsHTML}
        </div>
      </div>
    );
  }

}

export default connect(mapStateToProps, mapDispatchToProps)(DaoProposalsContainer);