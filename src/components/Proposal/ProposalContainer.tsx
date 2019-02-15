import { Address, IDAOState, IMemberState, IProposalState, IRewardState, IStake, IVote, ProposalStage } from "@daostack/client"
import * as arcActions from "actions/arcActions";
import * as web3Actions from "actions/web3Actions";
import { getArc } from "arc";
import * as classNames from "classnames";
import AccountPopupContainer from "components/Account/AccountPopupContainer";
import AccountProfileName from "components/Account/AccountProfileName";
import Countdown from "components/Shared/Countdown";
import { ActionTypes, default as PreTransactionModal } from "components/Shared/PreTransactionModal";
import Subscribe, { IObservableState } from "components/Shared/Subscribe"
import { CommentCount } from "disqus-react";
import * as moment from "moment";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { IRootState } from "reducers";
import { proposalEnded, proposalFailed, proposalPassed } from "reducers/arcReducer";
import { closingTime, VoteOptions } from "reducers/arcReducer";
import { IProfileState } from "reducers/profilesReducer";
import { combineLatest, Observable, of } from "rxjs"
import { isRedeemPending, isStakePending, isVotePending } from "selectors/operations";
import PredictionBox from "./PredictionBox";
import * as css from "./Proposal.scss";
import RedeemButton from "./RedeemButton"
import RedemptionsTip from "./RedemptionsTip"
import TransferDetails from "./TransferDetails";
import VoteBox from "./VoteBox";

interface IStateProps {
  beneficiaryProfile?: IProfileState
  creatorProfile?: IProfileState
  currentAccount: IMemberState
  currentAccountGens: number
  currentAccountGenStakingAllowance: number
  rewardsForCurrentUser: IRewardState[]
  stakesOfCurrentUser: IStake[]
  votesOfCurrentUser: IVote[]
  dao: IDAOState
  proposal: IProposalState
  isVotingYes: boolean
  isVotingNo: boolean
  isPredictingPass: boolean
  isPredictingFail: boolean
  isRedeemPending: boolean
  threshold: number
}

interface IContainerProps {
  dao: IDAOState
  currentAccount: IMemberState
  proposal: IProposalState
  rewardsForCurrentUser: IRewardState[]
  stakesOfCurrentUser: IStake[]
  votesOfCurrentUser: IVote[]
}

const mapStateToProps = (state: IRootState, ownProps: IContainerProps): IStateProps => {
  const proposal = ownProps.proposal
  const dao = ownProps.dao
  // const currentVote = state.arc.votes[`${proposal.id}-${state.web3.ethAccountAddress}`];
  // TODO: get the threshold from the proposals
  // const threshold = dao.currentThresholdToBoost;
  const threshold = 12345

  let currentAccount = ownProps.currentAccount

  return {
    beneficiaryProfile: state.profiles[proposal.beneficiary],
    creatorProfile: state.profiles[proposal.proposer],
    currentAccount,
    currentAccountGens: state.web3.currentAccountGenBalance,
    currentAccountGenStakingAllowance: state.web3.currentAccountGenStakingAllowance,
    // currentVote,
    dao,
    isVotingYes: isVotePending(proposal.id, VoteOptions.Yes)(state),
    isVotingNo: isVotePending(proposal.id, VoteOptions.No)(state),
    isPredictingPass: isStakePending(proposal.id, VoteOptions.Yes)(state),
    isPredictingFail: isStakePending(proposal.id, VoteOptions.No)(state),
    isRedeemPending: isRedeemPending(proposal.id, state.web3.ethAccountAddress)(state),
    proposal,
    rewardsForCurrentUser: ownProps.rewardsForCurrentUser,
    stakesOfCurrentUser: ownProps.stakesOfCurrentUser,
    votesOfCurrentUser: ownProps.votesOfCurrentUser,
    threshold
  };
};

interface IDispatchProps {
  approveStakingGens: typeof web3Actions.approveStakingGens;
  redeemProposal: typeof arcActions.redeemProposal;
  executeProposal: typeof arcActions.executeProposal;
  voteOnProposal: typeof arcActions.voteOnProposal;
  stakeProposal: typeof arcActions.stakeProposal;
}

const mapDispatchToProps = {
  approveStakingGens: web3Actions.approveStakingGens,
  redeemProposal: arcActions.redeemProposal,
  executeProposal: arcActions.executeProposal,
  voteOnProposal: arcActions.voteOnProposal,
  stakeProposal: arcActions.stakeProposal,
};

type IProps = IStateProps & IDispatchProps & IContainerProps

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
      currentAccountGens,
      currentAccountGenStakingAllowance,
      // currentVote,
      dao,
      proposal,
      approveStakingGens,
      redeemProposal,
      executeProposal,
      stakeProposal,
      voteOnProposal,
      isPredictingFail,
      isPredictingPass,
      isVotingNo,
      isVotingYes,
      isRedeemPending,
      rewardsForCurrentUser,
      stakesOfCurrentUser,
      votesOfCurrentUser,
      threshold
    } = this.props;

    // TODO: fix this: get the amount of ETH, GEN, and externalToken of the DAO
    const ethBalance = dao.ethBalance
    const genBalance = dao.tokenBalance
    const externalTokenBalance = dao.externalTokenBalance

    const beneficiaryHasRewards = (
      proposal.reputationReward ||
      proposal.nativeTokenReward ||
      (proposal.ethReward && ethBalance >= proposal.ethReward) ||
      (proposal.externalTokenReward && externalTokenBalance >= proposal.externalTokenReward)
    ) as boolean;

    const accountHasRewards = rewardsForCurrentUser.length !== 0

    const redeemable = accountHasRewards || beneficiaryHasRewards;

    if (proposal) {
      // TODO: check if the commented lines are represented correctly in the line below
      // const executable = proposalEnded(proposal) && proposal.state !== ProposalStates.Closed && proposal.state !== ProposalStates.Executed;
      const executable = proposalEnded(proposal) && !proposal.executedAt;
      const proposalClass = classNames({
        [css.proposal]: true,
        [css.openProposal]: proposal.stage == ProposalStage.Queued || proposal.stage === ProposalStage.PreBoosted || proposal.stage == ProposalStage.Boosted || proposal.stage == ProposalStage.QuietEndingPeriod,
        [css.failedProposal]: proposalFailed(proposal),
        [css.passedProposal]: proposalPassed(proposal),
        [css.redeemable]: redeemable
      });

      const submittedTime = moment.unix(proposal.createdAt);

      // Calculate reputation percentages
      // TODO: calculate "reputationWhenExecuted" as in the commented line
      // const totalReputation = proposal.state == ProposalStates.Executed ? proposal.reputationWhenExecuted : dao.reputationCount;
      const totalReputation: number = dao.reputationTotalSupply

      const yesPercentage = totalReputation && proposal.votesFor ? Math.max(2, Math.ceil(proposal.votesFor / totalReputation * 100)) : 0;
      const noPercentage = totalReputation && proposal.votesAgainst ? Math.max(2, Math.ceil(proposal.votesAgainst / totalReputation * 100)) : 0;
      const passedByDecision = totalReputation ? (proposal.votesFor / totalReputation) > 0.5 : false;
      const failedByDecision = totalReputation ? (proposal.votesAgainst / totalReputation) > 0.5 : false;

      let currentAccountVote = 0, currentAccountPrediction = 0, currentAccountStakeAmount = 0

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
      }

      const redemptionsTip = RedemptionsTip(redeemProps)
      const redeemButton = RedeemButton(redeemProps)

      let currentVote: IVote
      if (votesOfCurrentUser.length > 0) {
        currentVote = votesOfCurrentUser[0]
        currentAccountVote = currentVote.outcome;
      }

      let currentStake: IStake
      if (stakesOfCurrentUser.length > 0) {
        currentStake = stakesOfCurrentUser[0]
      }
      if (currentStake) {
        currentAccountPrediction = currentStake.outcome
        currentAccountStakeAmount = currentStake.amount
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

      return (
        <div className={proposalClass + " " + css.clearfix}>

          <div className={css.proposalInfo}>
            <div className={css.cardTop + " " + css.clearfix}>
              <div className={css.timer}>
                {!proposalEnded(proposal) ?
                    closingTime(proposal).isAfter(moment()) ? <Countdown toDate={closingTime(proposal)} /> : <span className={css.closedTime}>CLOSED {closingTime(proposal).format("MMM D, YYYY").toUpperCase()}</span>
                    : " "
                }
              </div>
              <div className={css.stateChange}>
                <button className={css.executeProposal}>
                  <img src="/assets/images/Icon/execute.svg"/>
                  <span> Execute</span>
                </button>
                <button className={css.boostProposal}>
                  <img src="/assets/images/Icon/boost.svg"/>
                  <span> Boost</span>
                </button>
              </div>
            </div>

            {proposalPassed(proposal) ?
              <div className="css.clearfix">
                <div className={css.proposalPassInfo}>
                  <strong className={css.passedBy}>PASSED</strong> {passedByDecision ? "BY DECISION" : "BY TIMEOUT"} ON {closingTime(proposal).format("MMM DD, YYYY")}
                </div>
                <div className={css.decisionGraph}>
                  <span className={css.forLabel}>{proposal.votesFor.toFixed(2).toLocaleString()} ({yesPercentage}%)</span>
                  <div className={css.graph}>
                    <div className={css.forBar} style={styles.forBar}></div>
                    <div className={css.againstBar} style={styles.againstBar}></div>
                    <div className={css.divider}></div>
                  </div>
                  <span className={css.againstLabel}>{proposal.votesAgainst.toFixed(2).toLocaleString()} ({noPercentage}%)</span>
                </div>
              </div>
              : proposalFailed(proposal) ?
                <div className="css.clearfix">
                  <div className={css.proposalFailInfo}>
                    <strong className={css.failedBy}>FAILED</strong> {failedByDecision ? "BY DECISION" : "BY TIMEOUT"} ON {closingTime(proposal).format("MMM DD, YYYY")}
                  </div>
                  <div className={css.decisionGraph}>
                    <span className={css.forLabel}>{proposal.votesFor.toFixed(2).toLocaleString()} ({yesPercentage}%)</span>
                    <div className={css.graph}>
                      <div className={css.forBar} style={styles.forBar}></div>
                      <div className={css.againstBar} style={styles.againstBar}></div>
                      <div className={css.divider}></div>
                    </div>
                    <span className={css.againstLabel}>{proposal.votesAgainst.toFixed(2).toLocaleString()} ({noPercentage}%)</span>
                  </div>
                </div>
                : ""
            }

            <div className={css.createdBy}>
              <AccountPopupContainer accountAddress={proposal.proposer} dao={dao}/>
              <AccountProfileName accountProfile={creatorProfile} daoAvatarAddress={dao.address} />
            </div>

            <h3>
              <span data-test-id="proposal-closes-in">
                {proposal.stage == ProposalStage.QuietEndingPeriod ?
                  <strong>
                    <img src="/assets/images/Icon/Overtime.svg" /> OVERTIME: CLOSES {closingTime(proposal).fromNow().toUpperCase()}
                    <div className={css.help}>
                      <img src="/assets/images/Icon/Help-light.svg" />
                      <img className={css.hover} src="/assets/images/Icon/Help-light-hover.svg" />
                      <div className={css.helpBox}>
                        <div className={css.pointer}></div>
                        <div className={css.bg}></div>
                        <div className={css.bridge}></div>
                        <div className={css.header}>
                          <h2>Genesis Protocol</h2>
                          <h3>RULES FOR OVERTIME</h3>
                        </div>
                        <div className={css.body}>
                          <p>Boosted proposals can only pass if the final 1 day of voting has seen “no change of decision”. In case of change of decision on the last day of voting, the voting period is increased one day. This condition (and procedure) remains until a resolution is reached, with the decision kept unchanged for the last 24 hours.</p>
                        </div>
                        <a href="https://docs.google.com/document/d/1LMe0S4ZFWELws1-kd-6tlFmXnlnX9kfVXUNzmcmXs6U/edit?usp=drivesdk" target="_blank">View the Genesis Protocol</a>
                      </div>
                    </div>
                  </strong>
                  : " "
                }
              </span>
              <Link to={"/dao/" + dao.address + "/proposal/" + proposal.id} data-test-id="proposal-title">{proposal.title || "[no title]"}</Link>
            </h3>
            <div className={css.proposalDetails}>
              <Link to={"/dao/" + dao.address + "/proposal/" + proposal.id}>
                <CommentCount shortname={process.env.DISQUS_SITE} config={disqusConfig} />
              </Link>
            </div>

            <TransferDetails proposal={proposal} dao={dao} beneficiaryProfile={beneficiaryProfile} />
          </div>

          <div className={css.proposalBottom + " " + css.clearfix}>
            {proposalEnded(proposal) ?
              <div>
                {this.state.preRedeemModalOpen ?
                  <PreTransactionModal
                    actionType={executable && !redeemable ? ActionTypes.Execute : ActionTypes.Redeem}
                    action={executable && !redeemable ? executeProposal.bind(null, dao.address, proposal.id) : redeemProposal.bind(null, dao.address, proposal, currentAccount.address)}
                    beneficiaryProfile={beneficiaryProfile}
                    closeAction={this.closePreRedeemModal.bind(this)}
                    dao={dao}
                    effectText={redemptionsTip}
                    proposal={proposal}
                  /> : ""
                }

                <div className={css.proposalDetails + " " + css.concludedDecisionDetails}>
                  {redeemButton}
                </div>
              </div>
              :
              <PredictionBox
                isPredictingFail={isPredictingFail}
                isPredictingPass={isPredictingPass}
                beneficiaryProfile={beneficiaryProfile}
                currentPrediction={currentAccountPrediction}
                currentStake={currentAccountStakeAmount}
                currentAccountGens={currentAccountGens}
                currentAccountGenStakingAllowance={currentAccountGenStakingAllowance}
                dao={dao}
                proposal={proposal}
                stakeProposal={stakeProposal}
                threshold={threshold}
                approveStakingGens={approveStakingGens}
              />
            }

            {!proposalEnded(proposal) ?
              <VoteBox
                isVotingNo={isVotingNo}
                isVotingYes={isVotingYes}
                currentVote={currentAccountVote}
                currentAccountAddress={currentAccount.address}
                currentAccountReputation={currentAccount.reputation}
                dao={dao}
                proposal={proposal}
                voteOnProposal={voteOnProposal}
              />
              : proposalPassed(proposal) ?
                <div className={css.decidedProposal}>
                  <div className={css.result}>
                    <div><img src="/assets/images/Icon/Passed.svg" /></div>
                  </div>
                </div>
                : proposalFailed(proposal) ?
                  <div className={css.decidedProposal}>
                    <div className={css.result}>
                      <div><img src="/assets/images/Icon/Failed.svg" /></div>
                    </div>
                  </div>
                  : ""
              }
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
  //  TODO: add logic for when props.currentAccountAddress is undefined
  const arc = getArc()
  let accountState: Observable<IMemberState|undefined>
  if (props.currentAccountAddress) {
    accountState =  arc.dao(props.dao.address).member(props.currentAccountAddress).state  // the current account as member of the DAO
  } else {
    of(null)

  }
  const observable = combineLatest(
    arc.dao(props.dao.address).proposal(props.proposalId).state, // the list of pre-boosted proposals
    accountState,
    // TODO: filter by beneficiary - see https://github.com/daostack/subgraph/issues/60
    // arc.proposal(props.proposalId).rewards({ beneficiary: props.currentAccountAddress})
    arc.dao(props.dao.address).proposal(props.proposalId).rewards({}),
    arc.dao(props.dao.address).proposal(props.proposalId).stakes({ staker: props.currentAccountAddress}),
    // TODO: filter by voter once that is implemented - see https://github.com/daostack/subgraph/issues/67
    // arc.proposal(props.proposalId).votes({ voter: props.currentAccountAddress})
    arc.dao(props.dao.address).proposal(props.proposalId).votes()
  )
  return <Subscribe observable={observable}>{
    (state: IObservableState<[IProposalState, IMemberState, IRewardState[], IStake[], IVote[]]>): any => {
      if (state.isLoading) {
        return <div>Loading proposal</div>
      } else if (state.error) {
        return <div>{ state.error.message }</div>
      } else {
        const proposal = state.data[0]
        const rewards = state.data[2]
        const stakes = state.data[3]
        const votes = state.data[4]
        return <ConnectedProposalContainer
          currentAccount={state.data[1]}
          proposal={proposal}
          dao={props.dao}
          rewardsForCurrentUser={rewards}
          stakesOfCurrentUser={stakes}
          votesOfCurrentUser={votes}
          />
      }
    }
  }</Subscribe>
}
