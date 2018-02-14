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
}

export default class VoteBox extends React.Component<IProps, null> {

  handleClickVote = (vote : number) => (event : any) => {
    const { proposal, voteOnProposal } = this.props;
    voteOnProposal(proposal.daoAvatarAddress, proposal.proposalId, vote);
  }

  render() {
    const { proposal } = this.props;

    const yesPercentage = proposal.totalVotes ? Math.round(proposal.votesYes / proposal.totalVotes * 100) : 0;
    const noPercentage = proposal.totalVotes ? Math.round(proposal.votesNo / proposal.totalVotes * 100) : 0;

    const styles = {
      yesGraph: {
        height: yesPercentage + "px"
      },
      noGraph: {
        height: noPercentage + "px"
      }
    }

    return (
      <div className={css.voteBox + " " + css.clearfix}>
        <div className={css.voteControls}>
          <button onClick={this.handleClickVote(1)}>
            <img className={css.upvote} src='/assets/images/Icon/Upvote.svg'/>
            <img className={css.upvote + " " + css.upvoted} src='/assets/images/Icon/Upvoted.svg'/>
          </button>
          <div className={css.voteDivider}>
            <img src='/assets/images/vote-divider.svg'/>
          </div>
          <button onClick={this.handleClickVote(2)}>
            <img className={css.downvote} src='/assets/images/Icon/Downvote.svg'/>
            <img className={css.downvote + " " + css.downvoted} src='/assets/images/Icon/Downvoted.svg'/>
          </button>
        </div>
        <div className={css.voteGraphs}>
          <div className={css.upvoteGraph + " " + css.voteGraph}>
            <div className={css.dividingLine}></div>
            <div className={css.voteMeasurement} style={styles.yesGraph}></div>
          </div>
          <div className={css.downvoteGraph + " " + css.voteGraph}>
            <div className={css.dividingLine}></div>
            <div className={css.voteMeasurement} style={styles.noGraph}></div>
          </div>
          <div className={css.reputationTurnout}>
            <div className={css.header}>REPUTATION TURNOUT</div>
            <div className={css.turnoutInfo}>
              <span className={css.description}>312 accounts holding {proposal.totalVotes} reputation have voted</span>
              <div className={css.turnoutGraph}>
                <div className={css.turnoutStats}>
                  <span className={css.forLabel}>{proposal.votesYes} <span>FOR</span></span>
                  <span className={css.againstLabel}>{proposal.votesNo} <span>AGAINST</span></span>
                </div>

                <div className={css.graph}>
                  <div className={css.forBar}></div>
                  <div className={css.divider}></div>
                  <div className={css.againstBar}></div>
                </div>

                <div className={css.reputationThreshold}>42,689 REPUTATION NEEDED FOR DECISION BY VOTE</div>

              </div>
            </div>
            <div className={css.tooltipPointer}>
              <img src="/assets/images/tooltip-pointer.svg"/>
            </div>
          </div>
        </div>
      </div>
    );
  }
}