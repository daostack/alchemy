import * as classNames from "classnames";
import * as moment from "moment";
import { denormalize } from "normalizr";
import Tooltip from 'rc-tooltip';
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import * as web3Actions from "actions/web3Actions";
import { IRootState } from "reducers";
import { IAccountState, IDaoState, IProposalState, ProposalStates, IRedemptionState, IStakeState, IVoteState, TransactionStates, VoteOptions, closingTime, newAccount } from "reducers/arcReducer";
import { isStakePending, isVotePending, isRedeemPending } from "selectors/operations";
import * as schemas from "schemas";

import AccountPopupContainer from "components/Account/AccountPopupContainer";
import ReputationView from "components/Account/ReputationView";
import { default as PreTransactionModal, ActionTypes } from "components/Shared/PreTransactionModal";
import PredictionBox from "./PredictionBox";
import VoteBox from "./VoteBox";

import * as css from "./Proposal.scss";
import { proposalEnded, proposalFailed, proposalPassed } from "reducers/arcReducer";

interface IStateProps {
  currentAccount: IAccountState;
  currentAccountGens: number;
  currentAccountGenStakingAllowance: number;
  currentRedemptions: IRedemptionState;
  beneficiaryRedemptions: IRedemptionState;
  currentStake: IStakeState;
  currentVote: IVoteState;
  dao?: IDaoState;
  proposal?: IProposalState;
  isVotingYes: boolean;
  isVotingNo: boolean;
  isPredictingPass: boolean;
  isPredictingFail: boolean;
  isRedeemPending: boolean;
}

const mapStateToProps = (state: IRootState, ownProps: any): IStateProps => {
  const proposal = state.arc.proposals[ownProps.proposalId];
  const currentRedemptions = state.arc.redemptions[`${ownProps.proposalId}-${state.web3.ethAccountAddress}`];
  const beneficiaryRedemptions = state.arc.redemptions[`${ownProps.proposalId}-${proposal.beneficiaryAddress}`];
  const currentStake = state.arc.stakes[`${ownProps.proposalId}-${state.web3.ethAccountAddress}`];
  const currentVote = state.arc.votes[`${ownProps.proposalId}-${state.web3.ethAccountAddress}`];
  const dao = denormalize(state.arc.daos[proposal.daoAvatarAddress], schemas.daoSchema, state.arc) as IDaoState;

  let currentAccount = denormalize(state.arc.accounts[`${state.web3.ethAccountAddress}-${proposal.daoAvatarAddress}`], schemas.accountSchema, state.arc) as IAccountState;
  if (!currentAccount) {
    currentAccount = newAccount(proposal.daoAvatarAddress, state.web3.ethAccountAddress);
  }

  return {
    currentAccount,
    currentAccountGens: state.web3.currentAccountGenBalance,
    currentAccountGenStakingAllowance: state.web3.currentAccountGenStakingAllowance,
    currentRedemptions,
    beneficiaryRedemptions,
    currentStake,
    currentVote,
    dao,
    proposal,
    isVotingYes: isVotePending(proposal.proposalId, VoteOptions.Yes)(state),
    isVotingNo: isVotePending(proposal.proposalId, VoteOptions.No)(state),
    isPredictingPass: isStakePending(proposal.proposalId, VoteOptions.Yes)(state),
    isPredictingFail: isStakePending(proposal.proposalId, VoteOptions.No)(state),
    isRedeemPending: isRedeemPending(proposal.proposalId, state.web3.ethAccountAddress)(state)
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
      isRedeemPending
    } = this.props;

    const beneficiaryHasRewards = beneficiaryRedemptions && (
      beneficiaryRedemptions.beneficiaryReputation ||
      beneficiaryRedemptions.beneficiaryNativeToken ||
      (beneficiaryRedemptions.beneficiaryEth && dao.ethCount >= beneficiaryRedemptions.beneficiaryEth)
    ) as boolean;

    const accountHasRewards = currentRedemptions && (
      (beneficiaryHasRewards && currentAccount.address === proposal.beneficiaryAddress) ||
      currentRedemptions.proposerReputation ||
      currentRedemptions.stakerReputation ||
      currentRedemptions.stakerTokens ||
      currentRedemptions.voterReputation ||
      currentRedemptions.voterTokens ||
      (currentRedemptions.stakerBountyTokens && dao.genCount >= currentRedemptions.stakerBountyTokens)
    ) as boolean;

    const redeemable = accountHasRewards || beneficiaryHasRewards;

    const executable = proposalEnded(proposal) && proposal.state !== ProposalStates.Closed && proposal.state !== ProposalStates.Executed;

    if (proposal) {
      const proposalClass = classNames({
        [css.proposal]: true,
        [css.openProposal]: proposal.state == ProposalStates.PreBoosted || proposal.state == ProposalStates.Boosted || proposal.state == ProposalStates.QuietEndingPeriod,
        [css.failedProposal]: proposalFailed(proposal),
        [css.passedProposal]: proposalPassed(proposal),
        [css.redeemable]: redeemable
      });

      const submittedTime = moment.unix(proposal.submittedTime);

      // Calculate reputation percentages
      const totalReputation = proposal.state == ProposalStates.Executed ? proposal.reputationWhenExecuted : dao.reputationCount;
      const yesPercentage = totalReputation && proposal.votesYes ? Math.max(2, Math.ceil(proposal.votesYes / totalReputation * 100)) : 0;
      const noPercentage = totalReputation && proposal.votesNo ? Math.max(2, Math.ceil(proposal.votesNo / totalReputation * 100)) : 0;
      const passedByDecision = totalReputation ? (proposal.votesYes / totalReputation) > 0.5 : false;
      const failedByDecision = totalReputation ? (proposal.votesNo / totalReputation) > 0.5 : false;

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
          {beneficiaryHasRewards || (beneficiaryRedemptions && beneficiaryRedemptions.beneficiaryEth) ?
            <div>
              <strong>
                {currentAccount.address === proposal.beneficiaryAddress ? 'As the' : 'The'} beneficiary of the proposal {currentAccount.address === proposal.beneficiaryAddress ? 'you ' : ''}will receive:
              </strong>
              <ul>
                {beneficiaryRedemptions.beneficiaryEth ?
                  <li>
                    {beneficiaryRedemptions.beneficiaryEth} ETH
                    {dao.ethCount < beneficiaryRedemptions.beneficiaryEth ? " (Insufficient funds in DAO)" : ""}
                  </li> : ""
                }
                {beneficiaryRedemptions.beneficiaryReputation ? <li><ReputationView reputation={beneficiaryRedemptions.beneficiaryReputation} totalReputation={dao.reputationCount} daoName={dao.name}/></li> : ""}
              </ul>
            </div> : ""
          }
          {currentRedemptions ?
            <React.Fragment>
              {currentRedemptions.proposerReputation ?
                <div>
                  <strong>For creating the proposal you will receive:</strong>
                  <ul>
                    <li><ReputationView reputation={currentRedemptions.proposerReputation} totalReputation={dao.reputationCount} daoName={dao.name}/></li>
                  </ul>
                </div> : ""
              }
              {currentRedemptions.voterReputation || currentRedemptions.voterTokens ?
                <div>
                  <strong>For voting on the proposal you will receive:</strong>
                  <ul>
                    {currentRedemptions.voterReputation ? <li><ReputationView reputation={currentRedemptions.voterReputation} totalReputation={dao.reputationCount} daoName={dao.name}/></li> : ""}
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
                        {dao.genCount < currentRedemptions.stakerBountyTokens ? " (Insufficient funds in DAO)" : ""}
                      </li> : ""
                    }
                    {currentRedemptions.stakerReputation ? <li><ReputationView reputation={currentRedemptions.stakerReputation} totalReputation={dao.reputationCount} daoName={dao.name}/></li> : ""}
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
            style={{whiteSpace: 'nowrap'}}
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
            <img src="/assets/images/Icon/Loading-black.svg"/>
          </button>
        </Tooltip>
      : "");

      let rewards = [];
      if (proposal.nativeTokenReward) {
        rewards.push(proposal.nativeTokenReward + " " + dao.tokenSymbol);
      }
      if (proposal.reputationChange) {
        rewards.push(
          <ReputationView daoName={dao.name} totalReputation={totalReputation} reputation={proposal.reputationChange}/>
        );
      }
      if (proposal.ethReward) {
        rewards.push(proposal.ethReward + " ETH");
      }
      const rewardsString = <strong>{rewards.reduce((acc, v) => acc == null ? <React.Fragment>{v}</React.Fragment> : <React.Fragment>{acc} <em>and</em> {v}</React.Fragment>, null)}</strong>;

      const styles = {
        forBar: {
          width: yesPercentage + "%",
        },
        againstBar: {
          width: noPercentage + "%",
        },
      };

      return (
        <div className={proposalClass + " " + css.clearfix}>
          { !proposalEnded(proposal) ?
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
                    <div><img src="/assets/images/Icon/Passed.svg"/></div>
                  </div>
              </div>
            : proposalFailed(proposal) ?
              <div className={css.decidedProposal}>
                  <div className={css.result}>
                    <div><img src="/assets/images/Icon/Failed.svg"/></div>
                  </div>
              </div>
            : ""
          }
          <div className={css.proposalInfo}>
            { proposalPassed(proposal) ?
                <div className="css.clearfix">
                  <div className={css.proposalPassInfo}>
                    <strong className={css.passedBy}>PASSED</strong> {passedByDecision ? "BY DECISION" : "BY TIMEOUT"} ON {closingTime(proposal).format("MMM DD, YYYY")}
                  </div>
                  <div className={css.decisionGraph}>
                      <span className={css.forLabel}>{proposal.votesYes.toFixed(2).toLocaleString()} ({yesPercentage}%)</span>
                      <div className={css.graph}>
                        <div className={css.forBar} style={styles.forBar}></div>
                        <div className={css.againstBar} style={styles.againstBar}></div>
                        <div className={css.divider}></div>
                      </div>
                      <span className={css.againstLabel}>{proposal.votesNo.toFixed(2).toLocaleString()} ({noPercentage}%)</span>
                  </div>
                </div>
              :  proposalFailed(proposal) ?
                <div className="css.clearfix">
                  <div className={css.proposalFailInfo}>
                    <strong className={css.failedBy}>FAILED</strong> {failedByDecision ? "BY DECISION" : "BY TIMEOUT"} ON {closingTime(proposal).format("MMM DD, YYYY")}
                  </div>
                  <div className={css.decisionGraph}>
                      <span className={css.forLabel}>{proposal.votesYes.toFixed(2).toLocaleString()} ({yesPercentage}%)</span>
                      <div className={css.graph}>
                        <div className={css.forBar} style={styles.forBar}></div>
                        <div className={css.againstBar} style={styles.againstBar}></div>
                        <div className={css.divider}></div>
                      </div>
                      <span className={css.againstLabel}>{proposal.votesNo.toFixed(2).toLocaleString()} ({noPercentage}%)</span>
                  </div>
                </div>
              : ""
            }
            <h3>
              <span>
                { proposal.state == ProposalStates.QuietEndingPeriod ?
                    <strong>
                      <img src="/assets/images/Icon/Overtime.svg"/> OVERTIME: CLOSES {closingTime(proposal).fromNow().toUpperCase()}
                      <div className={css.help}>
                        <img src="/assets/images/Icon/Help-light.svg"/>
                        <img className={css.hover} src="/assets/images/Icon/Help-light-hover.svg"/>
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
              <Link to={"/dao/" + dao.avatarAddress + "/proposal/" + proposal.proposalId}>{proposal.title}</Link>
            </h3>
            <div className={css.transferDetails}>
              <span className={css.transferType}>Transfer of {rewardsString}</span>
              <strong className={css.transferAmount}></strong>
              <img src="/assets/images/Icon/Transfer.svg"/>

              <AccountPopupContainer
                accountAddress={proposal.beneficiaryAddress}
                daoAvatarAddress={proposal.daoAvatarAddress}
              />
            </div>
          </div>
          <div>
            <div className={css.proposalDetails}>
              <div className={css.createdBy}>
                CREATED BY
                <AccountPopupContainer
                  accountAddress={proposal.proposer}
                  daoAvatarAddress={proposal.daoAvatarAddress}
                />

                ON {submittedTime.format("MMM DD, YYYY")}
              </div>

              <a href={proposal.description} target="_blank" className={css.viewProposal}>
                <img src="/assets/images/Icon/View.svg"/> <span>View proposal</span>
              </a>
            </div>
            { proposalEnded(proposal) ?
              <div>
                {this.state.preRedeemModalOpen ?
                  <PreTransactionModal
                    actionType={executable && !redeemable ? ActionTypes.Execute : ActionTypes.Redeem}
                    action={executable && !redeemable ? executeProposal.bind(null, dao.avatarAddress, proposal.proposalId) : redeemProposal.bind(null, dao.avatarAddress, proposal, currentAccount.address)}
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

export default connect(mapStateToProps, mapDispatchToProps)(ProposalContainer);
