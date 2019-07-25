import { Address, IDAOState, IMemberState, IProposalOutcome, IProposalStage, IProposalState } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import { checkWeb3ProviderAndWarn, getArc } from "arc";

import BN = require("bn.js");
import * as classNames from "classnames";
import ReputationView from "components/Account/ReputationView";
import { ActionTypes, default as PreTransactionModal } from "components/Shared/PreTransactionModal";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { connect } from "react-redux";
import { showNotification } from "reducers/notifications";
import { of } from "rxjs";
import * as css from "./VoteButtons.scss";

interface IContainerProps {
  altStyle?: boolean;
  contextMenu?: boolean;
  currentAccountAddress: Address;
  currentAccountState: IMemberState|undefined;
  currentVote: number;
  dao: IDAOState;
  detailView?: boolean;
  expired?: boolean;
  proposal: IProposalState;
  voteOnProposal: typeof arcActions.voteOnProposal;
  showNotification: typeof showNotification;
  isVotingNo?: boolean;
  isVotingYes?: boolean;
}

interface IState {
  contextMenu?: boolean;
  currentVote: number;
  showPreVoteModal: boolean;
  detailView?: boolean;
}

const mapDispatchToProps = {
  showNotification,
  voteOnProposal: arcActions.voteOnProposal,
};

class VoteButtons extends React.Component<IContainerProps, IState> {

  constructor(props: IContainerProps) {
    super(props);

    this.state = {
      currentVote: this.props.currentVote,
      showPreVoteModal: false,
    };
  }

  public async handleClickVote(vote: number, _event: any): Promise<void> {
    if (!(await checkWeb3ProviderAndWarn(this.props.showNotification))) { return; }
    const { currentAccountState } = this.props;
    if (currentAccountState.reputation.gt(new BN(0))) {
      this.setState({ showPreVoteModal: true, currentVote: vote });
    }
  }

  public closePreVoteModal(_event: any): void {
    this.setState({ showPreVoteModal: false });
  }

  public render(): any {
    const {
      altStyle,
      contextMenu,
      currentVote,
      currentAccountState,
      detailView,
      proposal,
      dao,
      expired,
      isVotingNo,
      isVotingYes,
      voteOnProposal,
    } = this.props;

    const isVoting = isVotingNo || isVotingYes;

    const votingDisabled = proposal.stage === IProposalStage.ExpiredInQueue ||
                            proposal.stage === IProposalStage.Executed ||
                            (proposal.stage === IProposalStage.Boosted && expired) ||
                            (proposal.stage === IProposalStage.QuietEndingPeriod && expired) ||
                            !currentAccountState ||
                            currentAccountState.reputation.eq(new BN(0)) ||
                            !!currentVote;

    const tipContent = (vote: IProposalOutcome): string =>
      !currentAccountState ?
        "Cannot vote - please log in" :
        currentVote ?
          "Can't change your vote" :
          currentAccountState.reputation.eq(new BN(0)) ?
            "Voting requires reputation in " + dao.name :
            proposal.stage === IProposalStage.ExpiredInQueue || (proposal.stage === IProposalStage.Boosted && expired) || (proposal.stage === IProposalStage.QuietEndingPeriod && expired) ?
              "Can't vote on expired proposals" :
              proposal.stage === IProposalStage.Executed ?
                "Can't vote on executed proposals" :
                isVoting ?
                  "Warning: Voting for this proposal is already in progress" :
                  `Vote ${vote === IProposalOutcome.Pass ? "for" : "against"}`
    ;

    const voteUpButtonClass = classNames({
      [css.votedFor]: !isVotingYes && currentVote === IProposalOutcome.Pass,
      [css.disabled]: votingDisabled,
    });
    const voteDownButtonClass = classNames({
      [css.votedAgainst]: !isVotingNo && currentVote === IProposalOutcome.Fail,
      [css.disabled]: votingDisabled,
    });
    const wrapperClass = classNames({
      [css.altStyle] : altStyle,
      [css.contextMenu] : contextMenu,
      [css.wrapper]: true,
      [css.hasVoted]: currentVote,
      [css.votedFor]: !isVotingYes && currentVote === IProposalOutcome.Pass,
      [css.votedAgainst]: !isVotingNo && currentVote === IProposalOutcome.Fail,
      [css.hasNotVoted]: !currentVote,
      [css.detailView]: detailView,
    });

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
        {contextMenu ?
          <div>
            <div className={css.contextTitle}>
              <div>
                <span className={css.hasVoted}>
                You voted
                </span>
                <span className={css.hasNotVoted}>
                Vote
                </span>
              </div>
            </div>
            <div className={css.contextContent}>
              <div className={css.hasVoted}>
                <div className={css.voteRecord}>
                  <span className={css.castVoteFor} data-test-id="youVotedFor">
                    <img src="/assets/images/Icon/vote/for-fill-green.svg"/>
                    <br/>
                 For
                  </span>
                  <span className={css.castVoteAgainst}>
                    <img src="/assets/images/Icon/vote/against-btn-fill-red.svg"/>
                    <br/>
                 Against
                  </span>
                </div>
              </div>
              <div className={css.hasNotVoted}>
                {!votingDisabled ?
                  <div>
                    <button onClick={this.handleClickVote.bind(this, 1)} className={voteUpButtonClass} data-test-id="voteFor">
                      <img src={`/assets/images/Icon/vote/for-btn-selected${altStyle ? "-w" : ""}.svg`} />
                      <img className={css.buttonLoadingImg} src="/assets/images/Icon/buttonLoadingBlue.gif"/>
                      <span> For</span>
                    </button>
                    <button onClick={this.handleClickVote.bind(this, 2)} className={voteDownButtonClass}>
                      <img src={`/assets/images/Icon/vote/against-btn-selected${altStyle ? "-w" : ""}.svg`}/>
                      <img className={css.buttonLoadingImg} src="/assets/images/Icon/buttonLoadingBlue.gif"/>
                      <span> Against</span>
                    </button>
                  </div>
                  :
                  <div className={css.votingDisabled}>
                    <Tooltip overlay={tipContent}>
                      <span><img src="/assets/images/Icon/Alert-yellow-b.svg"/> Voting disabled</span>
                    </Tooltip>
                  </div>
                }
              </div>
            </div>
          </div>
          :
          <div>
            <div className={css.castVote}>
              {!votingDisabled ?
                <div>
                  <button onClick={this.handleClickVote.bind(this, 1)} className={voteUpButtonClass} data-test-id="voteFor">
                    <img src={`/assets/images/Icon/vote/for-btn-selected${altStyle ? "-w" : ""}.svg`} />
                    <img className={css.buttonLoadingImg} src="/assets/images/Icon/buttonLoadingBlue.gif"/>
                    <span> For</span>
                  </button>
                  <button onClick={this.handleClickVote.bind(this, 2)} className={voteDownButtonClass}>
                    <img src={`/assets/images/Icon/vote/against-btn-selected${altStyle ? "-w" : ""}.svg`}/>
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
        }
      </div>
    );
  }
}

const ConnectedVoteButtons = connect(null, mapDispatchToProps)(VoteButtons);

interface IProps {
  altStyle?: boolean;
  contextMenu?: boolean;
  currentAccountAddress: Address;
  currentVote: number;
  dao: IDAOState;
  detailView?: boolean;
  expired?: boolean;
  proposal: IProposalState;
  isVotingNo?: boolean;
  isVotingYes?: boolean;
}

export default (props: IProps): any => {

  const arc = getArc();
  const dao = arc.dao(props.dao.address);
  const observable = props.currentAccountAddress ? dao.member(props.currentAccountAddress).state() : of(null);

  return <Subscribe observable={observable}>{
    (state: IObservableState<IMemberState>): any => {
      if (state.isLoading) {
        return <div>Loading votebox...</div>;
      } else if (state.error) {
        return <div>{ state.error.message }</div>;
      } else {
        return <ConnectedVoteButtons currentAccountState={state.data} {...props} />;
      }
    }
  }</Subscribe>;
};
