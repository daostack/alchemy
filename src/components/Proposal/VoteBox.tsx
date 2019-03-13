import { Address, IDAOState, IMemberState, IProposalStage, IProposalState, ProposalOutcome } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import { getArc } from "arc";
import BN = require("bn.js");
import * as classNames from "classnames";
import ReputationView from "components/Account/ReputationView";
import { ActionTypes, default as PreTransactionModal } from "components/Shared/PreTransactionModal";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import Util, { checkNetworkAndWarn} from "lib/util";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { connect } from "react-redux";
import { combineLatest, of } from "rxjs";
import * as css from "./Proposal.scss";
import VoteGraph from "./VoteGraph";

interface IContainerProps {
  buttonsOnly?: boolean;
  detailView?: boolean;
  currentAccountAddress: Address;
  currentAccountState: IMemberState|undefined;
  currentVote: number;
  dao: IDAOState;
  proposal: IProposalState;
  voteOnProposal: typeof arcActions.voteOnProposal;
  isVotingNo: boolean;
  isVotingYes: boolean;
}

interface IState {
  currentVote: number;
  showPreVoteModal: boolean;
}

const mapDispatchToProps = {
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

  public handleClickVote(vote: number, event: any) {
    if (!checkNetworkAndWarn()) { return; }
    const { currentAccountState } = this.props;
    if (currentAccountState.reputation) {
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
      isVotingNo,
      isVotingYes,
      voteOnProposal,
      detailView,
    } = this.props;

    const isVoting = isVotingNo || isVotingYes;
    const totalReputationSupply = Util.fromWei(dao.reputationTotalSupply);
    const votesFor = Util.fromWei(proposal.votesFor);
    const votesAgainst = Util.fromWei(proposal.votesAgainst);

    // If percentages are less than 2 then set them to 2 so they can be visibly noticed
    let yesPercentage = totalReputationSupply && votesFor ? Math.max(2, Math.ceil(votesFor / totalReputationSupply * 100)) : 0;
    let noPercentage = totalReputationSupply && votesAgainst ? Math.max(2, Math.ceil(votesAgainst / totalReputationSupply * 100)) : 0;

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

    const votingDisabled = !currentAccountState || !currentAccountState.reputation || !!currentVote;

    let wrapperClass = classNames({
      [css.detailView] : detailView,
      [css.voteBox] : true,
      [css.clearfix] : true,
      [css.unconfirmedVote] : isVoting,
    });
    let voteUpButtonClass = classNames({
      [css.voted]: !isVotingYes && currentVote === ProposalOutcome.Pass,
      [css.disabled]: votingDisabled,
      [css.upvotePending]: isVotingYes,
    });
    let voteDownButtonClass = classNames({
      [css.voted]: !isVotingNo && currentVote === ProposalOutcome.Fail,
      [css.disabled]: votingDisabled,
      [css.downvotePending]: isVotingNo,
    });
    let voteStatusClass = classNames({
      [css.buttonsOnly] : buttonsOnly,
      [css.voteStatus]: true,
      [css.hasVoted]: currentVote,
      [css.votedFor]: !isVotingYes && currentVote === ProposalOutcome.Pass,
      [css.votedAgainst]: !isVotingNo && currentVote === ProposalOutcome.Fail,
      [css.hasNotVoted]: !currentVote,
    });

    const voteControls = classNames({
      [css.voteControls]: true
    });

    const tipContent = (vote: ProposalOutcome) =>
      !currentAccountState ?
        "Cannot vote - please log in" :
      currentVote ?
        "Can't change your vote" :
      !currentAccountState.reputation ?
        "Voting requires reputation in " + dao.name :
      isVoting ?
        "Warning: Voting for this proposal is already in progress" :
        `Vote ${vote === ProposalOutcome.Pass ? "for" : "against"}`
    ;

    if (!buttonsOnly) {
      return (
        <div className={wrapperClass}>
          {this.state.showPreVoteModal ?
            <PreTransactionModal
              actionType={this.state.currentVote == 1 ? ActionTypes.VoteUp : ActionTypes.VoteDown}
              action={voteOnProposal.bind(null, dao.address, proposal.id, this.state.currentVote)}
              closeAction={this.closePreVoteModal.bind(this)}
              currentAccount={currentAccountState.address}
              dao={dao}
              effectText={<span>Your influence: <strong><ReputationView daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={currentAccountState.reputation} /></strong></span>}
              proposal={proposal}
            /> : ""
          }
          { this.props.detailView ?
            <div className={voteStatusClass} >
              <div className={css.statusTitle}>
                <h3>Votes</h3>
                <span>NUM Votes ></span>
              </div>
              <div className={css.castVote}>
                <button onClick={votingDisabled ? null : this.handleClickVote.bind(this, 1)} className={voteUpButtonClass}>
                  <img src="/assets/images/Icon/vote/for-btn-selected.svg"/><span> For</span>
                </button>
                <button onClick={votingDisabled ? null : this.handleClickVote.bind(this, 2)} className={voteDownButtonClass}>
                  <img src="/assets/images/Icon/vote/against-btn-selected.svg"/><span> Against</span>
                </button>
              </div>
              <div className={css.voteRecord}>
                You voted
                <span className={css.castVoteFor}>
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
                   <VoteGraph size={40} yesPercentage={yesPercentage} noPercentage={noPercentage} relative={proposal.stage == IProposalStage.Boosted} />
                 : " "
                }
                <div className={css.reputationTurnout}>
                  <div className={css.header}>Reputation turnout</div>
                  <div className={css.turnoutInfo}>
                    {/* TODO: <span className={css.description}>{proposal.votes.length} accounts holding {proposal.totalVotes} reputation have voted</span>*/}
                    <div className={css.turnoutGraph}>
                      <div className={css.turnoutStats}>
                        <span className={css.forLabel}>
                          <ReputationView
                            daoName={dao.name}
                            totalReputation={dao.reputationTotalSupply}
                            reputation={proposal.votesFor}
                          /> for
                        </span>
                        <span className={css.againstLabel}>
                          <ReputationView
                            daoName={dao.name}
                            totalReputation={dao.reputationTotalSupply}
                            reputation={proposal.votesAgainst}
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
                          totalReputation={dao.reputationTotalSupply}
                          reputation={dao.reputationTotalSupply.div(new BN(2))}
                        /> NEEDED FOR DECISION BY VOTE
                      </div>
                    </div>
                  </div>
                  <div className={css.tooltipPointer}>
                    <img src="/assets/images/tooltip-pointer.svg"/>
                  </div>
                </div>
                { this.props.detailView ?
                   <VoteGraph size={90} yesPercentage={yesPercentage} noPercentage={noPercentage} relative={proposal.stage == IProposalStage.Boosted} />
                 : " "
                }

              </div>
            </div>
            <div className={css.voteButtons}>
              <div className={css.voteUp}>
                <Tooltip placement="right" trigger={["hover"]} overlay={tipContent(ProposalOutcome.Pass)} overlayClassName={css.voteTooltip}>
                  <div>
                  <div className={css.label}>For</div>
                    <button onClick={votingDisabled ? null : this.handleClickVote.bind(this, 1)} className={voteUpButtonClass}>
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
                        {yesPercentage}%
                        <b className={css.label}> Rep</b>
                      </span>
                    </button>
                  </div>
                </Tooltip>
              </div>
              <div className={css.voteDown}>
                <Tooltip placement="right" trigger={["hover"]} overlay={tipContent(ProposalOutcome.Fail)} overlayClassName={css.voteTooltip}>
                  <div>
                    <div className={css.label}>Against</div>
                    <button onClick={votingDisabled ? null : this.handleClickVote.bind(this, 2)} className={voteDownButtonClass}>
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
                        {noPercentage}%
                        <b className={css.label}> Rep</b>
                      </span>
                    </button>
                  </div>
                </Tooltip>
              </div>
            </div>
          </div>
          { !this.props.detailView ?
            <div className={voteStatusClass} >
              <div className={css.castVote}>
                <button onClick={votingDisabled ? null : this.handleClickVote.bind(this, 1)} className={voteUpButtonClass}>
                  <img src="/assets/images/Icon/vote/for-btn-selected.svg"/><span> For</span>
                </button>
                <button onClick={votingDisabled ? null : this.handleClickVote.bind(this, 2)} className={voteDownButtonClass}>
                  <img src="/assets/images/Icon/vote/against-btn-selected.svg"/><span> Against</span>
                </button>
              </div>
              <div className={css.voteRecord}>
                You voted
                <span className={css.castVoteFor}>
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
          <div className={css.castVote}>
            <span className={css.buttonsOnlyVoteLabel}>Vote: </span>
            <button onClick={votingDisabled ? null : this.handleClickVote.bind(this, 1)} className={voteUpButtonClass}>
              <img src="/assets/images/Icon/vote/for-btn-selected.svg"/><span> For</span>
            </button>
            <button onClick={votingDisabled ? null : this.handleClickVote.bind(this, 2)} className={voteDownButtonClass}>
              <img src="/assets/images/Icon/vote/against-btn-selected.svg"/><span> Against</span>
            </button>
          </div>
          <div className={css.voteRecord}>
            You voted
            <span className={css.castVoteFor}>
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
  currentAccountAddress: Address;
  currentVote: number;
  dao: IDAOState;
  proposal: IProposalState;
  isVotingNo: boolean;
  isVotingYes: boolean;
}

export default (props: IProps) => {

  const arc = getArc();
  const dao = arc.dao(props.dao.address);
  const observable = props.currentAccountAddress ? dao.member(props.currentAccountAddress.toLowerCase()).state() : of(null);
  console.log("voteox", props.currentAccountAddress);
  return <Subscribe observable={observable}>{
    (state: IObservableState<IMemberState>): any => {
      if (state.isLoading) {
        return <div>Loading proposal...</div>;
      } else if (state.error) {
        return <div>{ state.error.message }</div>;
      } else {
        console.log("votebox", state.data);
        return <ConnectedVoteBox currentAccountState={state.data} { ...props } />;
      }
    }
  }</Subscribe>;
};
