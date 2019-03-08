import { Address, IDAOState, IMemberState, IProposalStage, IProposalState, IRewardState, IStake, IVote } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import { getArc } from "arc";
import BN = require("bn.js");
import * as classNames from "classnames";
import AccountPopupContainer from "components/Account/AccountPopupContainer";
import AccountProfileName from "components/Account/AccountProfileName";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import Util, { humanProposalTitle} from "lib/util";
import * as moment from "moment";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { proposalEnded, proposalFailed, proposalPassed } from "reducers/arcReducer";
import { closingTime } from "reducers/arcReducer";
import { IProfileState } from "reducers/profilesReducer";
import { combineLatest, of } from "rxjs";
import { isRedeemPending } from "selectors/operations";
import PredictionBox from "./PredictionBox";
import * as css from "./Proposal.scss";
import RedeemButton from "./RedeemButton";
import RedemptionsTip from "./RedemptionsTip";
import VoteBox from "./VoteBox";

interface IStateProps {
  beneficiaryProfile?: IProfileState;
  creatorProfile?: IProfileState;
  currentAccount: IMemberState;
  daoEthBalance: BN;
  rewardsForCurrentUser: IRewardState[];
  stakesOfCurrentUser: IStake[];
  votesOfCurrentUser: IVote[];
  dao: IDAOState;
  proposal: IProposalState;
  isRedeemPending: boolean;
}

interface IContainerProps {
  dao: IDAOState;
  daoEthBalance: BN;
  currentAccount: IMemberState;
  proposal: IProposalState;
  rewardsForCurrentUser: IRewardState[];
  stakesOfCurrentUser: IStake[];
  votesOfCurrentUser: IVote[];
}

const mapStateToProps = (state: IRootState, ownProps: IContainerProps): IStateProps => {
  const proposal = ownProps.proposal;
  const dao = ownProps.dao;

  let currentAccount = ownProps.currentAccount;

  return {
    beneficiaryProfile: state.profiles[proposal.beneficiary],
    creatorProfile: state.profiles[proposal.proposer],
    currentAccount,
    dao,
    daoEthBalance: ownProps.daoEthBalance,
    isRedeemPending: isRedeemPending(proposal.id, currentAccount.address)(state),
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
      currentAccount,
      dao,
      daoEthBalance,
      proposal,
      redeemProposal,
      executeProposal,
      isRedeemPending,
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
      const executable = proposalEnded(proposal) && !proposal.executedAt;
      const proposalClass = classNames({
        [css.proposal]: true,
        [css.closedProposal]: true,
        [css.failedProposal]: proposalFailed(proposal),
        [css.passedProposal]: proposalPassed(proposal),
        [css.redeemable]: redeemable
      });

      const submittedTime = moment.unix(proposal.createdAt);

      // Calculate reputation percentages
      const totalReputation = Util.fromWei(proposal.stage == IProposalStage.Executed ? proposal.totalRepWhenExecuted : dao.reputationTotalSupply);
      const votesFor = Util.fromWei(proposal.votesFor);
      const votesAgainst = Util.fromWei(proposal.votesAgainst);
      const yesPercentage = totalReputation && votesFor ? Math.max(2, Math.ceil(votesFor / totalReputation * 100)) : 0;
      const noPercentage = totalReputation && votesAgainst ? Math.max(2, Math.ceil(votesAgainst / totalReputation * 100)) : 0;
      const passedByDecision = totalReputation ? (votesFor / totalReputation) > 0.5 : false;
      const failedByDecision = totalReputation ? (votesAgainst / totalReputation) > 0.5 : false;

      let currentAccountVote = 0, currentAccountPrediction = 0, currentAccountStakeAmount = new BN(0);

      const redeemProps = {
        accountHasRewards,
        isRedeemPending,
        redeemable,
        executable,
        beneficiaryHasRewards,
        rewards: rewardsForCurrentUser,
        currentAccount,
        dao,
        proposal,
        handleClickRedeem: this.handleClickRedeem.bind(this)
      };

      const redemptionsTip = RedemptionsTip(redeemProps);
      const redeemButton = RedeemButton(redeemProps);

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

      const styles = {
        forBar: {
          width: yesPercentage + "%",
        },
        againstBar: {
          width: noPercentage + "%",
        },
      };

      const disqusConfig = {
        url: process.env.BASE_URL + "/dao/" + dao.address + "/proposal/" + proposal.id,
        identifier: proposal.id
      };

      const executeButtonClass = classNames({
        [css.stateChange]: true,
        [css.invisible]: proposalEnded(proposal) || closingTime(proposal).isAfter(moment())
      });

      return (
        <div className={proposalClass + " " + css.clearfix}>
          <div className={css.proposalCreator}>
            <AccountPopupContainer accountAddress={proposal.proposer} dao={dao} />
            <AccountProfileName accountProfile={creatorProfile} daoAvatarAddress={dao.address} />
          </div>
          <div className={css.endDate}>
            {closingTime(proposal).format("MMM D, YYYY")}
          </div>
          <div className={css.title}>
            {humanProposalTitle(proposal)}
          </div>
          <div className={css.closeReason}>
            Reason for close
          </div>
          <div className={css.votes}>
              <VoteBox
                isVotingNo={false}
                isVotingYes={false}
                currentVote={currentAccountVote}
                currentAccount={currentAccount}
                dao={dao}
                proposal={proposal}
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
              />
          </div>
          <div className={css.myActions}>
            My Actions
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
          currentAccount={state.data[1]}
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
