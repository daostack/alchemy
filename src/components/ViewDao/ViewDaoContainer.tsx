import * as classNames from 'classnames';
import { denormalize } from 'normalizr';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Link } from 'react-router-dom'

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IDaoState, ICollaboratorState, IProposalState } from 'reducers/arcReducer';
import { IWeb3State } from 'reducers/web3Reducer'
import * as schemas from '../../schemas';

import DaoHeader from './DaoHeader';
import DaoNav from './DaoNav';
import ProposalContainer from '../Proposal/ProposalContainer';

import * as css from './ViewDao.scss';

interface IStateProps {
  dao: IDaoState
  daoAddress : string
  web3: IWeb3State
}

const mapStateToProps = (state : IRootState, ownProps: any) => {
  return {
    dao: denormalize(state.arc.daos[ownProps.match.params.daoAddress], schemas.daoSchema, state.arc),
    daoAddress : ownProps.match.params.daoAddress,
    web3: state.web3
  };
};

interface IDispatchProps {
  getDAO: typeof arcActions.getDAO
}

const mapDispatchToProps = {
  getDAO: arcActions.getDAO
};

type IProps = IStateProps & IDispatchProps

class ViewDaoContainer extends React.Component<IProps, null> {

  componentDidMount() {
    this.props.getDAO(this.props.daoAddress);
  }

  render() {
    const { dao } = this.props;

    if (dao) {
      const proposalsHTML = dao.proposals.map((proposal : IProposalState) => {
        return (<ProposalContainer key={"proposal_" + proposal.proposalId} proposalId={proposal.proposalId} />);
      });

      return(
        <div className={css.wrapper}>
          <DaoHeader dao={dao} />
          <DaoNav dao={dao} />
          {this.renderMembers()}
          <div className={css.proposalsContainer}>
            <h2>Proposals</h2>
            {proposalsHTML}
          </div>
        </div>
      );
    } else {
      return (<div>Loading... </div>);
    }
  }

  renderMembers() {
    const { dao } = this.props;

    const membersHTML = dao.members.map((member : ICollaboratorState, index : number) => {
      return (
        <div className={css.member} key={"member_" + index}>
          <strong>{index + 1}: {member.address}</strong>
          <br />
          Tokens: <span>{member.tokens}</span>
          <br />
          Reputation: <span>{member.reputation}</span>
        </div>
      );
    });

    return (
      <div className={css.membersContainer}>
        <h2>Members</h2>
        {membersHTML}
      </div>
    );
  }

}

export default connect(mapStateToProps, mapDispatchToProps)(ViewDaoContainer);