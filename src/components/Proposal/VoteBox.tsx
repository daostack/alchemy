import { Address, IDAOState, IMemberState, IProposalOutcome, IProposalStage, IProposalState } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import { checkNetworkAndWarn, getArc } from "arc";
import BN = require("bn.js");
import * as classNames from "classnames";
import ReputationView from "components/Account/ReputationView";
import { ActionTypes, default as PreTransactionModal } from "components/Shared/PreTransactionModal";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import Tooltip from "rc-tooltip";
import Util from "lib/util";
import * as React from "react";
import { connect } from "react-redux";
import { showNotification } from "reducers/notifications";
import { of } from "rxjs";
import * as css from "./Proposal.scss";
import VoteGraph from "./VoteGraph";

interface IContainerProps {
  buttonsOnly?: boolean;
  currentAccountAddress: Address;
  currentAccountState: IMemberState|undefined;
  currentVote: number;
  dao: IDAOState;
  detailView?: boolean;
  expired?: boolean;
  historyView?: boolean;
  proposal: IProposalState;
  voteOnProposal: typeof arcActions.voteOnProposal;
  showNotification: typeof showNotification;
  isVotingNo: boolean;
  isVotingYes: boolean;
}

interface IState {
  currentVote: number;
  showPreVoteModal: boolean;
}

const mapDispatchToProps = {
  showNotification,
  voteOnProposal: arcActions.voteOnProposal,
};

class VoteBox extends React.Component<IContainerProps, IState> {

  constructor(props: IContainerProps) {
    super(props);

    this.state = {
      currentVote: this.props.currentVote,
      showPreVoteModal: false
    };
  }

  public async handleClickVote(vote: number, event: any) {
    if (!(await checkNetworkAndWarn(this.props.showNotification))) { return; }
    const { currentAccountState } = this.props;
    if (currentAccountState.reputation.gt(new BN(0))) {
      this.setState({ showPreVoteModal: true, currentVote: vote });
    }
  }

  public closePreVoteModal(event: any) {
    this.setState({ showPreVoteModal: false });
  }

  public render() {
    const {
      buttonsOnly,
      currentVote,
      currentAccountState,
      proposal,
      dao,
      detailView,
      expired,
      historyView,
      isVotingNo,
      isVotingYes,
      voteOnProposal,
    } = this.props;

    const isVoting = isVotingNo || isVotingYes;
    const totalReputationSupply = Util.fromWei(dao.reputationTotalSupply);
    const votesFor = Util.fromWei(proposal.votesFor);
    const votesAgainst = Util.fromWei(proposal.votesAgainst);

    // If percentages are less than 2 then set them to 2 so they can be visibly noticed
    const yesPercentage = totalReputationSupply && votesFor ? Math.max(2, +(votesFor / totalReputationSupply * 100).toFixed(2)) : 0;
    const noPercentage = totalReputationSupply && votesAgainst ? Math.max(2, +(votesAgainst / totalReputationSupply * 100).toFixed(2)) : 0;

    const styles = {
      forBar: {
        width: yesPercentage + "%",
      },
      againstBar: {
        width: noPercentage + "%",
      },
    };

    const votingDisabled = proposal.stage === IProposalStage.ExpiredInQueue ||
                            proposal.stage === IProposalStage.Executed ||
                            (proposal.stage === IProposalStage.Boosted && expired) ||
                            !currentAccountState ||
                            currentAccountState.reputation.eq(new BN(0)) ||
                            !!currentVote;

    const tipContent = (vote: IProposalOutcome) =>
      !currentAccountState ?
        "Cannot vote - please log in" :
      currentVote ?
        "Can't change your vote" :
      currentAccountState.reputation.eq(new BN(0)) ?
        "Voting requires reputation in " + dao.name :
      proposal.stage === IProposalStage.ExpiredInQueue || (proposal.stage === IProposalStage.Boosted && expired) ?
        "Can't vote on expired proposals" :
      proposal.stage === IProposalStage.Executed ?
        "Can't vote on executed proposals" :
      isVoting ?
        "Warning: Voting for this proposal is already in progress" :
      `Vote ${vote === IProposalOutcome.Pass ? "for" : "against"}`
    ;

    const wrapperClass = classNames({
      [css.detailView] : detailView,
      [css.historyView] : historyView,
      [css.voteBox] : true,
      [css.clearfix] : true,
      [css.unconfirmedVote] : isVoting,
    });
    const voteUpButtonClass = classNames({
      [css.votedFor]: !isVotingYes && currentVote === IProposalOutcome.Pass,
      [css.disabled]: votingDisabled,
      [css.upvotePending]: isVotingYes,
    });
    const voteDownButtonClass = classNames({
      [css.votedAgainst]: !isVotingNo && currentVote === IProposalOutcome.Fail,
      [css.disabled]: votingDisabled,
      [css.downvotePending]: isVotingNo,
    });
    const voteStatusClass = classNames({
      [css.buttonsOnly] : buttonsOnly,
      [css.voteStatus]: true,
      [css.hasVoted]: currentVote,
      [css.votedFor]: !isVotingYes && currentVote === IProposalOutcome.Pass,
      [css.votedAgainst]: !isVotingNo && currentVote === IProposalOutcome.Fail,
      [css.hasNotVoted]: !currentVote,
    });

    const voteControls = classNames({
      [css.voteControls]: true,
      [css.votedFor]: !isVotingYes && currentVote === IProposalOutcome.Pass,
      [css.votedAgainst]: !isVotingNo && currentVote === IProposalOutcome.Fail
    });

    if (!buttonsOnly) {
      return (
        <div className={wrapperClass}>
          {this.state.showPreVoteModal ?
            <PreTransactionModal
              actionType={this.state.currentVote === 1 ? ActionTypes.VoteUp : ActionTypes.VoteDown}
              action={voteOnProposal.bind(null, dao.address, proposal.id, this.state.currentVote)}
              closeAction={this.closePreVoteModal.bind(this)}
              currentAccount={currentAccountState}
              dao={dao}
              effectText={<span>Your influence: <strong><ReputationView daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={currentAccountState.reputation} /></strong></span>}
              proposal={proposal}
            /> : ""
          }
          { this.props.detailView ?
            <div className={voteStatusClass} >
              <div className={css.statusTitle}>
                <h3>Votes</h3>
                <span>{proposal.votesCount} Vote{proposal.votesCount === 1 ? "" : "s"}</span>
              </div>

              <div className={css.castVote}>
                {!votingDisabled ?
                  <div>
                    <button onClick={this.handleClickVote.bind(this, 1)} className={voteUpButtonClass} data-test-id="voteFor">
                      <img src="/assets/images/Icon/vote/for-btn-selected.svg"/>
                      <img className={css.buttonLoadingImg} src="/assets/images/Icon/buttonLoadingBlue.gif"/>
                      <span> For</span>
                    </button>
                    <button onClick={this.handleClickVote.bind(this, 2)} className={voteDownButtonClass}>
                      <img src="/assets/images/Icon/vote/against-btn-selected.svg"/>
                      <img className={css.buttonLoadingImg} src="/assets/images/Icon/buttonLoadingBlue.gif"/>
                      <span> Against</span>
                    </button>
                  </div>
                  :
                  <div className={css.votingDisabled}>
                    <Tooltip overlay={tipContent}>
                      <span>Voting disabled</span>
                    </Tooltip>
                  </div>
                }
              </div>

              <div className={css.voteRecord}>
                You voted
                <span className={css.castVoteFor} data-test-id="youVotedFor">
                  - For
                </span>
                <span className={css.castVoteAgainst}>
                  - Against
                </span>
              </div>
            </div>
          : " "
          }
          <div className={voteControls + " " + css.clearfix}>
            <div className={css.voteDivider}>
              <div className={css.voteGraphs}>
                { !this.props.detailView ?
                   <VoteGraph size={40} yesPercentage={yesPercentage} noPercentage={noPercentage} relative={proposal.stage === IProposalStage.Boosted} detailView={detailView} />
                 : " "
                }
                { this.props.detailView ?
                   <VoteGraph size={90} yesPercentage={yesPercentage} noPercentage={noPercentage} relative={proposal.stage === IProposalStage.Boosted}  detailView={detailView}/>
                 : " "
                }
              </div>
            </div>
            <div className={css.voteButtons}>
              <div className={css.voteUp}>
                <div>
                <div className={css.label}>For</div>
                  <span className={voteUpButtonClass}>
                    <img className={css.upvote} src="/assets/images/Icon/vote/for-gray.svg"/>
                    <img className={css.upvote + " " + css.upvoted} src="/assets/images/Icon/vote/for-fill.svg"/>
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
                    <span>
                      <ReputationView daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={proposal.votesFor} hideSymbol={true} />
                      <b className={css.label}> Rep</b>
                    </span>
                  </span>
                </div>
              </div>
              <div className={css.voteDown}>
                <div>
                  <div className={css.label}>Against</div>
                  <span className={voteDownButtonClass}>
                    <img className={css.downvote} src="/assets/images/Icon/vote/against-gray.svg"/>
                    <img className={css.downvote + " " + css.downvoted} src="/assets/images/Icon/vote/against-fill.svg"/>
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
                    <span>
                      <ReputationView daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={proposal.votesAgainst} hideSymbol={true} />
                      <b className={css.label}> Rep</b>
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          { !this.props.detailView ?
            <div className={voteStatusClass} >

              <div className={css.castVote}>
                {!votingDisabled ?
                  <div>
                    <button onClick={this.handleClickVote.bind(this, 1)} className={voteUpButtonClass} data-test-id="voteFor">
                      <img src="/assets/images/Icon/vote/for-btn-selected.svg"/>
                      <img className={css.buttonLoadingImg} src="/assets/images/Icon/buttonLoadingBlue.gif"/>
                      <span> For</span>
                    </button>
                    <button onClick={this.handleClickVote.bind(this, 2)} className={voteDownButtonClass}>
                      <img src="/assets/images/Icon/vote/against-btn-selected.svg"/>
                      <img className={css.buttonLoadingImg} src="/assets/images/Icon/buttonLoadingBlue.gif"/>
                      <span> Against</span>
                    </button>
                  </div>
                  :
                  <div className={css.votingDisabled + " " + css.cardView}>
                    <Tooltip overlay={tipContent}>
                      <span>Voting disabled</span>
                    </Tooltip>
                  </div>
                }
              </div>

              <div className={css.voteRecord}>
                You voted
                <span className={css.castVoteFor} data-test-id="youVotedFor">
                  - For
                </span>
                <span className={css.castVoteAgainst}>
                  - Against
                </span>
              </div>
            </div>
          : " "
          }
        </div>
      );
    } else {
      return (
        <div className={voteStatusClass} >
          {this.state.showPreVoteModal ?
            <PreTransactionModal
              actionType={this.state.currentVote === 1 ? ActionTypes.VoteUp : ActionTypes.VoteDown}
              action={voteOnProposal.bind(null, dao.address, proposal.id, this.state.currentVote)}
              closeAction={this.closePreVoteModal.bind(this)}
              currentAccount={currentAccountState}
              dao={dao}
              effectText={<span>Your influence: <strong><ReputationView daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={currentAccountState.reputation} /></strong></span>}
              proposal={proposal}
            /> : ""
          }

          <div className={css.castVote}>
            {!votingDisabled ?
              <div>
                <button onClick={this.handleClickVote.bind(this, 1)} className={voteUpButtonClass} data-test-id="voteFor">
                  <img src="/assets/images/Icon/vote/for-btn-selected-w.svg"/>
                  <img className={css.buttonLoadingImg} src="/assets/images/Icon/buttonLoadingBlue.gif"/>
                  <span> For</span>
                </button>
                <button onClick={this.handleClickVote.bind(this, 2)} className={voteDownButtonClass}>
                  <img src="/assets/images/Icon/vote/against-btn-selected-w.svg"/>
                  <img className={css.buttonLoadingImg} src="/assets/images/Icon/buttonLoadingBlue.gif"/>
                  <span> Against</span>
                </button>
              </div>
              :
              <div className={css.votingDisabled}>
                <Tooltip overlay={tipContent}>
                  <span>Voting disabled</span>
                </Tooltip>
              </div>
            }
          </div>

          <div className={css.voteRecord}>
            You voted
            <span className={css.castVoteFor} data-test-id="youVotedFor">
              - For
            </span>
            <span className={css.castVoteAgainst}>
              - Against
            </span>
          </div>
        </div>
      );
    }
  }
}
const ConnectedVoteBox = connect(null, mapDispatchToProps)(VoteBox);

interface IProps {
  buttonsOnly?: boolean;
  detailView?: boolean;
  historyView?: boolean;
  currentAccountAddress: Address;
  currentVote: number;
  dao: IDAOState;
  expired?: boolean;
  proposal: IProposalState;
  isVotingNo: boolean;
  isVotingYes: boolean;
}

export default (props: IProps) => {

  const arc = getArc();
  const dao = arc.dao(props.dao.address);
  const observable = props.currentAccountAddress ? dao.member(props.currentAccountAddress.toLowerCase()).state() : of(null);

  return <Subscribe observable={observable}>{
    (state: IObservableState<IMemberState>): any => {
      if (state.isLoading) {
        return <div>Loading votebox...</div>;
      } else if (state.error) {
        return <div>{ state.error.message }</div>;
      } else {
        return <ConnectedVoteBox currentAccountState={state.data} { ...props } />;
      }
    }
  }</Subscribe>;
};
