/* tslint:disable:max-classes-per-file */

import { Address, IDAOState, IProposalOutcome, IProposalState, Vote } from "@daostack/client";
import { getArc } from "arc";
import * as classNames from "classnames";
import AccountImage from "components/Account/AccountImage";
import AccountProfileName from "components/Account/AccountProfileName";
import Reputation from "components/Account/Reputation";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as React from "react";
//@ts-ignore
import { Modal } from "react-router-modal";
import { combineLatest } from "rxjs";
import VoteGraph from "./VoteGraph";

import * as css from "./VotersModal.scss";

interface IProps {
  closeAction: any;
  currentAccountAddress: Address;
  dao: IDAOState;
  proposalState: IProposalState;
  isVotingNo?: boolean;
  isVotingYes?: boolean;
  votes: Vote[];
}

interface IVoteRowProps {
  dao: IDAOState;
  proposalState: IProposalState;
  vote: Vote;
}

class VoteRow extends React.Component<IVoteRowProps, null> {

  public render() {
    const {dao, proposalState, vote} = this.props;
    const voteState = vote.staticState
    return (
      <div className={css.voteRow}>
        <div className={css.voteRowContainer}>
          <div className={css.account}>
            <AccountImage accountAddress={voteState.voter} />
            <span className={css.accountAddress}>
              <AccountProfileName accountAddress={voteState.voter} accountProfile={null} daoAvatarAddress={dao.address} />
            </span>
          </div>
          <div className={css.reputationAmount}>
            <Reputation daoName={dao.name} totalReputation={proposalState.totalRepWhenCreated} reputation={voteState.amount} hideSymbol />
          </div>
          <div className={css.reputationLine}></div>
        </div>
      </div>
    );
  }
}

class VotersModal extends React.Component<IProps, null> {

  public async handleClickDone() {
    this.props.closeAction();
  }

  public render() {
    const { dao, proposalState, votes } = this.props;

    const currentAccountVote = votes[0];

    const yesVotes = votes.filter((vote) => vote.staticState.outcome === IProposalOutcome.Pass);
    const noVotes = votes.filter((vote) => vote.staticState.outcome === IProposalOutcome.Fail);

    const modalWindowClass = classNames({
      [css.modalWindow]: true,
    });

    const voteUpClass = classNames({
      [css.voteBreakdown]: true,
      [css.voteUp]: true,
      [css.votedFor]: currentAccountVote.staticState.outcome === IProposalOutcome.Pass,
    });

    const voteDownClass = classNames({
      [css.voteBreakdown]: true,
      [css.voteDown]: true,
      [css.votedAgainst]: currentAccountVote.staticState.outcome === IProposalOutcome.Fail,
    });

    return (
      <Modal onBackdropClick={this.props.closeAction}>
        <div className={modalWindowClass}>
          <div className={css.header}>
            {votes.length} Votes
          </div>
          <div className={css.content}>
            <div className={css.summary}>
              <div className={voteUpClass}>
                <span className={css.reputation}>
                  <img className={css.upvote} src="/assets/images/Icon/vote/for-gray.svg"/>
                  <img className={css.upvoted} src="/assets/images/Icon/vote/for-fill.svg"/>
                  <span className={css.reputationTitle}>For</span>
                  <br/>
                  <p><Reputation daoName={dao.name} totalReputation={proposalState.totalRepWhenCreated} reputation={proposalState.votesFor} hideSymbol /> Rep</p>
                </span>
              </div>
              <div className={css.graphContainer}>
                <VoteGraph size={90} proposal={proposalState} />
              </div>
              <div className={voteDownClass}>
                <span className={css.reputation}>
                  <img className={css.downvote} src="/assets/images/Icon/vote/against-gray.svg"/>
                  <img className={css.downvoted} src="/assets/images/Icon/vote/against-fill.svg"/>
                  <span className={css.reputationTitle}>Against</span>
                  <br />
                  <p><Reputation daoName={dao.name} totalReputation={proposalState.totalRepWhenCreated} reputation={proposalState.votesAgainst} hideSymbol /> Rep</p>
                </span>
              </div>
            </div>

            <div className={css.voters}>
              <div>
                <div>{yesVotes.map((vote) => <VoteRow dao={dao} proposalState={proposalState} vote={vote} key={"vote_" + vote.id} />)}</div>
              </div>
              <div>
                <div>{noVotes.map((vote) => <VoteRow dao={dao} proposalState={proposalState} vote={vote} key={"vote_" + vote.id} />)}</div>
              </div>
            </div>
          </div>

          <div className={css.footer}>
            <button onClick={this.props.closeAction}>
              Done
            </button>
          </div>
        </div>
      </Modal>
    );
  }
}

interface IExternalProps {
  closeAction: any;
  currentAccountAddress: Address;
  dao: IDAOState;
  proposal: IProposalState;
}

export default (props: IExternalProps) => {
  const arc = getArc();

  const dao = arc.dao(props.dao.address);
  const proposalId = props.proposal.id;
  const proposal = dao.proposal(proposalId)

  const observable = combineLatest(
    proposal.state(), // state of the current proposal
    proposal.votes()
  );
  return <Subscribe observable={observable}>{
    (state: IObservableState<[IProposalState, Vote[]]>): any => {
      if (state.isLoading) {
        return <div>Loading proposal {proposalId.substr(0, 6)} ...</div>;
      } else if (state.error) {
        return <div>{state.error.message}</div>;
      } else {
        const [proposalState, votes] = state.data;
        return <VotersModal
          {...props}
          proposalState={proposalState}
          votes={votes}
        />;
      }
    }
  }</Subscribe>;
};
