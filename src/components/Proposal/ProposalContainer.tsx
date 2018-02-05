import * as classNames from 'classnames';
import { denormalize } from 'normalizr';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Link } from 'react-router-dom'

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IProposalState } from 'reducers/arcReducer';
import { IWeb3State } from 'reducers/web3Reducer'

import * as css from './Proposal.scss';

interface IStateProps {
  web3: IWeb3State
  proposal: IProposalState
}

const mapStateToProps = (state : IRootState, ownProps: any) => {
  return {
    proposal: state.arc.proposals[ownProps.proposalId],
    web3: state.web3
  };
};

interface IDispatchProps {
  voteOnProposal: typeof arcActions.voteOnProposal
}

const mapDispatchToProps = {
  voteOnProposal: arcActions.voteOnProposal
};

type IProps = IStateProps & IDispatchProps

class ProposalContainer extends React.Component<IProps, null> {

  handleClickVote = (vote : number) => (event : any) => {
    const { proposal } = this.props;
    this.props.voteOnProposal(proposal.daoAvatarAddress, proposal.proposalId, this.props.web3.ethAccountAddress, vote);
  }

  render() {
    const { proposal } = this.props;

    if (proposal) {
      var proposalClass = classNames({
        [css.proposal]: true,
        [css.openProposal]: proposal.open,
        [css.failedProposal]: proposal.failed,
        [css.passedProposal]: proposal.passed,
      });

      return (
        <div className={proposalClass}>
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
              <button onClick={this.handleClickVote(1)}>Vote Yes</button> -
              <button onClick={this.handleClickVote(2)}>Vote No</button> -
              <button onClick={this.handleClickVote(0)}>Abstain</button>
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
    } else {
      return (<div>Loading... </div>);
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProposalContainer);