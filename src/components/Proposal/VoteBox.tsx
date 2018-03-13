import * as classNames from "classnames";
import * as React from "react";
import { Link } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IProposalState, TransactionStates, VoteOptions } from "reducers/arcReducer";

import * as css from "./Proposal.scss";

interface IProps {
  currentVote: number;
  daoTotalReputation: number;
  proposal: IProposalState;
  transactionState: TransactionStates;
  voteOnProposal: typeof arcActions.voteOnProposal;
}

interface IState {
  currentVote: number;
}

export default class VoteBox extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      currentVote: props.currentVote,
    };
  }

  public handleClickVote(vote: number, event: any) {
    const { proposal, transactionState, voteOnProposal } = this.props;
    this.setState({ currentVote: vote });
    voteOnProposal(proposal.daoAvatarAddress, proposal.proposalId, vote);
  }

  public render() {
    const { currentVote, proposal, daoTotalReputation, transactionState } = this.props;

    const yesPercentage = daoTotalReputation ? Math.round(proposal.votesYes / daoTotalReputation * 100) : 0;
    const noPercentage = daoTotalReputation ? Math.round(proposal.votesNo / daoTotalReputation * 100) : 0;

    const styles = {
      yesGraph: {
        height: yesPercentage + "%",
      },
      noGraph: {
        height: noPercentage + "%",
      },
      forBar: {
        width: yesPercentage + "%",
      },
      againstBar: {
        width: noPercentage + "%",
      },
    };

    let wrapperClass = classNames({
      [css.voteBox] : true,
      [css.clearfix] : true,
      [css.unconfirmedVote] : transactionState == TransactionStates.Unconfirmed,
    });
    let voteUpButtonClass = classNames({
      [css.voted]: currentVote == VoteOptions.Yes,
    });
    let voteDownButtonClass = classNames({
      [css.voted]: currentVote == VoteOptions.No,
    });

    return (
      <div className={wrapperClass}>
        <div className={css.loading}>
          <img src="/assets/images/Icon/Loading-black.svg"/>
        </div>
        <div className={css.voteControls}>
          <button onClick={this.handleClickVote.bind(this, 1)} className={voteUpButtonClass}>
            <img className={css.upvote} src="/assets/images/Icon/Upvote.svg"/>
            <img className={css.upvote + " " + css.upvoted} src="/assets/images/Icon/Upvoted.svg"/>
          </button>
          <div className={css.voteDivider}>
            <img src="/assets/images/vote-divider.svg"/>
          </div>
          <button onClick={this.handleClickVote.bind(this, 2)} className={voteDownButtonClass}>
            <img className={css.downvote} src="/assets/images/Icon/Downvote.svg"/>
            <img className={css.downvote + " " + css.downvoted} src="/assets/images/Icon/Downvoted.svg"/>
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
              {/* TODO: <span className={css.description}>{proposal.totalVoters} accounts holding {proposal.totalVotes} reputation have voted</span>*/}
              <div className={css.turnoutGraph}>
                <div className={css.turnoutStats}>
                  <span className={css.forLabel}>{proposal.votesYes} <span>FOR</span></span>
                  <span className={css.againstLabel}>{proposal.votesNo} <span>AGAINST</span></span>
                </div>

                <div className={css.graph}>
                  <div className={css.forBar} style={styles.forBar}></div>
                  <div className={css.divider}></div>
                  <div className={css.againstBar} style={styles.againstBar}></div>
                </div>

                <div className={css.reputationThreshold}>{(daoTotalReputation / 2).toLocaleString()} REPUTATION NEEDED FOR DECISION BY VOTE</div>

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
