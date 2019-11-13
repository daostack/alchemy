import { Address, IDAOState, IMemberState, IProposalOutcome, IProposalStage, IProposalState } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import { enableWalletProvider } from "arc";

import BN = require("bn.js");
import * as classNames from "classnames";
import Reputation from "components/Account/Reputation";
import { ActionTypes, default as PreTransactionModal } from "components/Shared/PreTransactionModal";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { connect } from "react-redux";
import { showNotification } from "reducers/notifications";
import * as css from "./VoteButtons.scss";

interface IExternalProps {
  altStyle?: boolean;
  contextMenu?: boolean;
  currentAccountAddress: Address;
  currentAccountState: IMemberState;
  currentVote: IProposalOutcome|undefined;
  dao: IDAOState;
  detailView?: boolean;
  expired?: boolean;
  proposal: IProposalState;
}

interface IDispatchProps {
  voteOnProposal: typeof arcActions.voteOnProposal;
  showNotification: typeof showNotification;
}

type IProps = IExternalProps & IDispatchProps;

interface IState {
  contextMenu?: boolean;
  currentVote: IProposalOutcome|undefined;
  showPreVoteModal: boolean;
  detailView?: boolean;
}

const mapDispatchToProps = {
  showNotification,
  voteOnProposal: arcActions.voteOnProposal,
};

class VoteButtons extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      currentVote: this.props.currentVote,
      showPreVoteModal: false,
    };
  }

  public async handleClickVote(vote: number, _event: any): Promise<void> {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    const currentAccountState = this.props.currentAccountState;
    if (currentAccountState.reputation.gt(new BN(0))) {
      this.setState({ showPreVoteModal: true, currentVote: vote });
    }
  }

  public closePreVoteModal(_event: any): void {
    this.setState({ showPreVoteModal: false });
  }

  public render(): RenderOutput {
    const {
      altStyle,
      contextMenu,
      currentVote,
      currentAccountState,
      detailView,
      proposal,
      dao,
      expired,
      voteOnProposal,
    } = this.props;

    const votingDisabled = proposal.stage === IProposalStage.ExpiredInQueue ||
                            proposal.stage === IProposalStage.Executed ||
                            (proposal.stage === IProposalStage.Queued && expired) ||
                            (proposal.stage === IProposalStage.Boosted && expired) ||
                            (proposal.stage === IProposalStage.QuietEndingPeriod && expired) ||
                            (currentAccountState && currentAccountState.reputation.eq(new BN(0))) ||
                            currentVote === IProposalOutcome.Pass ||
                            currentVote === IProposalOutcome.Fail
                            ;

    /**
     * only invoked when votingDisabled
     * @param vote
     */
    const tipContent = (vote: IProposalOutcome|undefined): string =>
      ((currentVote === IProposalOutcome.Pass) || (currentVote === IProposalOutcome.Fail)) ?
        "Can't change your vote" :
        (currentAccountState && currentAccountState.reputation.eq(new BN(0))) ?
          "Voting requires reputation in " + dao.name :
          proposal.stage === IProposalStage.ExpiredInQueue || (proposal.stage === IProposalStage.Boosted && expired) || (proposal.stage === IProposalStage.QuietEndingPeriod && expired)  || (proposal.stage === IProposalStage.Queued && expired) ?
            "Can't vote on expired proposals" :
            proposal.stage === IProposalStage.Executed ?
              "Can't vote on executed proposals" :
              `Vote ${vote === IProposalOutcome.Pass ? "for" : "against"}`
;

    const voteUpButtonClass = classNames({
      [css.votedFor]: currentVote === IProposalOutcome.Pass,
      [css.disabled]: votingDisabled,
    });
    const voteDownButtonClass = classNames({
      [css.votedAgainst]: currentVote === IProposalOutcome.Fail,
      [css.disabled]: votingDisabled,
    });
    const wrapperClass = classNames({
      [css.altStyle] : altStyle,
      [css.contextMenu] : contextMenu,
      [css.wrapper]: true,
      [css.hasVoted]: ((currentVote === IProposalOutcome.Pass) || (currentVote === IProposalOutcome.Fail)),
      [css.votedFor]: currentVote === IProposalOutcome.Pass,
      [css.votedAgainst]: currentVote === IProposalOutcome.Fail,
      [css.hasNotVoted]: ((currentVote === undefined) || (currentVote === IProposalOutcome.None)),
      [css.detailView]: detailView,
    });

    return (
      <div className={wrapperClass}>
        {this.state.showPreVoteModal ?
          <PreTransactionModal
            actionType={this.state.currentVote === IProposalOutcome.Pass ? ActionTypes.VoteUp : ActionTypes.VoteDown}
            action={voteOnProposal.bind(null, dao.address, proposal.id, this.state.currentVote)}
            closeAction={this.closePreVoteModal.bind(this)}
            currentAccount={currentAccountState}
            dao={dao}
            effectText={<span>Your influence: <strong><Reputation daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={currentAccountState.reputation} /></strong></span>}
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
                  <Tooltip placement="bottom" overlay={tipContent}>
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

export default connect(null, mapDispatchToProps)(VoteButtons);
