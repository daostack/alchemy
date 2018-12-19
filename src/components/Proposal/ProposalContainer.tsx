import * as classNames from "classnames";
import { CommentCount } from 'disqus-react';
import * as moment from "moment";
import { denormalize } from "normalizr";
import Tooltip from 'rc-tooltip';
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import * as web3Actions from "actions/web3Actions";
import { IRootState } from "reducers";
import { IAccountState, IDaoState, IRedemptionState, IStakeState, IVoteState, TransactionStates, VoteOptions, closingTime, newAccount } from "reducers/arcReducer";
import { IProfileState } from "reducers/profilesReducer";
import { isStakePending, isVotePending, isRedeemPending } from "selectors/operations";
import * as schemas from "schemas";

import AccountProfileName from "components/Account/AccountProfileName";
import AccountPopupContainer from "components/Account/AccountPopupContainer";
import ReputationView from "components/Account/ReputationView";
import RewardsString from "components/Proposal/RewardsString";
import { default as PreTransactionModal, ActionTypes } from "components/Shared/PreTransactionModal";
import PredictionBox from "./PredictionBox";
import VoteBox from "./VoteBox";

import * as css from "./Proposal.scss";
import { proposalEnded, proposalFailed, proposalPassed } from "reducers/arcReducer";

import { arc } from "arc";
import Subscribe, { IObservableState } from "components/Shared/Subscribe"
import { IDAOState, IProposalState, ProposalStage } from '@daostack/client'

interface IStateProps {
  beneficiaryRedemptions: IRedemptionState;
  beneficiaryProfile?: IProfileState;
  creatorProfile?: IProfileState;
  currentAccount: IAccountState;
  currentAccountGens: number;
  currentAccountGenStakingAllowance: number;
  currentRedemptions: IRedemptionState;
  currentStake: IStakeState;
  currentVote: IVoteState;
  dao: IDAOState;
  proposal: IProposalState;
  isVotingYes: boolean;
  isVotingNo: boolean;
  isPredictingPass: boolean;
  isPredictingFail: boolean;
  isRedeemPending: boolean;
  threshold: number;
}

const mapStateToProps = (state: IRootState, ownProps: any): IStateProps => {
  // const proposal = state.arc.proposals[ownProps.proposalId];
  const proposal = ownProps.proposal
  const currentRedemptions = state.arc.redemptions[`${proposal.id}-${state.web3.ethAccountAddress}`];
  const beneficiaryRedemptions = state.arc.redemptions[`${ownProps.proposalId}-${proposal.beneficiary}`];
  const currentStake = state.arc.stakes[`${ownProps.proposalId}-${state.web3.ethAccountAddress}`];
  const currentVote = state.arc.votes[`${ownProps.proposalId}-${state.web3.ethAccountAddress}`];
  const dao = ownProps.dao
  // const dao = denormalize(state.arc.daos[proposal.dao.address], schemas.daoSchema, state.arc) as IDaoState;
  // TODO: get the threshold from somewhere!
  // const threshold = dao.currentThresholdToBoost;
  const threshold = 12345

  let currentAccount = denormalize(state.arc.accounts[`${state.web3.ethAccountAddress}-${proposal.daoAvatarAddress}`], schemas.accountSchema, state.arc) as IAccountState;
  if (!currentAccount) {
    currentAccount = newAccount(proposal.daoAvatarAddress, state.web3.ethAccountAddress);
  }

  return {
    beneficiaryRedemptions,
    beneficiaryProfile: state.profiles[proposal.beneficiary],
    creatorProfile: state.profiles[proposal.proposer],
    currentAccount,
    currentAccountGens: state.web3.currentAccountGenBalance,
    currentAccountGenStakingAllowance: state.web3.currentAccountGenStakingAllowance,
    currentRedemptions,
    currentStake,
    currentVote,
    dao,
    isVotingYes: isVotePending(proposal.id, VoteOptions.Yes)(state),
    isVotingNo: isVotePending(proposal.id, VoteOptions.No)(state),
    isPredictingPass: isStakePending(proposal.id, VoteOptions.Yes)(state),
    isPredictingFail: isStakePending(proposal.id, VoteOptions.No)(state),
    isRedeemPending: isRedeemPending(proposal.id, state.web3.ethAccountAddress)(state),
    proposal,
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

type IProps = IStateProps & IDispatchProps;

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
      currentRedemptions,
      beneficiaryRedemptions,
      currentStake,
      currentVote,
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
      threshold
    } = this.props;

    // TODO: fix this: get the amount of ETH of the DAO
    const ethBalance = 0
    const genBalance = 0
    const externalTokenBalance = 0

    const beneficiaryHasRewards = beneficiaryRedemptions && (
      beneficiaryRedemptions.beneficiaryReputation ||
      beneficiaryRedemptions.beneficiaryNativeToken ||
      (beneficiaryRedemptions.beneficiaryEth && ethBalance >= beneficiaryRedemptions.beneficiaryEth) ||
      (beneficiaryRedemptions.beneficiaryExternalToken && externalTokenBalance >= beneficiaryRedemptions.beneficiaryExternalToken)
    ) as boolean;

    const accountHasRewards = currentRedemptions && (
      (beneficiaryHasRewards && currentAccount.address === proposal.beneficiary) ||
      currentRedemptions.proposerReputation ||
      currentRedemptions.stakerReputation ||
      currentRedemptions.stakerTokens ||
      currentRedemptions.voterReputation ||
      currentRedemptions.voterTokens ||
      (currentRedemptions.stakerBountyTokens && genBalance >= currentRedemptions.stakerBountyTokens)
    ) as boolean;

    const redeemable = accountHasRewards || beneficiaryHasRewards;

    if (proposal) {
      // TODO: check if the commented lines are represented correctly in the line below
      // const executable = proposalEnded(proposal) && proposal.state !== ProposalStates.Closed && proposal.state !== ProposalStates.Executed;
      const executable = proposalEnded(proposal) && !proposal.executedAt && proposal.stage === ProposalStage.Resolved;
      const proposalClass = classNames({
        [css.proposal]: true,
        // TODO: check if the commented lines are represented correctly in the line below
        // [css.openProposal]: proposal.state == ProposalStates.PreBoosted || proposal.state == ProposalStates.Boosted || proposal.state == ProposalStates.QuietEndingPeriod,
        [css.openProposal]: proposal.stage == ProposalStage.Open || proposal.stage === ProposalStage.Boosted || proposal.stage == ProposalStage.QuietEndingPeriod,
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

      let currentAccountVote = 0, currentAccountPrediction = 0, currentAccountStakeAmount = 0, redemptionsTip: JSX.Element = null;

      if (currentVote) {
        currentAccountVote = currentVote.voteOption;
      }

      if (currentStake) {
        currentAccountPrediction = currentStake.prediction;
        currentAccountStakeAmount = currentStake.stakeAmount;
      }

      const redeemRewards = classNames({
        [css.redeemRewards]: true,
        [css.pending]: isRedeemPending,
        [css.disabled]: !redeemable && !executable
      });

      redemptionsTip =
        <div>
          {beneficiaryHasRewards || (beneficiaryRedemptions && beneficiaryRedemptions.beneficiaryEth) || (beneficiaryRedemptions && beneficiaryRedemptions.beneficiaryExternalToken) ?
            <div>
              <strong>
                {currentAccount.address === proposal.beneficiary ? 'As the' : 'The'} beneficiary of the proposal {currentAccount.address === proposal.beneficiary ? 'you ' : ''}will receive:
              </strong>
              <ul>
                {beneficiaryRedemptions.beneficiaryEth ?
                  <li>
                    {beneficiaryRedemptions.beneficiaryEth} ETH
                    {ethBalance < beneficiaryRedemptions.beneficiaryEth ? " (Insufficient funds in DAO)" : ""}
                  </li> : ""
                }
                {beneficiaryRedemptions.beneficiaryExternalToken ?
                  <li>
                    {beneficiaryRedemptions.beneficiaryExternalToken} {dao.externalTokenSymbol}
                    {externalTokenBalance < beneficiaryRedemptions.beneficiaryExternalToken ? " (Insufficient funds in DAO)" : ""}
                  </li> : ""
                }
                {beneficiaryRedemptions.beneficiaryReputation ? <li><ReputationView reputation={beneficiaryRedemptions.beneficiaryReputation} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li> : ""}
              </ul>
            </div> : ""
          }
          {currentRedemptions ?
            <React.Fragment>
              {currentRedemptions.proposerReputation ?
                <div>
                  <strong>For creating the proposal you will receive:</strong>
                  <ul>
                    <li><ReputationView reputation={currentRedemptions.proposerReputation} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li>
                  </ul>
                </div> : ""
              }
              {currentRedemptions.voterReputation || currentRedemptions.voterTokens ?
                <div>
                  <strong>For voting on the proposal you will receive:</strong>
                  <ul>
                    {currentRedemptions.voterReputation ? <li><ReputationView reputation={currentRedemptions.voterReputation} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li> : ""}
                    {currentRedemptions.voterTokens ? <li>{currentRedemptions.voterTokens} GEN</li> : ""}
                  </ul>
                </div> : ""
              }
              {currentRedemptions.stakerTokens || currentRedemptions.stakerBountyTokens || currentRedemptions.stakerReputation ?
                <div>
                  <strong>For staking on the proposal you will receive:</strong>
                  <ul>
                    {currentRedemptions.stakerTokens ? <li>{currentRedemptions.stakerTokens} GEN</li> : ""}
                    {currentRedemptions.stakerBountyTokens ?
                      <li>
                        {currentRedemptions.stakerBountyTokens} GEN bounty
                        {genBalance < currentRedemptions.stakerBountyTokens ? " (Insufficient funds in DAO)" : ""}
                      </li> : ""
                    }
                    {currentRedemptions.stakerReputation ? <li><ReputationView reputation={currentRedemptions.stakerReputation} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li> : ""}
                  </ul>
                </div> : ""
              }
            </React.Fragment>
            : ''
          }
          {!currentRedemptions && !beneficiaryHasRewards && executable ?
            <span>Executing a proposal ensures that the target of the proposal receives their reward or punishment.</span>
            : ''
          }
          {isRedeemPending ? <strong><i>Warning: Redeeming for this proposal is already in progress</i></strong> : ''}
        </div>;

      const redeemButton = (currentRedemptions || beneficiaryHasRewards || executable ?
        <Tooltip placement="left" trigger={["hover"]} overlay={redemptionsTip}>
          <button
            style={{ whiteSpace: 'nowrap' }}
            disabled={false}
            className={redeemRewards}
            onClick={this.handleClickRedeem.bind(this)}
          >
            {
              isRedeemPending ?
                'Redeem in progress' :
                beneficiaryHasRewards && !accountHasRewards ?
                  'Redeem for beneficiary' :
                  currentRedemptions ?
                    'Redeem' :
                    'Execute'
            }
            <img src="/assets/images/Icon/Loading-black.svg" />
          </button>
        </Tooltip>
        : "");

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
          <div className={css.proposalInfo}>
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
                        <a href="https://docs.google.com/document/d/1LMe0S4ZFWELws1-kd-6tlFmXnlnX9kfVXUNzmcmXs6U/edit?usp=drivesdk" target='_blank'>View the Genesis Protocol</a>
                      </div>
                    </div>
                  </strong>
                  : !proposalEnded(proposal) ?
                    `${closingTime(proposal).isAfter(moment()) ? 'CLOSES' : 'CLOSED'} ${closingTime(proposal).fromNow().toUpperCase()}`
                    : " "
                }
              </span>
              <Link to={"/dao/" + dao.address + "/proposal/" + proposal.id} data-test-id="proposal-title">{proposal.title}</Link>
            </h3>
            <div className={css.transferDetails}>
              <span className={css.transferType}>Transfer of <RewardsString proposal={proposal} dao={dao} /></span>
              <strong className={css.transferAmount}></strong>
              <img src="/assets/images/Icon/Transfer.svg" />

              <AccountPopupContainer accountAddress={proposal.beneficiary} dao={dao} />
              <AccountProfileName accountProfile={beneficiaryProfile} daoAvatarAddress={dao.address} />
            </div>
          </div>
          <div>
            <div className={css.proposalDetails}>
              <div className={css.createdBy}>
                CREATED BY
                <AccountPopupContainer accountAddress={proposal.proposer} dao={dao}
                />
                <AccountProfileName accountProfile={creatorProfile} daoAvatarAddress={dao.address} />
                &nbsp; ON {submittedTime.format("MMM DD, YYYY")}
              </div>
              <Link to={"/dao/" + dao.address + "/proposal/" + proposal.id}>
                <CommentCount shortname={process.env.DISQUS_SITE} config={disqusConfig} />
              </Link>
              <a href={proposal.description} target="_blank" className={css.viewProposal}>
                <img src="/assets/images/Icon/View.svg" /> <span>View proposal</span>
              </a>
            </div>
            {proposalEnded(proposal) ?
              <div>
                {this.state.preRedeemModalOpen ?
                  <PreTransactionModal
                    actionType={executable && !redeemable ? ActionTypes.Execute : ActionTypes.Redeem}
                    action={executable && !redeemable ? executeProposal.bind(null, dao.address, proposal.id) : redeemProposal.bind(null, dao.address, proposal, currentAccount.address)}
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
          </div>
        </div>
      );
    } else {
      return (<div>Loading... </div>);
    }
  }
}

export const ConnectedProposalContainer = connect(mapStateToProps, mapDispatchToProps)(ProposalContainer);

export default (props: { proposalId: string}) =>
  <Subscribe observable={arc.proposal(props.proposalId).state}>{(state: IObservableState<IProposalState>) => {
      const proposal = state.data
      if (proposal) {
        return <Subscribe observable={proposal.dao.state} >
            {(state: IObservableState<IProposalState>) => {
              const dao = state.data
              if (dao) {
                return <ConnectedProposalContainer proposal={proposal} dao={dao} />
              } else {
                return <div>Loading...</div>
              }
            }
          }</Subscribe>
      } else if (state.error) {
        console.log(state.error)
        return <div>{ state.error.message }</div>
      } else {
        return <div>Loading...</div>
      }
    }
  }</Subscribe>
