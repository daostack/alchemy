import { Address, IDAOState, IProposalStage, IProposalState, IRewardState, IVote } from "@daostack/client";
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
  proposal: IProposalState;
  rewardsForCurrentUser: IRewardState[];
  votesOfCurrentUser: IVote[];
}

type IProps = IStateProps & IContainerProps;

const mapStateToProps = (state: IRootState, ownProps: IContainerProps): IProps => {
  const proposal = ownProps.proposal;

  return {...ownProps,
    beneficiaryProfile: proposal.contributionReward ? state.profiles[proposal.contributionReward.beneficiary] : null,
    creatorProfile: state.profiles[proposal.proposer],
    isVotingYes: isVotePending(proposal.id, VoteOptions.Yes)(state),
    isVotingNo: isVotePending(proposal.id, VoteOptions.No)(state)
  };
};

interface IState {
  expired: boolean;
}

class ProposalCardContainer extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    this.state = {
      expired: closingTime(props.proposal).isSameOrBefore(moment())
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
      proposal,
      isVotingNo,
      isVotingYes,
      rewardsForCurrentUser,
      votesOfCurrentUser
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
      [css.failedProposal]: proposalFailed(proposal),
      [css.passedProposal]: proposalPassed(proposal)
    });

    const voteWrapperClass = classNames({
      [css.voteBox] : true,
      clearfix : true,
      [css.unconfirmedVote] : isVoting
    });

    const voteControls = classNames({
      [css.voteControls]: true
    });

    return (proposal.stage === IProposalStage.Queued && this.state.expired ? "" :
      <div className={proposalClass + " clearfix"} data-test-id={"proposal-" + proposal.id}>
        <div className={css.proposalInfo}>
          <div className={css.cardTop + " clearfix"}>
            <div className={css.timer}>
              {!proposalEnded(proposal) ?
                  !this.state.expired ?
                    <Countdown toDate={closingTime(proposal)} detailView={false} onEnd={this.countdownEnded.bind(this)} overTime={proposal.stage === IProposalStage.QuietEndingPeriod && !this.state.expired} /> :
                    <span className={css.closedTime}>
                      {proposal.stage === IProposalStage.Queued ? "Expired" :
                       proposal.stage === IProposalStage.PreBoosted ? "Ready to Boost" : // TODO: handle case of below threshold
                       "Closed"}&nbsp;
                       {closingTime(proposal).format("MMM D, YYYY")}
                    </span>
                  : " "
              }
            </div>

            <div className={css.actionButton}>
              <ActionButton
                currentAccountAddress={currentAccountAddress}
                dao={dao}
                daoEthBalance={daoEthBalance}
                expired={expired}
                proposal={proposal}
                rewardsForCurrentUser={rewardsForCurrentUser}
              />
            </div>
          </div>
          <div className={css.createdBy}>
            <AccountPopupContainer accountAddress={proposal.proposer} dao={dao} detailView={false}/>
            <AccountProfileName accountAddress={proposal.proposer} accountProfile={creatorProfile} daoAvatarAddress={dao.address} detailView={false}/>
          </div>
          <div className={css.description}>
            {proposal.description}
          </div>

          <h3>
            <Link className={css.detailLink} to={"/dao/" + dao.address + "/proposal/" + proposal.id} data-test-id="proposal-title">
              {humanProposalTitle(proposal)}
              <img src="/assets/images/Icon/Open.svg"/>
            </Link>
          </h3>
          <ProposalSummary proposal={proposal} dao={dao} beneficiaryProfile={beneficiaryProfile} detailView={false}/>

        </div>

        <div className={css.proposalActions + " clearfix"}>
          <div className={voteWrapperClass}>
            <div className={voteControls + " clearfix"}>
              <div className={css.voteDivider}>
                <VoteGraph dao={dao} size={40} proposal={proposal} />
              </div>

              <VoteBreakdown currentAccountAddress={currentAccountAddress} currentVote={currentAccountVote} dao={dao} isVotingNo={isVotingNo} isVotingYes={isVotingYes} proposal={proposal} detailView={false} />
            </div>

            <div className={css.voteButtons}>
              <VoteButtons currentAccountAddress={currentAccountAddress} currentVote={currentAccountVote} dao={dao} expired={expired} isVotingNo={isVotingNo} isVotingYes={isVotingYes} proposal={proposal} />
            </div>
          </div>

          <div className={css.predictions}>
             <PredictionGraph
              proposal={proposal}
            />
            <BoostAmount proposal={proposal} />

            <div className={css.predictionButtons}>
              <PredictionButtons
                beneficiaryProfile={beneficiaryProfile}
                currentAccountAddress={currentAccountAddress}
                dao={dao}
                expired={this.state.expired}
                proposal={proposal}
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
  proposalId: string;
}

export default (props: IExternalProps) => {

  const arc = getArc();
  const dao = arc.dao(props.dao.address);

  const observable = combineLatest(
    dao.proposal(props.proposalId).state(), // state of the current proposal
    props.currentAccountAddress ? dao.proposal(props.proposalId).rewards({ beneficiary: props.currentAccountAddress}) : of([]), //1
    props.currentAccountAddress ? dao.proposal(props.proposalId).votes({ voter: props.currentAccountAddress }) : of([]), //3
    concat(of(new BN("0")), dao.ethBalance())
  );
  return <Subscribe observable={observable}>{
    (state: IObservableState<[IProposalState, IRewardState[], IVote[], BN]>): any => {
      if (state.isLoading) {
        return <div>Loading proposal {props.proposalId.substr(0, 6)} ...</div>;
      } else if (state.error) {
        return <div>{ state.error.message }</div>;
      } else {
        const proposal = state.data[0];
        const rewards = state.data[1];
        const votes = state.data[2];
        const daoEthBalance = state.data[3];
        return <ConnectedProposalCardContainer
          currentAccountAddress={props.currentAccountAddress}
          daoEthBalance={daoEthBalance}
          proposal={proposal}
          dao={props.dao}
          rewardsForCurrentUser={rewards}
          votesOfCurrentUser={votes}
          />;
      }
    }
  }</Subscribe>;
};
