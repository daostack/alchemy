import { Address, IDAOState, IProposalStage, IProposalState, IVote, Proposal } from "@daostack/client";
import { getArc } from "arc";

import BN = require("bn.js");
import * as classNames from "classnames";
import AccountPopupContainer from "components/Account/AccountPopupContainer";
import AccountProfileName from "components/Account/AccountProfileName";
import Countdown from "components/Shared/Countdown";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { humanProposalTitle } from "lib/util";
import * as moment from "moment";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { IRootState } from "reducers";
import { closingTime, VoteOptions } from "reducers/arcReducer";
import { proposalEnded, proposalFailed, proposalPassed } from "reducers/arcReducer";
import { IProfileState } from "reducers/profilesReducer";
import { combineLatest, concat, of } from "rxjs";
import { isVotePending } from "selectors/operations";
import ActionButton from "./ActionButton";
import BoostAmount from "./Predictions/BoostAmount";
import PredictionButtons from "./Predictions/PredictionButtons";
import PredictionGraph from "./Predictions/PredictionGraph";
import ProposalSummary from "./ProposalSummary";
import VoteBreakdown from "./Voting/VoteBreakdown";
import VoteButtons from "./Voting/VoteButtons";
import VoteGraph from "./Voting/VoteGraph";

import * as css from "./ProposalCard.scss";

interface IStateProps {
  beneficiaryProfile?: IProfileState;
  creatorProfile?: IProfileState;
  isVotingYes: boolean;
  isVotingNo: boolean;
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
    isVotingYes: isVotePending(proposalState.id, VoteOptions.Yes)(state),
    isVotingNo: isVotePending(proposalState.id, VoteOptions.No)(state),
  };
};

interface IState {
  expired: boolean;
}

class ProposalCardContainer extends React.Component<IProps, IState> {

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
      isVotingNo,
      isVotingYes,
      votesOfCurrentUser,
    } = this.props;

    const expired = this.state.expired;

    const isVoting = isVotingNo || isVotingYes;

    let currentAccountVote = 0;

    let currentVote: IVote;
    if (votesOfCurrentUser.length > 0) {
      currentVote = votesOfCurrentUser[0];
      currentAccountVote = currentVote.outcome;
    }

    const proposalClass = classNames({
      [css.proposal]: true,
      [css.failedProposal]: proposalFailed(proposalState),
      [css.passedProposal]: proposalPassed(proposalState),
    });

    const voteWrapperClass = classNames({
      [css.voteBox]: true,
      clearfix: true,
      [css.unconfirmedVote]: isVoting,
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
                    isVotingNo={isVotingNo}
                    isVotingYes={isVotingYes}
                    proposal={proposalState}
                    contextMenu={true}/>
                  <PredictionButtons
                    beneficiaryProfile={beneficiaryProfile}
                    currentAccountAddress={currentAccountAddress}
                    dao={dao}
                    expired={this.state.expired}
                    proposal={proposalState}
                    contextMenu={true}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className={css.createdBy}>
            <AccountPopupContainer accountAddress={proposalState.proposer} dao={dao} detailView={false} />
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

              <VoteBreakdown currentAccountAddress={currentAccountAddress} currentVote={currentAccountVote} dao={dao} isVotingNo={isVotingNo} isVotingYes={isVotingYes} proposal={proposalState} detailView={false} />
            </div>

            <div className={css.voteButtons}>
              <VoteButtons currentAccountAddress={currentAccountAddress} currentVote={currentAccountVote} dao={dao} expired={expired} isVotingNo={isVotingNo} isVotingYes={isVotingYes} proposal={proposalState} />
            </div>
          </div>

          <div className={css.predictions}>
            <PredictionGraph
              proposal={proposalState}
            />
            <BoostAmount proposal={proposalState} />

            <div className={css.predictionButtons}>
              <PredictionButtons
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

export const ConnectedProposalCardContainer = connect<IStateProps, IContainerProps>(mapStateToProps)(ProposalCardContainer);

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
        return <ConnectedProposalCardContainer
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
