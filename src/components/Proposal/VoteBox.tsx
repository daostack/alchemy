import * as classNames from "classnames";
import * as React from "react";
import { Link } from "react-router-dom";
import Tooltip from 'rc-tooltip';

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IProposalState, TransactionStates, VoteOptions } from "reducers/arcReducer";

import * as css from "./Proposal.scss";
import ReputationView from "components/Account/ReputationView";

interface IProps {
  currentVote: number;
  currentAccountReputation: number;
  daoName: string;
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
    const { currentAccountReputation, currentVote, proposal, transactionState, voteOnProposal } = this.props;
    if (currentAccountReputation && !currentVote) {
      this.setState({ currentVote: vote });
      voteOnProposal(proposal.daoAvatarAddress, proposal, vote);
    }
  }

  public render() {
    const { currentVote, currentAccountReputation, proposal, daoName, daoTotalReputation, transactionState, } = this.props;

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
      [css.disabled]: !currentAccountReputation || !!currentVote
    });
    let voteDownButtonClass = classNames({
      [css.voted]: currentVote == VoteOptions.No,
      [css.disabled]: !currentAccountReputation || !!currentVote
    });

    const voteControls = classNames({
      [css.voteControls]: true
    });

    const passTipContent = currentAccountReputation ? (currentVote ? "Can't change your vote" : "Vote for") : "Voting requires reputation in " + daoName;
    const failTipContent = currentAccountReputation ? (currentVote ? "Can't change your vote" : "Vote against") : "Voting requires reputation in " + daoName;

    return (
      <div className={wrapperClass}>
        <div className={css.loading}>
          <img src="/assets/images/Icon/Loading-black.svg"/>
        </div>
        <div className={voteControls}>
          <div className={css.voteUp}>
            <Tooltip placement="right" trigger={["hover"]} overlay={passTipContent} overlayClassName={css.voteTooltip}>
              <button onClick={this.handleClickVote.bind(this, 1)} className={voteUpButtonClass}>
                <img className={css.upvote} src="/assets/images/Icon/Upvote.svg"/>
                <img className={css.upvote + " " + css.upvoted} src="/assets/images/Icon/Upvoted.svg"/>
              </button>
            </Tooltip>
          </div>
          <div className={css.voteDivider}>
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
                <div className={css.header}>Reputation turnout</div>
                <div className={css.turnoutInfo}>
                  {/* TODO: <span className={css.description}>{proposal.totalVoters} accounts holding {proposal.totalVotes} reputation have voted</span>*/}
                  <div className={css.turnoutGraph}>
                    <div className={css.turnoutStats}>
                      <span className={css.forLabel}>
                        <ReputationView
                          daoName={daoName}
                          totalReputation={daoTotalReputation}
                          reputation={proposal.votesYes}
                        /> for
                      </span>
                      <span className={css.againstLabel}>
                        <ReputationView
                          daoName={daoName}
                          totalReputation={daoTotalReputation}
                          reputation={proposal.votesNo}
                        /> against
                      </span>
                    </div>
                    <div className={css.graph}>
                      <div className={css.forBar} style={styles.forBar}></div>
                      <div className={css.divider}></div>
                      <div className={css.againstBar} style={styles.againstBar}></div>
                    </div>
                    <div className={css.reputationThreshold}>
                      <ReputationView
                        daoName={daoName}
                        totalReputation={daoTotalReputation}
                        reputation={daoTotalReputation / 2}
                      /> NEEDED FOR DECISION BY VOTE
                    </div>
                  </div>
                </div>
                <div className={css.tooltipPointer}>
                  <img src="/assets/images/tooltip-pointer.svg"/>
                </div>
              </div>
            </div>
          </div>
          <div className={css.voteDown}>
            <Tooltip placement="right" trigger={["hover"]} overlay={failTipContent} overlayClassName={css.voteTooltip}>
              <button onClick={this.handleClickVote.bind(this, 2)} className={voteDownButtonClass}>
                <img className={css.downvote} src="/assets/images/Icon/Downvote.svg"/>
                <img className={css.downvote + " " + css.downvoted} src="/assets/images/Icon/Downvoted.svg"/>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  }
}
