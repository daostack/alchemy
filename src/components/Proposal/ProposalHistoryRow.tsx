import { Address, IDAOState, IExecutionState, IProposalOutcome, IProposalState, IStake, IVote, Proposal } from "@daostack/client";
import * as arcActions from "actions/arcActions";

import BN = require("bn.js");
import * as classNames from "classnames";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { formatTokens, humanProposalTitle } from "lib/util";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { IRootState } from "reducers";
import { proposalFailed, proposalPassed } from "reducers/arcReducer";
import { closingTime } from "reducers/arcReducer";
import { IProfileState } from "reducers/profilesReducer";
import { combineLatest, of } from "rxjs";
import StakeGraph from "./Staking/StakeGraph";
import VoteBreakdown from "./Voting/VoteBreakdown";

import * as css from "./ProposalHistoryRow.scss";

interface IStateProps {
  creatorProfile?: IProfileState;
  currentAccountAddress: Address;
  stakesOfCurrentUser: IStake[];
  votesOfCurrentUser: IVote[];
  dao: IDAOState;
  proposal: IProposalState;
}

interface IContainerProps {
  dao: IDAOState;
  currentAccountAddress: Address;
  proposal: IProposalState;
  stakesOfCurrentUser: IStake[];
  votesOfCurrentUser: IVote[];
}

const mapStateToProps = (state: IRootState, ownProps: IContainerProps): IStateProps => {
  const proposal = ownProps.proposal;
  const dao = ownProps.dao;

  return {
    creatorProfile: state.profiles[proposal.proposer],
    currentAccountAddress: ownProps.currentAccountAddress,
    dao,
    proposal,
    stakesOfCurrentUser: ownProps.stakesOfCurrentUser,
    votesOfCurrentUser: ownProps.votesOfCurrentUser,
  };
};

interface IDispatchProps {
  redeemProposal: typeof arcActions.redeemProposal;
  executeProposal: typeof arcActions.executeProposal;
}

const mapDispatchToProps = {
  redeemProposal: arcActions.redeemProposal,
  executeProposal: arcActions.executeProposal,
};

type IProps = IStateProps & IDispatchProps & IContainerProps;

interface IState {
  preRedeemModalOpen: boolean;
}

class ProposalHistoryRow extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      preRedeemModalOpen: false,
    };
  }

  public render() {
    const {
      creatorProfile,
      currentAccountAddress,
      dao,
      proposal,
      stakesOfCurrentUser,
      votesOfCurrentUser,
    } = this.props;

    const proposalClass = classNames({
      [css.wrapper]: true,
      clearfix: true,
    });

    let currentAccountVote = 0; let currentAccountPrediction = 0; let currentAccountStakeAmount = new BN(0); let currentAccountVoteAmount = new BN(0);

    let currentVote: IVote;
    if (votesOfCurrentUser.length > 0) {
      currentVote = votesOfCurrentUser[0];
      currentAccountVote = currentVote.outcome;
      currentAccountVoteAmount = new BN(currentVote.amount);
    }

    let currentStake: IStake;
    if (stakesOfCurrentUser.length > 0) {
      currentStake = stakesOfCurrentUser[0];
    }
    if (currentStake) {
      currentAccountPrediction = currentStake.outcome;
      currentAccountStakeAmount = new BN(currentStake.amount);
    }

    const myActionsClass = classNames({
      [css.myActions]: true,
      [css.iVoted]: currentAccountVote !== 0,
      [css.failVote]: currentAccountVote === IProposalOutcome.Fail,
      [css.passVote]: currentAccountVote === IProposalOutcome.Pass,
      [css.iStaked]: currentAccountPrediction !== 0,
      [css.forStake]: currentAccountPrediction === IProposalOutcome.Pass,
      [css.againstStake]: currentAccountPrediction === IProposalOutcome.Fail,
    });

    const closeReasonClass = classNames({
      [css.closeReason]: true,
      [css.decisionPassed]: proposalPassed(proposal),
      [css.decisionFailed]: proposalFailed(proposal),
    });

    let closeReason = "Time out";
    switch (proposal.executionState) {
      case IExecutionState.BoostedBarCrossed:
      case IExecutionState.QueueBarCrossed:
      case IExecutionState.PreBoostedBarCrossed:
        closeReason = "Absolute Majority";
        break;
      case IExecutionState.BoostedTimeOut:
        closeReason = "Relative Majority";
        break;
    }

    const voteControls = classNames({
      [css.voteControls]: true,
      clearfix: true,
    });

    return (
      <div className={proposalClass}>
        <div className={css.proposalCreator}>
          <AccountPopup accountAddress={proposal.proposer} dao={dao} historyView/>
          <AccountProfileName accountAddress={proposal.proposer} accountProfile={creatorProfile} daoAvatarAddress={dao.address} historyView/>
        </div>
        <div className={css.endDate}>
          {closingTime(proposal).format("MMM D, YYYY")}
        </div>
        <div className={css.scheme}>
          <div>{proposal.queue.name.replace(/([A-Z])/g, " $1")}</div>
        </div>
        <div className={css.title}>
          <div><Link to={"/dao/" + dao.address + "/proposal/" + proposal.id} data-test-id="proposal-title">{humanProposalTitle(proposal)}</Link></div>
        </div>
        <div className={css.votes}>
          <div className={voteControls}>
            <VoteBreakdown currentAccountAddress={currentAccountAddress} currentVote={currentAccountVote} dao={dao} proposal={proposal} />
          </div>
        </div>

        <div className={css.predictions}>
          <StakeGraph
            proposal={proposal}
            historyView
          />
        </div>
        <div className={closeReasonClass}>
          <div className={css.decisionPassed}>
            <img src="/assets/images/Icon/vote/for.svg"/>
            <span>Passed</span>
            <div className={css.decisionReason}>
              <span>{closeReason}</span>
            </div>
          </div>
          <div className={css.decisionFailed}>
            <img src="/assets/images/Icon/vote/against.svg"/>
            <span>Failed</span>
            <div className={css.decisionReason}>
              <span>{closeReason}</span>
            </div>
          </div>
        </div>
        <div className={myActionsClass}>
          <div className={css.myVote}>
            <span>{formatTokens(currentAccountVoteAmount, "Rep")}</span>
            <img className={css.passVote} src="/assets/images/Icon/vote/for-fill.svg"/>
            <img className={css.failVote} src="/assets/images/Icon/vote/against-fill.svg"/>
          </div>
          <div className={css.myStake}>
            <span>{formatTokens(currentAccountStakeAmount, "GEN")}</span>
            <img className={css.forStake} src="/assets/images/Icon/v-small-fill.svg"/>
            <img className={css.againstStake} src="/assets/images/Icon/x-small-fill.svg"/>
          </div>
        </div>
      </div>
    );
  }
}

export const ConnectedProposalHistoryRow = connect<IStateProps, IDispatchProps, IContainerProps>(mapStateToProps, mapDispatchToProps)(ProposalHistoryRow);

export default (props: { proposal: Proposal; daoState: IDAOState; currentAccountAddress: Address}) => {
  const proposal = props.proposal;
  const observable = combineLatest(
    proposal.state(),
    props.currentAccountAddress ? proposal.stakes({ where: { staker: props.currentAccountAddress}}) : of([]),
    props.currentAccountAddress ? proposal.votes({ where: { voter: props.currentAccountAddress }}) : of([])
  );
  return <Subscribe observable={observable}>{
    (state: IObservableState<[IProposalState, IStake[], IVote[]]>): any => {
      if (state.isLoading) {
        return <div>Loading proposal {proposal.id.substr(0, 6)}...</div>;
      } else if (state.error) {
        return <div>{ state.error.message }</div>;
      } else {
        const proposal = state.data[0];
        const stakes = state.data[1];
        const votes = state.data[2];
        return <ConnectedProposalHistoryRow
          currentAccountAddress={props.currentAccountAddress}
          proposal={proposal}
          dao={props.daoState}
          stakesOfCurrentUser={stakes}
          votesOfCurrentUser={votes}
        />;
      }
    }
  }</Subscribe>;
};
