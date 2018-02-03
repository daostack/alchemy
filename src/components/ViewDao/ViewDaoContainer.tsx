import * as classNames from 'classnames';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Link } from 'react-router-dom'

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IDaoState, ICollaboratorState, IProposalState } from 'reducers/arcReducer';
import { IWeb3State } from 'reducers/web3Reducer'

import DaoHeader from './DaoHeader';
import DaoNav from './DaoNav';

import * as css from './ViewDao.scss';

interface IStateProps {
  dao: IDaoState
  daoAddress : string
  web3: IWeb3State
}

const mapStateToProps = (state : IRootState, ownProps: any) => {
  return {
    dao: state.arc.daoList[ownProps.match.params.daoAddress],
    daoAddress : ownProps.match.params.daoAddress,
    web3: state.web3
  };
};

interface IDispatchProps {
  getDAO: typeof arcActions.getDAO
  voteOnProposition: typeof arcActions.voteOnProposition
}

const mapDispatchToProps = {
  getDAO: arcActions.getDAO,
  voteOnProposition: arcActions.voteOnProposition
};

type IProps = IStateProps & IDispatchProps

class ViewDaoContainer extends React.Component<IProps, null> {

  componentDidMount() {
    this.props.getDAO(this.props.daoAddress);
  }

  handleClickVote = (proposalId : string|number, vote : number) => (event : any) => {
    this.props.voteOnProposition(this.props.daoAddress, proposalId, this.props.web3.ethAccountAddress, vote);
  }

  render() {
    const { dao } = this.props;

    return(
      dao ?
        <div className={css.wrapper}>
          <DaoHeader dao={dao} />
          <DaoNav dao={dao} />
          {this.renderMembers()}
          {this.renderProposals()}
        </div>
       : <div>Loading... </div>
    );
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
      <div className={css.members}>
        <h2>Members</h2>
        {membersHTML}
      </div>
    );
  }

  renderProposals() {
    const { dao } = this.props;

    const proposalsHTML = Object.keys(dao.proposals).map((proposalAddress : string) => {
      const proposal = dao.proposals[proposalAddress];

      var proposalClass = classNames({
        [css.proposal]: true,
        [css.openProposal]: proposal.open,
        [css.failedProposal]: proposal.failed,
        [css.passedProposal]: proposal.passed,
      });

      return (
        <div className={proposalClass} key={"proposal_" + proposalAddress}>
          <h3>{proposal.description}</h3>
          Token Reward: <span>{proposal.tokenReward}</span>
          <br />
          Reputation Reward: <span>{proposal.reputationReward}</span>
          <br />
          Beneficiary: <span>{proposal.beneficiary}</span>
          <br />
          { proposal.open ?
            <div>
              Yes votes: <span>{proposal.yesVotes}</span>
              <br />
              No votes: <span>{proposal.noVotes}</span>
              <br />
              Abstain Votes: <span>{proposal.abstainVotes}</span>
              <br />
              <button onClick={this.handleClickVote(proposal.proposalId, 1)}>Vote Yes</button> -
              <button onClick={this.handleClickVote(proposal.proposalId, 2)}>Vote No</button> -
              <button onClick={this.handleClickVote(proposal.proposalId, 0)}>Abstain</button>
            </div>
            : proposal.passed ?
            <div>
              Passed!
            </div>
            : proposal.failed ?
            <div>
              Failed to pass
            </div> : ""
          }
        </div>
      );
    });

    return (
      <div className={css.members}>
        <h2>Propositions</h2>
        {proposalsHTML}
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewDaoContainer);