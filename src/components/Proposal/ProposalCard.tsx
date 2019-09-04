import { Address, IDAOState, IProposalStage, IProposalState, Vote, Proposal } from "@daostack/client";
import { getArc } from "arc";

import BN = require("bn.js");
import * as classNames from "classnames";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import Countdown from "components/Shared/Countdown";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { humanProposalTitle } from "lib/util";
import * as moment from "moment";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { IRootState } from "reducers";
import { closingTime } from "reducers/arcReducer";
import { proposalEnded } from "reducers/arcReducer";
import { IProfileState } from "reducers/profilesReducer";
import { combineLatest, concat, of } from "rxjs";
import ActionButton from "./ActionButton";
import BoostAmount from "./Staking/BoostAmount";
import StakeButtons from "./Staking/StakeButtons";
import StakeGraph from "./Staking/StakeGraph";
import ProposalSummary from "./ProposalSummary";
import VoteBreakdown from "./Voting/VoteBreakdown";
import VoteButtons from "./Voting/VoteButtons";
import VoteGraph from "./Voting/VoteGraph";

import * as css from "./ProposalCard.scss";

interface IExternalProps {
  currentAccountAddress: Address;
  dao: IDAOState;
  proposal: Proposal;
}

interface IStateProps {
  beneficiaryProfile?: IProfileState;
  creatorProfile?: IProfileState;
}

type SubscriptionData = [IProposalState, Vote[], BN];
type IProps = IStateProps & IExternalProps & ISubscriptionProps<SubscriptionData>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps & ISubscriptionProps<SubscriptionData>): IProps => {
  const proposalState = ownProps.data ? ownProps.data[0] : null;

  return {
    ...ownProps,
    beneficiaryProfile: proposalState && proposalState.contributionReward ? state.profiles[proposalState.contributionReward.beneficiary] : null,
    creatorProfile: proposalState ? state.profiles[proposalState.proposer] : null,
  };
};

interface IState {
  expired: boolean;
}

class ProposalCard extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      expired: props.data ? closingTime(props.data[0]).isSameOrBefore(moment()) : false,
    };
  }

  public countdownEnded(): void {
    this.setState({ expired: true });
  }

  public render(): any {
    const [proposalState, votesOfCurrentUser, daoEthBalance] = this.props.data;

    const {
      beneficiaryProfile,
      creatorProfile,
      currentAccountAddress,
      dao,
    } = this.props;

    const expired = this.state.expired;

    let currentAccountVote = 0;

    let currentVote: Vote;
    if (votesOfCurrentUser.length > 0) {
      currentVote = votesOfCurrentUser[0];
      currentAccountVote = currentVote.staticState.outcome;
    }

    const proposalClass = classNames({
      [css.proposal]: true,
    });

    const voteWrapperClass = classNames({
      [css.voteBox]: true,
      clearfix: true,
    });

    const voteControls = classNames({
      [css.voteControls]: true,
    });

    return (proposalState.stage === IProposalStage.Queued && this.state.expired ? "" :
      <div className={proposalClass + " clearfix"} data-test-id={"proposal-" + proposalState.id}>
        <div className={css.proposalInfo}>
          <div className={css.cardTop + " clearfix"}>
            <div className={css.timer}>
              {!proposalEnded(proposalState) ?
                <span className={css.content}>
                  {!this.state.expired ?
                    <Countdown toDate={closingTime(proposalState)} detailView={false} onEnd={this.countdownEnded.bind(this)} overTime={proposalState.stage === IProposalStage.QuietEndingPeriod && !this.state.expired} /> :
                    <span className={css.closedTime}>
                      {proposalState.stage === IProposalStage.Queued ? "Expired" :
                        proposalState.stage === IProposalStage.PreBoosted ? "Ready to Boost" :
                          "Closed"}&nbsp;
                      {closingTime(proposalState).format("MMM D, YYYY")}
                    </span>
                  }
                </span>
                : " "
              }
            </div>

            <div className={css.actionButton}>
              <ActionButton
                currentAccountAddress={currentAccountAddress}
                dao={dao}
                daoEthBalance={daoEthBalance}
                proposalState={proposalState}
              />

              <div className={css.contextMenu} data-test-id="proposalContextMenu">
                <div className={css.menuIcon}>
                  <img src="/assets/images/Icon/Context-menu.svg"/>
                </div>
                <div className={css.menu}>
                  <VoteButtons
                    currentAccountAddress={currentAccountAddress}
                    currentVote={currentAccountVote}
                    dao={dao}
                    expired={expired}
                    proposal={proposalState}
                    contextMenu/>
                  <StakeButtons
                    beneficiaryProfile={beneficiaryProfile}
                    currentAccountAddress={currentAccountAddress}
                    dao={dao}
                    expired={this.state.expired}
                    proposal={proposalState}
                    contextMenu
                  />
                </div>
              </div>
            </div>
          </div>
          <div className={css.createdBy}>
            <AccountPopup accountAddress={proposalState.proposer} dao={dao} detailView={false} />
            <AccountProfileName accountAddress={proposalState.proposer} accountProfile={creatorProfile} daoAvatarAddress={dao.address} detailView={false} />
          </div>
          <div className={css.description}>
            {proposalState.description}
          </div>

          <h3>
            <Link className={css.detailLink} to={"/dao/" + dao.address + "/proposal/" + proposalState.id} data-test-id="proposal-title">
              <span>{humanProposalTitle(proposalState)}</span>
              <img src="/assets/images/Icon/Open.svg" />
            </Link>
          </h3>
          <ProposalSummary proposal={proposalState} dao={dao} beneficiaryProfile={beneficiaryProfile} detailView={false} />

        </div>

        <div className={css.proposalActions + " clearfix"}>
          <div className={voteWrapperClass}>
            <div className={voteControls + " clearfix"}>
              <div className={css.voteDivider}>
                <VoteGraph size={40} proposal={proposalState} />
              </div>

              <VoteBreakdown currentAccountAddress={currentAccountAddress} currentVote={currentAccountVote} dao={dao} proposal={proposalState} detailView={false} />
            </div>

            <div className={css.voteButtons}>
              <VoteButtons currentAccountAddress={currentAccountAddress} currentVote={currentAccountVote} dao={dao} expired={expired} proposal={proposalState} />
            </div>
          </div>

          <div className={css.predictions}>
            <StakeGraph
              proposal={proposalState}
            />
            <BoostAmount proposal={proposalState} />

            <div className={css.predictionButtons}>
              <StakeButtons
                beneficiaryProfile={beneficiaryProfile}
                currentAccountAddress={currentAccountAddress}
                dao={dao}
                expired={this.state.expired}
                proposal={proposalState}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const ConnectedProposalCard = connect(mapStateToProps)(ProposalCard);

export default withSubscription({
  wrappedComponent: ConnectedProposalCard,
  loadingComponent: (props) => <div className={css.loading}>Loading proposal {props.proposal.id.substr(0, 6)} ...</div>,
  errorComponent: (props) => <div>{props.error.message}</div>,

  checkForUpdate: (oldProps, newProps) => {
    return oldProps.currentAccountAddress !== newProps.currentAccountAddress || oldProps.proposal.id !== newProps.proposal.id;
  },

  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    const dao = arc.dao(props.dao.address);
    return combineLatest(
      props.proposal.state(), // state of the current proposal
      props.currentAccountAddress ? props.proposal.votes({where: { voter: props.currentAccountAddress }}) : of([]), //3
      concat(of(new BN("0")), dao.ethBalance())
    );
  },
});
