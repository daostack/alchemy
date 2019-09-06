import { Address, IDAOState, IExecutionState, IProposalOutcome, IProposalState, Stake, Vote, Proposal, IMemberState } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import * as classNames from "classnames";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import { formatTokens, humanProposalTitle } from "lib/util";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { IRootState } from "reducers";
import { proposalFailed, proposalPassed } from "reducers/arcReducer";
import { closingTime } from "reducers/arcReducer";
import { IProfileState } from "reducers/profilesReducer";
import StakeGraph from "./Staking/StakeGraph";
import VoteBreakdown from "./Voting/VoteBreakdown";
import * as css from "./ProposalHistoryRow.scss";

import BN = require("bn.js");

interface IExternalProps {
  proposal: Proposal;
  dao: IDAOState;
  currentAccountAddress: Address;
  currentAccountState: IMemberState;
  stakes: Stake[];
  votes: Vote[];
  proposalState: IProposalState;
}

interface IStateProps {
  creatorProfile?: IProfileState;
}

interface IDispatchProps {
  redeemProposal: typeof arcActions.redeemProposal;
  executeProposal: typeof arcActions.executeProposal;
}

type IProps = IStateProps & IDispatchProps & IExternalProps;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  const proposal = ownProps.proposalState;

  return {
    ...ownProps,
    creatorProfile: state.profiles[proposal.proposer],
  };
};

const mapDispatchToProps = {
  redeemProposal: arcActions.redeemProposal,
  executeProposal: arcActions.executeProposal,
};

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
    const { creatorProfile, currentAccountAddress, dao, proposal, proposalState, currentAccountState, stakes, votes } = this.props;

    const proposalClass = classNames({
      [css.wrapper]: true,
      clearfix: true,
    });

    let currentAccountVote = 0; let currentAccountPrediction = 0; let currentAccountStakeAmount = new BN(0); let currentAccountVoteAmount = new BN(0);

    let currentVote: Vote;
    if (votes.length > 0) {
      currentVote = votes[0];
      currentAccountVote = currentVote.staticState.outcome;
      currentAccountVoteAmount = new BN(currentVote.staticState.amount);
    }

    let currentStake: Stake;
    if (stakes.length > 0) {
      currentStake = stakes[0];
    }
    if (currentStake) {
      currentAccountPrediction = currentStake.staticState.outcome;
      currentAccountStakeAmount = new BN(currentStake.staticState.amount);
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
      [css.decisionPassed]: proposalPassed(proposalState),
      [css.decisionFailed]: proposalFailed(proposalState),
    });

    let closeReason = "Time out";
    switch (proposalState.executionState) {
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
          <AccountPopup accountAddress={proposalState.proposer} dao={dao} historyView/>
          <AccountProfileName accountAddress={proposalState.proposer} accountProfile={creatorProfile} daoAvatarAddress={dao.address} historyView/>
        </div>
        <div className={css.endDate}>
          {closingTime(proposalState).format("MMM D, YYYY")}
        </div>
        <div className={css.scheme}>
          <div>{proposalState.queue.name.replace(/([A-Z])/g, " $1")}</div>
        </div>
        <div className={css.title}>
          <div><Link to={"/dao/" + dao.address + "/proposal/" + proposal.id} data-test-id="proposal-title">{humanProposalTitle(proposalState)}</Link></div>
        </div>
        <div className={css.votes}>
          <div className={voteControls}>
            <VoteBreakdown currentAccountState={currentAccountState} currentAccountAddress={currentAccountAddress} currentVote={currentAccountVote} dao={dao} proposal={proposalState} />
          </div>
        </div>

        <div className={css.predictions}>
          <StakeGraph
            proposal={proposalState}
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

const ConnectedProposalHistoryRow = connect(mapStateToProps, mapDispatchToProps)(ProposalHistoryRow);
export default ConnectedProposalHistoryRow;
