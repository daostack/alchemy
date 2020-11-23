import { Address, IDAOState, IMemberState, IProposalOutcome, IProposalStage, IProposalState } from "@daostack/arc.js";
import { voteOnProposal } from "actions/arcActions";
import { enableWalletProvider } from "arc";

import BN = require("bn.js");
import classNames from "classnames";
import Reputation from "components/Account/Reputation";
import { ActionTypes, default as PreTransactionModal } from "components/Shared/PreTransactionModal";
import Analytics from "lib/analytics";
import { fromWei, getNetworkByDAOAddress, targetedNetwork } from "lib/util";
import { Page } from "pages";
import * as React from "react";
import { connect } from "react-redux";
import { showNotification } from "reducers/notifications";
import * as css from "./VoteButtons.scss";

interface IExternalProps {
  altStyle?: boolean;
  contextMenu?: boolean;
  currentAccountAddress: Address;
  currentAccountState: IMemberState;
  currentVote: IProposalOutcome | undefined;
  dao: IDAOState;
  expired?: boolean;
  parentPage: Page;
  proposal: IProposalState;
}

interface IDispatchProps {
  voteOnProposal: typeof voteOnProposal;
  showNotification: typeof showNotification;
}

type IProps = IExternalProps & IDispatchProps;

interface IState {
  contextMenu?: boolean;
  currentVote: IProposalOutcome | undefined;
  showPreVoteModal: boolean;
}

const mapDispatchToProps = {
  showNotification,
  voteOnProposal,
};

class VoteButtons extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      currentVote: this.props.currentVote,
      showPreVoteModal: false,
    };
  }

  public handleClickVote = (vote: number) => async (): Promise<void> => {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification }, getNetworkByDAOAddress(this.props.dao.id))) { return; }

    const currentAccountState = this.props.currentAccountState;
    if (currentAccountState.reputation.gt(new BN(0))) {
      this.setState({ showPreVoteModal: true, currentVote: vote });
    }
  }

  private closePreVoteModal = (_event: any): void => { this.setState({ showPreVoteModal: false }); }

  private handleVoteOnProposal = (): void => {
    const { currentAccountState, dao, proposal } = this.props;

    this.props.voteOnProposal(dao.address, proposal.id, this.state.currentVote);

    Analytics.track("Vote", {
      "DAO Address": dao.address,
      "DAo Name": dao.name,
      "Proposal Hash": proposal.id,
      "Proposal Title": proposal.title,
      "Reputation Voted": fromWei(currentAccountState.reputation),
      "Scheme Address": proposal.scheme.address,
      "Scheme Name": proposal.scheme.name,
      "Vote Type": this.state.currentVote === IProposalOutcome.Fail ? "Fail" : this.state.currentVote === IProposalOutcome.Pass ? "Pass" : "None",
    });
  };

  public render(): RenderOutput {
    const {
      altStyle,
      contextMenu,
      currentVote,
      currentAccountState,
      parentPage,
      proposal,
      dao,
      expired,
    } = this.props;

    const votingDisabled = proposal.stage === IProposalStage.ExpiredInQueue ||
      proposal.stage === IProposalStage.Executed ||
      (proposal.stage === IProposalStage.Queued && expired) ||
      (proposal.stage === IProposalStage.Boosted && expired) ||
      (proposal.stage === IProposalStage.QuietEndingPeriod && expired) ||
      (currentAccountState && currentAccountState.reputation.eq(new BN(0))) ||
      (currentAccountState && (proposal.createdAt < currentAccountState.createdAt) &&
        //this is a workaround till https://github.com/daostack/subgraph/issues/548
        (targetedNetwork() !== "ganache")) ||
      currentVote === IProposalOutcome.Pass ||
      currentVote === IProposalOutcome.Fail
      ;

    /**
     * only used when votingDisabled
     */
    const disabledMessage =
      (proposal.stage !== IProposalStage.Executed) ?
        (((currentVote === IProposalOutcome.Pass) || (currentVote === IProposalOutcome.Fail)) ?
          "Can't change your vote" :
          (currentAccountState && currentAccountState.reputation.eq(new BN(0))) ?
            "Requires reputation in this DAO" :
            /**
             * The following condition deduces that the user could not have had rep when the
             * proposal was created because of the following behavior in the subgraph:
             *
             * 1) `currentAccountState` (`ReputationHolder` in the subgraph) represents an entity that associates
             * a single DAO with an ethereum account
             * 2) currentAccountState can only exist in the subgraph when the account has > 0 rep in the DAO
             * 3) `currentAccountState.createdAt` is set only once:  When currentAccountState is being instantiated
             * for the first time, in response to a Mint event that brings the rep > 0
             * 4) when a Burn event brings the rep <= 0, then the entity is removed from the subgraph
             * 5) when `currentAccount` is not found in the subgraph, then a fake `currentAccountState` is created with
             * rep == 0
             */
            (currentAccountState && (proposal.createdAt < currentAccountState.createdAt)) ?
              "Must have had reputation in this DAO when the proposal was created" :
              proposal.stage === IProposalStage.ExpiredInQueue ||
                (proposal.stage === IProposalStage.Boosted && expired) ||
                (proposal.stage === IProposalStage.QuietEndingPeriod && expired) ||
                (proposal.stage === IProposalStage.Queued && expired) ?
                "Can't vote on expired proposals" : "")
        : "";

    const voteUpButtonClass = classNames({
      [css.votedFor]: currentVote === IProposalOutcome.Pass,
      [css.disabled]: votingDisabled,
    });
    const voteDownButtonClass = classNames({
      [css.votedAgainst]: currentVote === IProposalOutcome.Fail,
      [css.disabled]: votingDisabled,
    });
    const wrapperClass = classNames({
      [css.altStyle]: altStyle,
      [css.contextMenu]: contextMenu,
      [css.wrapper]: true,
      [css.hasVoted]: ((currentVote === IProposalOutcome.Pass) || (currentVote === IProposalOutcome.Fail)),
      [css.votedFor]: currentVote === IProposalOutcome.Pass,
      [css.votedAgainst]: currentVote === IProposalOutcome.Fail,
      [css.hasNotVoted]: ((currentVote === undefined) || (currentVote === IProposalOutcome.None)),
      [css.detailView]: parentPage === Page.ProposalDetails,
    });

    return (
      <div className={wrapperClass}>
        {this.state.showPreVoteModal ?
          <PreTransactionModal
            actionType={this.state.currentVote === IProposalOutcome.Pass ? ActionTypes.VoteUp : ActionTypes.VoteDown}
            action={this.handleVoteOnProposal}
            closeAction={this.closePreVoteModal}
            currentAccount={currentAccountState}
            dao={dao}
            effectText={<span>Your influence: <strong><Reputation daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={currentAccountState.reputation} /></strong></span>}
            parentPage={parentPage}
            proposal={proposal}
          /> : ""
        }
        {contextMenu ?
          <>
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
                    <img src="/assets/images/Icon/vote/for-fill-green.svg" />
                    <br />
                 For
                  </span>
                  <span className={css.castVoteAgainst}>
                    <img src="/assets/images/Icon/vote/against-btn-fill-red.svg" />
                    <br />
                 Against
                  </span>
                </div>
              </div>
              <div className={css.hasNotVoted}>
                {!votingDisabled ?
                  <div>
                    <button onClick={this.handleClickVote(1)} className={voteUpButtonClass} data-test-id="voteFor">
                      <img src={`/assets/images/Icon/vote/for-btn-selected${altStyle ? "-w" : ""}.svg`} />
                      <img className={css.buttonLoadingImg} src="/assets/images/Icon/buttonLoadingBlue.gif" />
                      <span> For</span>
                    </button>
                    <button onClick={this.handleClickVote(2)} className={voteDownButtonClass}>
                      <img src={`/assets/images/Icon/vote/against-btn-selected${altStyle ? "-w" : ""}.svg`} />
                      <img className={css.buttonLoadingImg} src="/assets/images/Icon/buttonLoadingBlue.gif" />
                      <span> Against</span>
                    </button>
                  </div>
                  :
                  <div className={css.votingDisabled}>
                    <img src="/assets/images/Icon/Alert-yellow-b.svg" /> {disabledMessage}
                  </div>
                }
              </div>
            </div>
          </>
          :
          <>
            <div className={css.castVote}>
              {!votingDisabled ?
                <div>
                  <button onClick={this.handleClickVote(1)} className={voteUpButtonClass} data-test-id="voteFor">
                    <img src={`/assets/images/Icon/vote/for-btn-selected${altStyle ? "-w" : ""}.svg`} />
                    <img className={css.buttonLoadingImg} src="/assets/images/Icon/buttonLoadingBlue.gif" />
                    <span> For</span>
                  </button>
                  <button onClick={this.handleClickVote(2)} className={voteDownButtonClass}>
                    <img src={`/assets/images/Icon/vote/against-btn-selected${altStyle ? "-w" : ""}.svg`} />
                    <img className={css.buttonLoadingImg} src="/assets/images/Icon/buttonLoadingBlue.gif" />
                    <span> Against</span>
                  </button>
                </div>
                :
                <div className={css.votingDisabled}>
                  {disabledMessage}
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
          </>
        }
      </div>
    );
  }
}

export default connect(null, mapDispatchToProps)(VoteButtons);
