import { Address, IDAOState, IMemberState, IProposalStage, IProposalState, IRewardState, IStake, IVote } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import * as web3Actions from "actions/web3Actions";
import { getArc } from "arc";
import BN = require("bn.js");
import * as classNames from "classnames";
import AccountPopupContainer from "components/Account/AccountPopupContainer";
import AccountProfileName from "components/Account/AccountProfileName";
import Countdown from "components/Shared/Countdown";
import { ActionTypes, default as PreTransactionModal } from "components/Shared/PreTransactionModal";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { CommentCount } from "disqus-react";
import Util, { checkNetworkAndWarn, humanProposalTitle } from "lib/util";
import * as moment from "moment";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { IRootState } from "reducers";
import { closingTime, VoteOptions } from "reducers/arcReducer";
import { proposalEnded, proposalFailed, proposalPassed } from "reducers/arcReducer";
import { IProfileState } from "reducers/profilesReducer";
import { combineLatest, of } from "rxjs";
import { isRedeemPending, isStakePending, isVotePending } from "selectors/operations";
import PredictionBox from "./PredictionBox";
import * as css from "./Proposal.scss";
import RedeemButton from "./RedeemButton";
import RedemptionsTip from "./RedemptionsTip";
import TransferDetails from "./TransferDetails";
import VoteBox from "./VoteBox";

interface IStateProps {
  beneficiaryProfile?: IProfileState;
  creatorProfile?: IProfileState;
  currentAccountAddress: Address;
  currentAccountState: IMemberState;
  currentAccountGens: BN;
  currentAccountGenStakingAllowance: BN;
  daoEthBalance: BN;
  rewardsForCurrentUser: IRewardState[];
  stakesOfCurrentUser: IStake[];
  votesOfCurrentUser: IVote[];
  dao: IDAOState;
  proposal: IProposalState;
  isVotingYes: boolean;
  isVotingNo: boolean;
  isPredictingPass: boolean;
  isPredictingFail: boolean;
  isRedeemPending: boolean;
  threshold: number;
}

interface IContainerProps {
  dao: IDAOState;
  currentAccountAddress: Address;
  currentAccountState: IMemberState;
  currentAccountGens: BN;
  currentAccountGenStakingAllowance: BN;
  daoEthBalance: BN;
  detailView?: boolean;
  proposal: IProposalState;
  rewardsForCurrentUser: IRewardState[];
  stakesOfCurrentUser: IStake[];
  votesOfCurrentUser: IVote[];
}

const mapStateToProps = (state: IRootState, ownProps: IContainerProps): IStateProps => {
  const proposal = ownProps.proposal;
  const dao = ownProps.dao;
  // TODO: get the threshold from the proposals
  // const threshold = dao.currentThresholdToBoost;
  const threshold = ownProps.proposal.confidenceThreshold;

  return {
    beneficiaryProfile: state.profiles[proposal.beneficiary],
    creatorProfile: state.profiles[proposal.proposer],
    currentAccountAddress: ownProps.currentAccountAddress,
    currentAccountState: ownProps.currentAccountState,
    currentAccountGens: ownProps.currentAccountGens,
    currentAccountGenStakingAllowance: ownProps.currentAccountGenStakingAllowance,
    dao,
    daoEthBalance: ownProps.daoEthBalance,
    isVotingYes: isVotePending(proposal.id, VoteOptions.Yes)(state),
    isVotingNo: isVotePending(proposal.id, VoteOptions.No)(state),
    isPredictingPass: isStakePending(proposal.id, VoteOptions.Yes)(state),
    isPredictingFail: isStakePending(proposal.id, VoteOptions.No)(state),
    isRedeemPending: ownProps.currentAccountAddress && isRedeemPending(proposal.id, ownProps.currentAccountAddress)(state),
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
  stakeProposal: typeof arcActions.stakeProposal;
}

const mapDispatchToProps = {
  approveStakingGens: web3Actions.approveStakingGens,
  redeemProposal: arcActions.redeemProposal,
  executeProposal: arcActions.executeProposal,
  stakeProposal: arcActions.stakeProposal,
};

type IProps = IStateProps & IDispatchProps & IContainerProps;

interface IState {
  preRedeemModalOpen: boolean;
  expired: boolean;
}

class ProposalContainer extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      preRedeemModalOpen: false,
      expired: closingTime(props.proposal).isSameOrBefore(moment())
    };
    this.handleClickExecute.bind(this);
    this.handleClickRedeem.bind(this);
    this.countdownEnded.bind(this);
    this.closePreRedeemModal.bind(this);
  }

  public handleClickExecute(event: any) {
    if (!checkNetworkAndWarn()) { return; }
    this.props.executeProposal(this.props.dao.address, this.props.proposal.id);
  }

  public handleClickRedeem(event: any) {
    this.setState({ preRedeemModalOpen: true });
  }

  public closePreRedeemModal(event: any) {
    this.setState({ preRedeemModalOpen: false });
  }

  public countdownEnded() {
    this.setState({ expired: true });
  }

  public render() {
    const {
      beneficiaryProfile,
      creatorProfile,
      currentAccountAddress,
      currentAccountState,
      currentAccountGens,
      currentAccountGenStakingAllowance,
      dao,
      daoEthBalance,
      detailView,
      proposal,
      approveStakingGens,
      redeemProposal,
      executeProposal,
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
        [css.detailView]: detailView,
        [css.clearfix]: detailView,
        [css.proposal]: true,
        [css.openProposal]: proposal.stage === IProposalStage.Queued ||
          proposal.stage === IProposalStage.PreBoosted ||
          proposal.stage === IProposalStage.Boosted ||
          proposal.stage === IProposalStage.QuietEndingPeriod,
        [css.failedProposal]: proposalFailed(proposal),
        [css.passedProposal]: proposalPassed(proposal),
        [css.redeemable]: redeemable
      });

      // const submittedTime = moment.unix(proposal.createdAt);

      // Calculate reputation percentages
      const totalReputation = Util.fromWei(proposal.stage === IProposalStage.Executed ? proposal.totalRepWhenExecuted : dao.reputationTotalSupply);
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
        currentAccount: currentAccountState,
        dao,
        proposal,
        handleClickRedeem: this.handleClickRedeem
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
        [css.invisible]: !proposalEnded(proposal) && !this.state.expired
      });

      return (
        <div className={proposalClass + " " + css.clearfix} data-test-id={"proposal-" + proposal.id}>
          <div className={css.proposalInfo}>
            <h3 className={css.proposalTitleTop}>
              <span data-test-id="proposal-closes-in">
                {proposal.stage === IProposalStage.QuietEndingPeriod ?
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
              <Link to={"/dao/" + dao.address + "/proposal/" + proposal.id} data-test-id="proposal-title">{humanProposalTitle(proposal)}</Link>
            </h3>
            <div className={css.cardTop + " " + css.clearfix}>
              <div className={css.timer}>
                {!proposalEnded(proposal) ?
                    !this.state.expired ?
                      <Countdown toDate={closingTime(proposal)} detailView={detailView} onEnd={this.countdownEnded} /> :
                      <span className={css.closedTime}>
                        {proposal.stage === IProposalStage.Queued ? "Expired" :
                         proposal.stage === IProposalStage.PreBoosted ? "Ready to Boost" : // TODO: handle case of below threshold
                         "Closed"}&nbsp;
                         {closingTime(proposal).format("MMM D, YYYY")}
                      </span>
                    : " "
                }
              </div>

              {!this.props.detailView ?
                <div className={executeButtonClass}>
                  {proposal.stage === IProposalStage.PreBoosted ?
                    <button className={css.boostProposal} onClick={this.handleClickExecute}>
                      <img src="/assets/images/Icon/boost.svg"/>
                      <span> Boost</span>
                    </button>
                    :
                    <button className={css.executeProposal} onClick={this.handleClickExecute}>
                      <img src="/assets/images/Icon/execute.svg"/>
                      <span> Execute</span>
                    </button>
                  }
                </div>
                : " "
              }
            </div>

            {proposalPassed(proposal) ?
              <div className="css.clearfix">
                <div className={css.proposalPassInfo}>
                  <strong className={css.passedBy}>PASSED</strong> {passedByDecision ? "BY DECISION" : "BY TIMEOUT"} ON {closingTime(proposal).format("MMM DD, YYYY")}
                </div>
                <div className={css.decisionGraph}>
                  <span className={css.forLabel}>{votesFor.toFixed(2).toLocaleString()} ({yesPercentage}%)</span>
                  <div className={css.graph}>
                    <div className={css.forBar} style={styles.forBar}></div>
                    <div className={css.againstBar} style={styles.againstBar}></div>
                    <div className={css.divider}></div>
                  </div>
                  <span className={css.againstLabel}>{votesAgainst.toFixed(2).toLocaleString()} ({noPercentage}%)</span>
                </div>
              </div>
              : proposalFailed(proposal) ?
                <div className="css.clearfix">
                  <div className={css.proposalFailInfo}>
                    <strong className={css.failedBy}>FAILED</strong> {failedByDecision ? "BY DECISION" : "BY TIMEOUT"} ON {closingTime(proposal).format("MMM DD, YYYY")}
                  </div>
                  <div className={css.decisionGraph}>
                    <span className={css.forLabel}>{votesFor.toFixed(2).toLocaleString()} ({yesPercentage}%)</span>
                    <div className={css.graph}>
                      <div className={css.forBar} style={styles.forBar}></div>
                      <div className={css.againstBar} style={styles.againstBar}></div>
                      <div className={css.divider}></div>
                    </div>
                    <span className={css.againstLabel}>{votesAgainst.toFixed(2).toLocaleString()} ({noPercentage}%)</span>
                  </div>
                </div>
                : ""
            }
            <div className={css.createdBy}>
              <AccountPopupContainer accountAddress={proposal.proposer} dao={dao} detailView={detailView}/>
              <AccountProfileName accountProfile={creatorProfile} daoAvatarAddress={dao.address} detailView={detailView}/>
            </div>
            <div className={css.description}>
              First proposal to test it out.
              I’m glad to be apart and test things out. I’m interested in helping the general public and non-devs more involved in the space and creating DAO’s.
            </div>
            <h3 className={css.proposalTitleBottom}>
              <span data-test-id="proposal-closes-in">
                {proposal.stage === IProposalStage.QuietEndingPeriod ?
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
              <Link to={"/dao/" + dao.address + "/proposal/" + proposal.id} data-test-id="proposal-title">{humanProposalTitle(proposal)}</Link>
            </h3>
            <div className={css.proposalDetails}>
              <Link to={"/dao/" + dao.address + "/proposal/" + proposal.id}>
                <CommentCount shortname={process.env.DISQUS_SITE} config={disqusConfig} />
              </Link>
            </div>
            <TransferDetails proposal={proposal} dao={dao} beneficiaryProfile={beneficiaryProfile} detailView={detailView}/>

            {this.props.detailView ?
              <div className={executeButtonClass}>
                {proposal.stage === IProposalStage.PreBoosted ?
                  <button className={css.boostProposal} onClick={this.handleClickExecute}>
                    <img src="/assets/images/Icon/boost.svg"/>
                    <span> Boost</span>
                  </button>
                  :
                  <button className={css.executeProposal} onClick={this.handleClickExecute}>
                    <img src="/assets/images/Icon/execute.svg"/>
                    <span> Execute</span>
                  </button>
                }
              </div>
              : " "
            }

          </div>

          <div className={css.proposalActions + " " + css.clearfix}>
            {!proposalEnded(proposal) ?
              <VoteBox
                isVotingNo={isVotingNo}
                isVotingYes={isVotingYes}
                currentVote={currentAccountVote}
                currentAccountAddress={currentAccountAddress}
                currentAccountState={currentAccountState}
                dao={dao}
                proposal={proposal}
                detailView={detailView}
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
              {proposalEnded(proposal) ?
                <div>
                  {this.state.preRedeemModalOpen ?
                    <PreTransactionModal
                      actionType={executable && !redeemable ? ActionTypes.Execute : ActionTypes.Redeem}
                      action={executable && !redeemable ? executeProposal.bind(null, dao.address, proposal.id) : redeemProposal.bind(null, dao.address, proposal.id, currentAccountAddress)}
                      beneficiaryProfile={beneficiaryProfile}
                      closeAction={this.closePreRedeemModal}
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
                  threshold={threshold}
                  approveStakingGens={approveStakingGens}
                  detailView={detailView}
                />
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

export default (props: { proposalId: string, dao: IDAOState, currentAccountAddress: Address, detailView?: boolean}) => {

  const arc = getArc();
  const dao = arc.dao(props.dao.address);

  const observable = combineLatest(
    dao.proposal(props.proposalId).state(), // the list of pre-boosted proposals
    props.currentAccountAddress ? dao.member(props.currentAccountAddress).state() : of(null),
    props.currentAccountAddress ? dao.proposal(props.proposalId).rewards({ beneficiary: props.currentAccountAddress}) : of([]),
    props.currentAccountAddress ? dao.proposal(props.proposalId).stakes({ staker: props.currentAccountAddress}) : of([]),
    props.currentAccountAddress ? dao.proposal(props.proposalId).votes({ voter: props.currentAccountAddress }) : of([]),
    props.currentAccountAddress ? arc.GENToken().balanceOf(props.currentAccountAddress) : of(new BN(0)),
    props.currentAccountAddress ? arc.allowance(props.currentAccountAddress) : of(new BN(0)),
    dao.ethBalance()
  );
  return <Subscribe observable={observable}>{
    (state: IObservableState<[IProposalState, IMemberState, IRewardState[], IStake[], IVote[], BN, any, BN]>): any => {
      if (state.isLoading) {
        return <div>Loading proposal...</div>;
      } else if (state.error) {
        return <div>{ state.error.message }</div>;
      } else {
        const proposal = state.data[0];
        const rewards = state.data[2];
        const stakes = state.data[3];
        const votes = state.data[4];
        return <ConnectedProposalContainer
          detailView={props.detailView}
          currentAccountAddress={props.currentAccountAddress}
          currentAccountState={state.data[1]}
          currentAccountGens={state.data[5]}
          currentAccountGenStakingAllowance={state.data[6] ? new BN(state.data[6].amount) : new BN(0)}
          daoEthBalance={state.data[7]}
          proposal={proposal}
          dao={props.dao}
          rewardsForCurrentUser={rewards}
          stakesOfCurrentUser={stakes}
          votesOfCurrentUser={votes}
          />;
      }
    }
  }</Subscribe>;
};
