import { Address, IDAOState, IProposalOutcome, IProposalState, Vote } from "@daostack/client";
import { getArc } from "arc";
import * as classNames from "classnames";
import AccountImage from "components/Account/AccountImage";
import AccountProfileName from "components/Account/AccountProfileName";
import Reputation from "components/Account/Reputation";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as React from "react";
import { Modal } from "react-router-modal";
import { IProfileState, IProfilesState } from "reducers/profilesReducer";
import { IRootState } from "reducers";
import { connect } from "react-redux";
import VoteGraph from "./VoteGraph";

import * as css from "./VotersModal.scss";

/*** VoteRow Component ***/
interface IVoteRowProps {
  dao: IDAOState;
  proposal: IProposalState;
  vote: Vote;
  accountProfile: IProfileState;
}

class VoteRow extends React.Component<IVoteRowProps, null> {
  public render(): RenderOutput {
    const {dao, proposal, vote, accountProfile } = this.props;
    const voteState = vote.staticState;
    return (
      <div className={css.voteRow}>
        <div className={css.voteRowContainer}>
          <div className={css.account}>
            <AccountImage accountAddress={voteState.voter} profile={accountProfile} />
            <span className={css.accountAddress}>
              <AccountProfileName accountAddress={voteState.voter} accountProfile={accountProfile} daoAvatarAddress={dao.address} />
            </span>
          </div>
          <div className={css.reputationAmount}>
            <Reputation daoName={dao.name} totalReputation={proposal.totalRepWhenCreated} reputation={voteState.amount} hideSymbol />
          </div>
          <div className={css.reputationLine}></div>
        </div>
      </div>
    );
  }
}
/*** EO VoteRow Component ***/

interface IExternalProps {
  closeAction: any;
  currentAccountAddress: Address;
  dao: IDAOState;
  proposal: IProposalState;
  accountProfile: IProfileState;
}

interface IStateProps {
  profiles: IProfilesState;
}

const mapStateToProps = (state: IRootState, _ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ..._ownProps,
    profiles: state.profiles,
  };
};

type SubscriptionData = Vote[];
type IProps = IExternalProps & IStateProps & ISubscriptionProps<SubscriptionData>;

class VotersModal extends React.Component<IProps, null> {

  public async handleClickDone() {
    this.props.closeAction();
  }

  public render(): RenderOutput {
    const votes = this.props.data;
    const { dao, proposal, profiles } = this.props;

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
                  <p><Reputation daoName={dao.name} totalReputation={proposal.totalRepWhenCreated} reputation={proposal.votesFor} hideSymbol /> Rep</p>
                </span>
              </div>
              <div className={css.graphContainer}>
                <VoteGraph size={90} proposal={proposal} />
              </div>
              <div className={voteDownClass}>
                <span className={css.reputation}>
                  <img className={css.downvote} src="/assets/images/Icon/vote/against-gray.svg"/>
                  <img className={css.downvoted} src="/assets/images/Icon/vote/against-fill.svg"/>
                  <span className={css.reputationTitle}>Against</span>
                  <br />
                  <p><Reputation daoName={dao.name} totalReputation={proposal.totalRepWhenCreated} reputation={proposal.votesAgainst} hideSymbol /> Rep</p>
                </span>
              </div>
            </div>

            <div className={css.voters}>
              <div>
                <div>{yesVotes.map((vote) => <VoteRow dao={dao} proposal={proposal} vote={vote} key={"vote_" + vote.id}
                  accountProfile={profiles[vote.staticState.voter]} />)}</div>
              </div>
              <div>
                <div>{noVotes.map((vote) => <VoteRow dao={dao} proposal={proposal} vote={vote} key={"vote_" + vote.id}
                  accountProfile={profiles[vote.staticState.voter]} />)}</div>
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

const voterModalWithSubscriptions = withSubscription({
  wrappedComponent: VotersModal,
  loadingComponent: <div>Loading ...</div>,
  errorComponent: (props) => <div>{props.error.message}</div>,

  checkForUpdate: [],

  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    const dao = arc.dao(props.dao.address);
    const proposalId = props.proposal.id;
    const proposal = dao.proposal(proposalId);

    return proposal.votes({}, { subscribe: false });
  },
});

export default connect(mapStateToProps)(voterModalWithSubscriptions);
