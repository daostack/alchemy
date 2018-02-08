import * as React from 'react';
import { Link } from 'react-router-dom'

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IProposalState } from 'reducers/arcReducer';

import EthBalance from 'components/EthBalance/EthBalance';

import * as css from './Proposal.scss';

interface IProps {
  proposal: IProposalState
  voteOnProposal: typeof arcActions.voteOnProposal
  voterAddress: string
}

export default class VoteBox extends React.Component<IProps, null> {

  handleClickVote = (vote : number) => (event : any) => {
    const { proposal, voteOnProposal, voterAddress } = this.props;
    voteOnProposal(proposal.daoAvatarAddress, proposal.proposalId, voterAddress, vote);
  }

  render() {
    const { proposal } = this.props;

    return (
      <div>
        Yes votes: <span>{proposal.votesYes}</span>
        <br />
        No votes: <span>{proposal.votesNo}</span>
        <br />
        <button onClick={this.handleClickVote(1)}>Vote Yes</button> -
        <button onClick={this.handleClickVote(2)}>Vote No</button>
      </div>
    );
  }
}