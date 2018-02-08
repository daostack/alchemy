import * as classNames from 'classnames';
import { denormalize } from 'normalizr';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Link } from 'react-router-dom'

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IProposalState } from 'reducers/arcReducer';
import { IWeb3State } from 'reducers/web3Reducer'

import VoteBox from './VoteBox';

import * as css from './Proposal.scss';

interface IStateProps {
  web3: IWeb3State
  proposal: IProposalState
}

const mapStateToProps = (state : IRootState, ownProps: any) => {
  return {
    proposal: state.arc.proposals[ownProps.proposalId],
    web3: state.web3 // TODO: just need the current account address right?
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

  render() {
    const { proposal, voteOnProposal, web3 } = this.props;

    if (proposal) {
      var proposalClass = classNames({
        [css.proposal]: true,
        [css.openProposal]: proposal.state == "NotBoosted",
        [css.failedProposal]: proposal.winningVote == 2,
        [css.passedProposal]: proposal.winningVote == 1
      });

      return (
        <div className={proposalClass}>
          <h3>{proposal.description}</h3>
          Token Reward: <span>{proposal.rewardToken}</span>
          <br />
          Reputation Reward: <span>{proposal.rewardReputation}</span>
          <br />
          Beneficiary: <span>{proposal.beneficiary}</span>
          <br />
          { proposal.state == "NotBoosted" ?
            <VoteBox
              proposal={proposal}
              voterAddress={web3.ethAccountAddress}
              voteOnProposal={voteOnProposal}
            />
            : proposal.winningVote == 1 ?
              <div>
                Passed!
              </div>
            : proposal.winningVote == 2 ?
              <div>
                Failed to pass
              </div>
            : ""
          }
        </div>
      );
    } else {
      return (<div>Loading... </div>);
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProposalContainer);