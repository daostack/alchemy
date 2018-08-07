import * as classNames from "classnames";
import * as React from "react";
import { Link } from "react-router-dom";
import Tooltip from 'rc-tooltip';

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDaoState, IProposalState, ProposalStates, TransactionStates, VoteOptions } from "reducers/arcReducer";

import * as css from "./Proposal.scss";
import ReputationView from "components/Account/ReputationView";
import { default as PreTransactionModal, ActionTypes } from "components/Shared/PreTransactionModal";

interface IProps {
  currentAccountAddress: string;
  currentAccountReputation: number;
  currentVote: number;
  dao: IDaoState;
  proposal: IProposalState;
  voteOnProposal: typeof arcActions.voteOnProposal;
  isVotingNo: boolean;
  isVotingYes: boolean;
}

interface IState {
  currentVote: number;
  showPreVoteModal: boolean;
}

export default class VoteBox extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      currentVote: this.props.currentVote,
      showPreVoteModal: false
    };
  }

  public handleClickVote(vote: number, event: any) {
    const { currentAccountReputation } = this.props;
    if (currentAccountReputation) {
      this.setState({ showPreVoteModal: true, currentVote: vote });
    }
  }

  public closePreVoteModal(event: any) {
    this.setState({ showPreVoteModal: false });
  }

  public render() {
    const {
      currentVote,
      currentAccountReputation,
      currentAccountAddress,
      proposal,
      dao,
      isVotingNo,
      isVotingYes,
      voteOnProposal
    } = this.props;

    const isVoting = isVotingNo || isVotingYes;

    // If percentages are less than 2 then set them to 2 so they can be visibly noticed
    let yesPercentage = dao.reputationCount && proposal.votesYes ? Math.max(2, Math.ceil(proposal.votesYes / dao.reputationCount * 100)) : 0;
    let noPercentage = dao.reputationCount && proposal.votesNo ? Math.max(2, Math.ceil(proposal.votesNo / dao.reputationCount * 100)) : 0;

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

    const votingDisabled = !currentAccountReputation || !!currentVote;

    let wrapperClass = classNames({
      [css.voteBox] : true,
      [css.clearfix] : true,
      [css.unconfirmedVote] : isVoting,
    });
    let voteUpButtonClass = classNames({
      [css.voted]: !isVotingYes && currentVote == VoteOptions.Yes,
      [css.disabled]: votingDisabled,
      [css.upvotePending]: isVotingYes,
    });
    let voteDownButtonClass = classNames({
      [css.voted]: !isVotingNo && currentVote == VoteOptions.No,
      [css.disabled]: votingDisabled,
      [css.downvotePending]: isVotingNo,
    });

    const voteControls = classNames({
      [css.voteControls]: true
    });

    const tipContent = (vote: VoteOptions) =>
      currentVote ?
        "Can't change your vote" :
      !currentAccountReputation ?
        "Voting requires reputation in " + dao.name :
      isVoting ?
        'Warning: Voting for this proposal is already in progress' :
        `Vote ${vote === VoteOptions.Yes ? 'for' : 'against'}`
    ;

    return (
      <div className={wrapperClass}>
        {this.state.showPreVoteModal ?
          <PreTransactionModal
            actionType={this.state.currentVote == 1 ? ActionTypes.VoteUp : ActionTypes.VoteDown}
            action={voteOnProposal.bind(null, proposal.daoAvatarAddress, proposal, this.state.currentVote)}
            closeAction={this.closePreVoteModal.bind(this)}
            currentAccount={currentAccountAddress}
            dao={dao}
            effectText={<span>Your influence: <strong><ReputationView daoName={dao.name} totalReputation={dao.reputationCount} reputation={currentAccountReputation} /></strong></span>}
            proposal={proposal}
          /> : ""
        }

        <div className={voteControls}>
          <div className={css.voteUp}>
            <Tooltip placement="right" trigger={["hover"]} overlay={tipContent(VoteOptions.Yes)} overlayClassName={css.voteTooltip}>
              <button onClick={votingDisabled ? "" : this.handleClickVote.bind(this, 1)} className={voteUpButtonClass}>
                <img className={css.upvote} src="/assets/images/Icon/Upvote.svg"/>
                <img className={css.upvote + " " + css.upvoted} src="/assets/images/Icon/Upvoted.svg"/>
                <svg className={css.upvotePendingIcon} viewBox="0 0 41 29" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                    <defs>
                        <path d="M0,20.3763021 L20.3990885,0 L40.6751302,20.3763021 L37.7789714,23.491862 L20.3027344,6.04589844 L2.99348958,23.491862 L0,20.3763021 Z M5,25.535319 L20.4567057,10 L35.7426758,25.3149414 L32.6529948,28.3733724 L20.3713379,16.0996094 L7.94677734,28.6004232 L5,25.535319 Z" id="path-1"></path>
                    </defs>
                    <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                        <g id="Artboard-2" transform="translate(-297.000000, -659.000000)">
                            <g id="Rectangle-2-Copy-3" transform="translate(317.500000, 673.500000) rotate(-360.000000) translate(-317.500000, -673.500000) translate(297.000000, 659.000000)">
                                <mask id="mask-2" fill="white">
                                    <use xlinkHref="#path-1"></use>
                                </mask>
                                <use id="Mask" fill="#D8D8D8" opacity="0.400000006" xlinkHref="#path-1"></use>
                                <g id="Group-4" mask="url(#mask-2)" fill="#3AB4D0">
                                    <g className={css.verifyMask} transform="translate(-1.000000, 6.000000)">
                                        <rect id="Rectangle-2" opacity="0.5" x="0" y="10" width="42" height="3.94661642"></rect>
                                        <rect id="Rectangle-2-Copy-2" opacity="0.300000012" x="1" y="16" width="42" height="1.94661642"></rect>
                                        <rect id="Rectangle-2-Copy" x="0" y="0" width="42" height="7.94661642"></rect>
                                    </g>
                                </g>
                            </g>
                        </g>
                    </g>
                </svg>
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
                  {/* TODO: <span className={css.description}>{proposal.votes.length} accounts holding {proposal.totalVotes} reputation have voted</span>*/}
                  <div className={css.turnoutGraph}>
                    <div className={css.turnoutStats}>
                      <span className={css.forLabel}>
                        <ReputationView
                          daoName={dao.name}
                          totalReputation={dao.reputationCount}
                          reputation={proposal.votesYes}
                        /> for
                      </span>
                      <span className={css.againstLabel}>
                        <ReputationView
                          daoName={dao.name}
                          totalReputation={dao.reputationCount}
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
                        daoName={dao.name}
                        totalReputation={dao.reputationCount}
                        reputation={dao.reputationCount / 2}
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
            <Tooltip placement="right" trigger={["hover"]} overlay={tipContent(VoteOptions.No)} overlayClassName={css.voteTooltip}>
              <button onClick={votingDisabled ? "" : this.handleClickVote.bind(this, 2)} className={voteDownButtonClass}>
                <img className={css.downvote} src="/assets/images/Icon/Downvote.svg"/>
                <img className={css.downvote + " " + css.downvoted} src="/assets/images/Icon/Downvoted.svg"/>
                <svg className={css.downvotePendingIcon} width="41px" height="29px" viewBox="0 0 41 29" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                    <defs>
                        <path d="M0,20.3763021 L20.3990885,0 L40.6751302,20.3763021 L37.7789714,23.491862 L20.3027344,6.04589844 L2.99348958,23.491862 L0,20.3763021 Z M5,25.535319 L20.4567057,10 L35.7426758,25.3149414 L32.6529948,28.3733724 L20.3713379,16.0996094 L7.94677734,28.6004232 L5,25.535319 Z" id="path-1"></path>
                    </defs>
                    <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                        <g id="Artboard-2" transform="translate(-235.000000, -659.000000)">
                            <g id="Rectangle-2" transform="translate(255.500000, 673.500000) rotate(-180.000000) translate(-255.500000, -673.500000) translate(235.000000, 659.000000)">
                                <mask id="mask-2" fill="white">
                                    <use xlinkHref="#path-1"></use>
                                </mask>
                                <use id="Mask" fill="#D8D8D8" opacity="0.400000006" xlinkHref="#path-1"></use>
                                <g id="Group-4" mask="url(#mask-2)" fill="#F5A623">
                                    <g className={css.verifyMask} transform="translate(-1.000000, 6.000000)">
                                        <rect id="Rectangle-2" opacity="0.5" x="0" y="10" width="42" height="3.94661642"></rect>
                                        <rect id="Rectangle-2-Copy-2" opacity="0.300000012" x="1" y="16" width="42" height="1.94661642"></rect>
                                        <rect id="Rectangle-2-Copy" x="0" y="0" width="42" height="7.94661642"></rect>
                                    </g>
                                </g>
                            </g>
                        </g>
                    </g>
                </svg>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  }
}
