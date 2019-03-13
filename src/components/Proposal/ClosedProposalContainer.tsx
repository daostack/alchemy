import { Address, IDAOState, IMemberState, IProposalStage, IProposalState, IRewardState, IStake, IVote } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import { getArc } from "arc";
import BN = require("bn.js");
import * as classNames from "classnames";
import AccountPopupContainer from "components/Account/AccountPopupContainer";
import AccountProfileName from "components/Account/AccountProfileName";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { humanProposalTitle} from "lib/util";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { proposalEnded, proposalFailed, proposalPassed } from "reducers/arcReducer";
import { closingTime } from "reducers/arcReducer";
import { IProfileState } from "reducers/profilesReducer";
import { combineLatest, of } from "rxjs";
import PredictionBox from "./PredictionBox";
import * as css from "./Proposal.scss";
import VoteBox from "./VoteBox";

interface IStateProps {
  beneficiaryProfile?: IProfileState;
  creatorProfile?: IProfileState;
  currentAccountAddress: Address;
  currentAccountState: IMemberState;
  daoEthBalance: BN;
  rewardsForCurrentUser: IRewardState[];
  stakesOfCurrentUser: IStake[];
  votesOfCurrentUser: IVote[];
  dao: IDAOState;
  proposal: IProposalState;
}

interface IContainerProps {
  dao: IDAOState;
  daoEthBalance: BN;
  currentAccountAddress: Address;
  currentAccountState: IMemberState;
  proposal: IProposalState;
  rewardsForCurrentUser: IRewardState[];
  stakesOfCurrentUser: IStake[];
  votesOfCurrentUser: IVote[];
}

const mapStateToProps = (state: IRootState, ownProps: IContainerProps): IStateProps => {
  const proposal = ownProps.proposal;
  const dao = ownProps.dao;

  let currentAccountState = ownProps.currentAccountState;

  return {
    beneficiaryProfile: state.profiles[proposal.beneficiary],
    creatorProfile: state.profiles[proposal.proposer],
    currentAccountAddress: ownProps.currentAccountAddress,
    currentAccountState,
    dao,
    daoEthBalance: ownProps.daoEthBalance,
    proposal,
    rewardsForCurrentUser: ownProps.rewardsForCurrentUser,
    stakesOfCurrentUser: ownProps.stakesOfCurrentUser,
    votesOfCurrentUser: ownProps.votesOfCurrentUser
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

class ProposalContainer extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      preRedeemModalOpen: false
    };
  }

  public handleClickExecute(event: any) {
    this.props.executeProposal(this.props.dao.address, this.props.proposal.id);
  }

  public handleClickRedeem(event: any) {
    this.setState({ preRedeemModalOpen: true });
  }

  public closePreRedeemModal(event: any) {
    this.setState({ preRedeemModalOpen: false });
  }

  public render() {
    const {
      beneficiaryProfile,
      creatorProfile,
      currentAccountAddress,
      currentAccountState,
      dao,
      daoEthBalance,
      proposal,
      rewardsForCurrentUser,
      stakesOfCurrentUser,
      votesOfCurrentUser,
    } = this.props;

    const externalTokenBalance = dao.externalTokenBalance;

    const beneficiaryHasRewards = (
      proposal.reputationReward.gt(new BN(0)) ||
      proposal.nativeTokenReward.gt(new BN(0)) ||
      (proposal.ethReward.gt(new BN(0)) && daoEthBalance.gte(proposal.ethReward)) ||
      (proposal.externalTokenReward.gt(new BN(0)) && externalTokenBalance.gte(proposal.externalTokenReward))
    ) as boolean;

    const accountHasRewards = rewardsForCurrentUser.length !== 0;

    const redeemable = accountHasRewards || beneficiaryHasRewards;

    if (proposal) {
      // TODO: check if the commented lines are represented correctly in the line below
      // const executable = proposalEnded(proposal) && proposal.state !== ProposalStates.Closed && proposal.state !== ProposalStates.Executed;
      const proposalClass = classNames({
        [css.proposal]: true,
        [css.closedProposal]: true,
        [css.failedProposal]: proposalFailed(proposal),
        [css.passedProposal]: proposalPassed(proposal),
        [css.redeemable]: redeemable
      });

      let currentAccountVote = 0, currentAccountPrediction = 0, currentAccountStakeAmount = new BN(0);

      let currentVote: IVote;
      if (votesOfCurrentUser.length > 0) {
        currentVote = votesOfCurrentUser[0];
        currentAccountVote = currentVote.outcome;
      }

      let currentStake: IStake;
      if (stakesOfCurrentUser.length > 0) {
        currentStake = stakesOfCurrentUser[0];
      }
      if (currentStake) {
        currentAccountPrediction = currentStake.outcome;
        currentAccountStakeAmount = currentStake.amount;
      }

      return (
        <div className={proposalClass + " " + css.clearfix}>
          <div className={css.proposalCreator}>
            <AccountPopupContainer accountAddress={proposal.proposer} dao={dao} historyView={true}/>
            <AccountProfileName accountProfile={creatorProfile} daoAvatarAddress={dao.address} historyView={true}/>
          </div>
          <div className={css.endDate}>
            {closingTime(proposal).format("MMM D, YYYY")}
          </div>
          <div className={css.title}>
            <div>{humanProposalTitle(proposal)}</div>
          </div>
          <div className={css.votes}>
              <VoteBox
                isVotingNo={false}
                isVotingYes={false}
                currentVote={currentAccountVote}
                currentAccountAddress={currentAccountAddress}
                dao={dao}
                proposal={proposal}
                historyView={true}
              />
          </div>
          <div className={css.predictions}>
              <PredictionBox
                isPredictingFail={false}
                isPredictingPass={false}
                beneficiaryProfile={beneficiaryProfile}
                currentPrediction={currentAccountPrediction}
                currentStake={currentAccountStakeAmount}
                currentAccountGens={new BN(0)}
                currentAccountGenStakingAllowance={new BN(1000000)}
                dao={dao}
                proposal={proposal}
                threshold={0}
                approveStakingGens={null}
                historyView={true}
              />
          </div>
          <div className={css.closeReason + " " + css.decisionPassed}>
            <div className={css.decisionPassed}>
              <img src="/assets/images/Icon/vote/for.svg"/>
              <span>Passed</span>
              <div className={css.decisionReason}>
                <span>Relative Majority</span>
              </div>
            </div>
            <div className={css.decisionFailed}>
              <img src="/assets/images/Icon/vote/against.svg"/>
              <span>Failed</span>
              <div className={css.decisionReason}>
                <span>Relative Majority</span>
              </div>
            </div>
          </div>
          <div className={css.myActions + " " + css.iVoted + " " + css.iStaked + " " + css.forStake + " " + css.failVote}>
            <div className={css.myVote}>
              <span>1.1 Rep</span>
              <img className={css.passVote} src="/assets/images/Icon/vote/for-fill.svg"/>
              <img className={css.failVote} src="/assets/images/Icon/vote/against-fill.svg"/>
            </div>
            <div className={css.myStake}>
              <span>5 GEN</span>
              <img className={css.forStake} src="/assets/images/Icon/v-small-fill.svg"/>
              <img className={css.againstStake} src="/assets/images/Icon/x-small-fill.svg"/>
            </div>
          </div>
        </div>
      );
    } else {
      return (<div>Loading proposal... </div>);
    }
  }
}

export const ConnectedProposalContainer = connect<IStateProps, IDispatchProps, IContainerProps>(mapStateToProps, mapDispatchToProps)(ProposalContainer);

export default (props: { proposalId: string, dao: IDAOState, currentAccountAddress: Address}) => {
  // TODO: get things to work without an account
  if (!props.currentAccountAddress) {
    return null;
  }

  const arc = getArc();
  const dao = arc.dao(props.dao.address);

  const observable = combineLatest(
    dao.proposal(props.proposalId).state(), // the list of pre-boosted proposals
    props.currentAccountAddress ? dao.member(props.currentAccountAddress).state() : of(null),
    // TODO: filter by beneficiary - see https://github.com/daostack/subgraph/issues/60
    // arc.proposal(props.proposalId).rewards({ beneficiary: props.currentAccountAddress})
    props.currentAccountAddress ? dao.proposal(props.proposalId).rewards({}) : of([]),
    props.currentAccountAddress ? dao.proposal(props.proposalId).stakes({ staker: props.currentAccountAddress}) : of([]),
    props.currentAccountAddress ? dao.proposal(props.proposalId).votes({ voter: props.currentAccountAddress }) : of([]),
    dao.ethBalance()
  );
  return <Subscribe observable={observable}>{
    (state: IObservableState<[IProposalState, IMemberState, IRewardState[], IStake[], IVote[], BN]>): any => {
      if (state.isLoading) {
        return <div>Loading proposal</div>;
      } else if (state.error) {
        return <div>{ state.error.message }</div>;
      } else {
        const proposal = state.data[0];
        const rewards = state.data[2];
        const stakes = state.data[3];
        const votes = state.data[4];
        return <ConnectedProposalContainer
          currentAccountAddress={props.currentAccountAddress}
          currentAccountState={state.data[1]}
          proposal={proposal}
          dao={props.dao}
          daoEthBalance={state.data[5]}
          rewardsForCurrentUser={rewards}
          stakesOfCurrentUser={stakes}
          votesOfCurrentUser={votes}
          />;
      }
    }
  }</Subscribe>;
};
