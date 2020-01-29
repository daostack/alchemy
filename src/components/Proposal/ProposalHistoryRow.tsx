import { Address, IDAOState, IExecutionState, IMemberState, IProposalOutcome, IProposalState, Stake, Vote, Proposal } from "@daostack/client";
import { executeProposal, redeemProposal } from "actions/arcActions";
import classNames from "classnames";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { formatTokens, humanProposalTitle, schemeName } from "lib/util";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { closingTime, proposalFailed, proposalPassed } from "lib/proposalHelpers";
import { IProfileState } from "reducers/profilesReducer";
import { combineLatest, of } from "rxjs";
import StakeGraph from "./Staking/StakeGraph";
import VoteBreakdown from "./Voting/VoteBreakdown";
import * as css from "./ProposalHistoryRow.scss";

import BN = require("bn.js");

interface IExternalProps {
  proposal: Proposal;
  daoState: IDAOState;
  currentAccountAddress: Address;
  history: any;
}

interface IStateProps {
  creatorProfile?: IProfileState;
}

interface IDispatchProps {
  redeemProposal: typeof redeemProposal;
  executeProposal: typeof executeProposal;
}

type SubscriptionData = [IProposalState, Stake[], Vote[], IMemberState];
type IProps = IStateProps & IDispatchProps & IExternalProps & ISubscriptionProps<SubscriptionData>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps & ISubscriptionProps<SubscriptionData>): IExternalProps & ISubscriptionProps<SubscriptionData> & IStateProps => {
  const proposal = ownProps.data[0];

  return {
    ...ownProps,
    creatorProfile: state.profiles[proposal.proposer],
  };
};

const mapDispatchToProps = {
  redeemProposal,
  executeProposal,
};

interface IState {
  isMobile: boolean;
  preRedeemModalOpen: boolean;
}

class ProposalHistoryRow extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      isMobile: false,
      preRedeemModalOpen: false,
    };
  }

  public componentDidMount() {
    window.addEventListener("resize", this.updateWindowDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWindowDimensions);
  }

  private updateWindowDimensions = (_e: any) => {
    const nowMobile = window.innerWidth <= 425;
    if (nowMobile !== this.state.isMobile) {
      this.setState({ isMobile: nowMobile });
    }
  }

  private gotoProposal = () => {
    const { daoState, history, proposal } = this.props;
    history.push("/dao/" + daoState.address + "/proposal/" + proposal.id);
  }

  public render(): RenderOutput {
    const {
      creatorProfile,
      currentAccountAddress,
      data, daoState } = this.props;
    const [proposalState, stakesOfCurrentUser, votesOfCurrentUser, currentMemberState] = data;

    const proposalClass = classNames({
      [css.wrapper]: true,
      clearfix: true,
    });

    let currentAccountVote = 0;
    let currentAccountPrediction = 0;
    let currentAccountStakeAmount = new BN(0);
    let currentAccountVoteAmount = new BN(0);

    let currentVote: Vote;
    if (votesOfCurrentUser.length > 0) {
      currentVote = votesOfCurrentUser[0];
      currentAccountVote = currentVote.staticState.outcome;
      currentAccountVoteAmount = new BN(currentVote.staticState.amount);
    }

    if (stakesOfCurrentUser.length > 0) {
      currentAccountStakeAmount = stakesOfCurrentUser
        .map((stake): BN => stake.staticState.amount)
        .reduce((prev: BN, current: BN)  => { return prev.add(current); });
      currentAccountPrediction = stakesOfCurrentUser[0].staticState.outcome;
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
      <tr className={proposalClass}>
        <td className={css.proposalCreator}>
          <AccountPopup accountAddress={proposalState.proposer} daoState={daoState} width={this.state.isMobile ? 12 : 40} />
          <AccountProfileName accountAddress={proposalState.proposer} accountProfile={creatorProfile} daoAvatarAddress={daoState.address} historyView/>
        </td>
        <td onClick={this.gotoProposal} className={css.endDate}>
          {closingTime(proposalState) ? closingTime(proposalState).format("MMM D, YYYY") : ""}
        </td>
        <td onClick={this.gotoProposal} className={css.scheme}>
          {schemeName(proposalState.scheme)}
        </td>
        <td onClick={this.gotoProposal} className={css.title}>
          {humanProposalTitle(proposalState)}
        </td>
        <td onClick={this.gotoProposal} className={css.votes}>
          <div className={voteControls}>
            <VoteBreakdown
              currentAccountAddress={currentAccountAddress}
              currentAccountState={currentMemberState}
              currentVote={currentAccountVote} daoState={daoState}
              proposal={proposalState} historyView />
          </div>
        </td>
        <td onClick={this.gotoProposal} className={css.predictions}>
          <StakeGraph
            proposal={proposalState}
            historyView
          />
        </td>
        <td onClick={this.gotoProposal} className={closeReasonClass}>
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
        </td>
        <td onClick={this.gotoProposal} className={myActionsClass}>
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
        </td>
      </tr>
    );
  }
}

const ConnectedProposalHistoryRow = connect(mapStateToProps, mapDispatchToProps)(ProposalHistoryRow);

// In this case we wrap the Connected component because mapStateToProps requires the subscribed proposal state
export default withSubscription({
  wrappedComponent: ConnectedProposalHistoryRow,
  loadingComponent: (props) => <tr><td>Loading proposal {props.proposal.id.substr(0, 6)}...</td></tr>,
  errorComponent: (props) => <tr><td>{ props.error.message }</td></tr>,
  checkForUpdate: ["currentAccountAddress"],
  createObservable: (props: IExternalProps) => {
    const proposal = props.proposal;
    if (!props.currentAccountAddress) {
      return combineLatest(
        proposal.state(),
        of([]),
        of([]),
        of(null),
      );
    } else {
      return combineLatest(
        proposal.state(),
        proposal.stakes({ where: { staker: props.currentAccountAddress}}),
        proposal.votes({ where: { voter: props.currentAccountAddress }}),
        // we set 'fetchPolicy' to 'cache-only' so as to not send queries for addresses that are not members. The cache is filled higher up.
        props.daoState.dao.member(props.currentAccountAddress).state({ fetchPolicy: "cache-only"}),
      );
    }
  },
});
