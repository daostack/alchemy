import { Address, IDAOState, IProposalStage, IProposalState, IVote, Proposal } from "@daostack/client";
import { getArc } from "arc";

import BN = require("bn.js");
import * as classNames from "classnames";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import Countdown from "components/Shared/Countdown";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
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

interface IStateProps {
  beneficiaryProfile?: IProfileState;
  creatorProfile?: IProfileState;
}

interface IContainerProps {
  dao: IDAOState;
  currentAccountAddress: Address;
  daoEthBalance: BN;
  proposalState: IProposalState;
  votesOfCurrentUser: IVote[];
}

type IProps = IStateProps & IContainerProps;

const mapStateToProps = (state: IRootState, ownProps: IContainerProps): IProps => {
  const proposalState = ownProps.proposalState;

  return {
    ...ownProps,
    beneficiaryProfile: proposalState.contributionReward ? state.profiles[proposalState.contributionReward.beneficiary] : null,
    creatorProfile: state.profiles[proposalState.proposer],
  };
};

interface IState {
  expired: boolean;
}

class ProposalCard extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    this.state = {
      expired: closingTime(props.proposalState).isSameOrBefore(moment()),
    };
  }

  public countdownEnded() {
    this.setState({ expired: true });
  }

  public render() {
    const {
      beneficiaryProfile,
      creatorProfile,
      currentAccountAddress,
      dao,
      daoEthBalance,
      proposalState,
      votesOfCurrentUser,
    } = this.props;

    const expired = this.state.expired;

    let currentAccountVote = 0;

    let currentVote: IVote;
    if (votesOfCurrentUser.length > 0) {
      currentVote = votesOfCurrentUser[0];
      currentAccountVote = currentVote.outcome;
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

const ConnectedProposalCard = connect<IStateProps, IContainerProps>(mapStateToProps)(ProposalCard);

interface IExternalProps {
  currentAccountAddress: Address;
  dao: IDAOState;
  proposal: Proposal;
}

export default (props: IExternalProps) => {

  const arc = getArc();
  const dao = arc.dao(props.dao.address);
  const proposal = props.proposal;

  const observable = combineLatest(
    proposal.state(), // state of the current proposal
    props.currentAccountAddress ? proposal.votes({where: { voter: props.currentAccountAddress }}) : of([]), //3
    concat(of(new BN("0")), dao.ethBalance())
  );
  return <Subscribe observable={observable}>{
    (state: IObservableState<[IProposalState, IVote[], BN]>): any => {
      if (state.isLoading) {
        return <div>Loading proposal {proposal.id.substr(0, 6)} ...</div>;
      } else if (state.error) {
        return <div>{state.error.message}</div>;
      } else {
        const [proposalState, votes, daoEthBalance] = state.data;
        return <ConnectedProposalCard
          currentAccountAddress={props.currentAccountAddress}
          daoEthBalance={daoEthBalance}
          proposalState={proposalState}
          dao={props.dao}
          votesOfCurrentUser={votes}
        />;
      }
    }
  }</Subscribe>;
};
