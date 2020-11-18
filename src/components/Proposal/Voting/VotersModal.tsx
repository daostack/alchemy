import { Address, IDAOState, IProposalOutcome, IProposalState, Vote } from "@daostack/arc.js";
import { getProfile } from "actions/profilesActions";
import { getArc } from "arc";
import classNames from "classnames";
import AccountImage from "components/Account/AccountImage";
import AccountProfileName from "components/Account/AccountProfileName";
import Reputation from "components/Account/Reputation";
import ModalPopup from "components/Shared/ModalPopup";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as React from "react";
import { IProfileState, IProfilesState } from "reducers/profilesReducer";
import { IRootState } from "reducers";
import { connect } from "react-redux";
import VoteGraph from "./VoteGraph";
import { getNetworkByAddress } from "lib/util"; 
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
            <AccountImage accountAddress={voteState.voter} profile={accountProfile} width={18} />
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

interface IDispatchProps {
  getProfile: typeof getProfile;
}


const mapStateToProps = (state: IRootState, _ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ..._ownProps,
    profiles: state.profiles,
  };
};

const mapDispatchToProps = {
  getProfile,
};

type SubscriptionData = Vote[];
type IProps = IExternalProps & IStateProps & IDispatchProps & ISubscriptionProps<SubscriptionData>;

class VotersModal extends React.Component<IProps, null> {

  public componentDidMount() {
    const votes = this.props.data;
    const { getProfile, profiles } = this.props;

    /**
     * Would be better if we could use `getProfilesForAddresses`, but it is busted
     * See: https://github.com/3box/3box-js/issues/649
     */
    for (const vote of votes) {
      const voterAddress = vote.staticState.voter;
      if (!profiles[voterAddress])
      /**
       * intentionally not awaiting this because it takes too long when there are a lot of profiles to download
       * but they show up pretty quickly when not running serially.
       */
        getProfile(voterAddress);
    }
  }

  public async handleClickDone() {
    this.props.closeAction();
  }

  public render(): RenderOutput {
    const votes = this.props.data;
    const { dao, proposal, profiles } = this.props;

    const currentAccountVote = votes[0];

    const yesVotes = votes.filter((vote) => vote.staticState.outcome === IProposalOutcome.Pass);
    const noVotes = votes.filter((vote) => vote.staticState.outcome === IProposalOutcome.Fail);

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

    const votersDownClass = classNames({[css.container]: true, [css.notAnyVotes]: true });

    return (
      <ModalPopup
        closeHandler={this.props.closeAction}
        width={500}
        header={votes.length + " Votes"}
        body={<div className={css.body}>
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
            <div className={css.yesVotes}>
              {yesVotes.length ?
                <div className={css.container}>{yesVotes.map((vote) => <VoteRow dao={dao} proposal={proposal} vote={vote} key={"vote_" + vote.id} accountProfile={profiles[vote.staticState.voter]} />)}</div>
                :
                <div className={votersDownClass}><div className={css.notAnyVotes}>No one has voted For</div></div>
              }
            </div>
            <div className={css.noVotes}>
              {noVotes.length ?
                <div className={css.container}>{noVotes.map((vote) => <VoteRow dao={dao} proposal={proposal} vote={vote} key={"vote_" + vote.id} accountProfile={profiles[vote.staticState.voter]} />)}</div>
                :
                <div className={votersDownClass}><div className={css.notAnyVotes}>No one has voted Against</div></div>
              }
            </div>
          </div>
        </div>}
        footer={<div className={css.footer}><button onClick={this.props.closeAction}>Close</button></div>}
      />
    );
  }
}

const voterModalWithSubscriptions = withSubscription({
  wrappedComponent: VotersModal,
  loadingComponent: <div>Loading ...</div>,
  errorComponent: (props) => <div>{props.error.message}</div>,

  checkForUpdate: [],

  createObservable: (props: IExternalProps) => {
    const arc = getArc(getNetworkByAddress(props.dao.dao.id));
    const dao = arc.dao(props.dao.address);
    const proposalId = props.proposal.id;
    const proposal = dao.proposal(proposalId);
    // subscribe is false by default
    return proposal.votes({}, { });
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(voterModalWithSubscriptions);
