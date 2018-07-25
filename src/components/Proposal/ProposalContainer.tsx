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
import { isStakePending, isVotePending } from "selectors/operations";
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
  currentStake: IStakeState;
  currentVote: IVoteState;
  dao?: IDaoState;
  proposal?: IProposalState;
  isVotingYes: boolean;
  isVotingNo: boolean;
  isPredictingPass: boolean;
  isPredictingFail: boolean;
}

const mapStateToProps = (state: IRootState, ownProps: any): IStateProps => {
  const currentRedemptions = state.arc.redemptions[`${ownProps.proposalId}-${state.web3.ethAccountAddress}`];
  const currentStake = state.arc.stakes[`${ownProps.proposalId}-${state.web3.ethAccountAddress}`];
  const currentVote = state.arc.votes[`${ownProps.proposalId}-${state.web3.ethAccountAddress}`];
  const proposal = state.arc.proposals[ownProps.proposalId];
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
    currentStake,
    currentVote,
    dao,
    proposal,
    isVotingYes: isVotePending(proposal.proposalId, VoteOptions.Yes)(state),
    isVotingNo: isVotePending(proposal.proposalId, VoteOptions.No)(state),
    isPredictingPass: isStakePending(proposal.proposalId, VoteOptions.Yes)(state),
    isPredictingFail: isStakePending(proposal.proposalId, VoteOptions.No)(state),
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
      isVotingYes
    } = this.props;

    const beneficiaryHasRewards = currentRedemptions && (
      currentRedemptions.beneficiaryReputation ||
      currentRedemptions.beneficiaryNativeToken ||
      (currentRedemptions.beneficiaryEth && dao.ethCount >= currentRedemptions.beneficiaryEth)
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
        [css.redeemable]: redeemable,
        [css.unconfirmedProposal]: proposal.transactionState == TransactionStates.Unconfirmed,
      });

      const redeemRewards = classNames({
        [css.redeemRewards]: true,
        [css.disabled]: !redeemable && !executable,
      });

      const submittedTime = moment.unix(proposal.submittedTime);

      // Calculate reputation percentages
      const totalReputation = proposal.state == ProposalStates.Executed ? proposal.reputationWhenExecuted : dao.reputationCount;
      const yesPercentage = totalReputation ? Math.round(proposal.votesYes / totalReputation * 100) : 0;
      const noPercentage = totalReputation ? Math.round(proposal.votesNo / totalReputation * 100) : 0;
      const passedByDecision = totalReputation ? (proposal.votesYes / totalReputation) > 0.5 : false;
      const failedByDecision = totalReputation ? (proposal.votesNo / totalReputation) > 0.5 : false;

      let currentAccountVote = 0, currentAccountPrediction = 0, currentAccountStakeAmount = 0,
          currentAccountStakeState = TransactionStates.Confirmed, currentAccountVoteState = TransactionStates.Confirmed,
          redemptionsTip: JSX.Element = null;

      if (currentVote) {
        currentAccountVoteState = currentVote.transactionState;
        currentAccountVote = currentVote.voteOption;
      }

      if (currentStake) {
        currentAccountPrediction = currentStake.prediction;
        currentAccountStakeAmount = currentStake.stakeAmount;
        currentAccountStakeState = currentStake.transactionState;
      }

      if (currentRedemptions) {
        redemptionsTip =
          <div>
            {currentRedemptions.beneficiaryEth || currentRedemptions.beneficiaryReputation ?
              <div>
                <strong>
                  {currentAccount.address === proposal.beneficiaryAddress ? 'As the' : 'The'} beneficiary of the proposal {currentAccount.address === proposal.beneficiaryAddress ? 'you ' : ''}will receive:
                </strong>
                <ul>
                  {currentRedemptions.beneficiaryEth ?
                    <li>
                      {currentRedemptions.beneficiaryEth} ETH
                      {dao.ethCount < currentRedemptions.beneficiaryEth ? " (Insufficient funds in DAO)" : ""}
                    </li> : ""
                  }
                  {currentRedemptions.beneficiaryReputation ? <li><ReputationView reputation={currentRedemptions.beneficiaryReputation} totalReputation={dao.reputationCount} daoName={dao.name}/></li> : ""}
                </ul>
              </div> : ""
            }
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
          </div>;
      } else if (executable) {
        redemptionsTip = <span>Executing a proposal ensures that the target of the proposal receives their reward or punishment.</span>;
      }

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
      const rewardsString = <strong>{rewards.reduce((acc, v) => <React.Fragment>{acc} <em>and</em> {v}</React.Fragment>, '')}</strong>;

      const styles = {
        forBar: {
          width: yesPercentage + "%",
        },
        againstBar: {
          width: noPercentage + "%",
        },
      };

      const redeemButton = (
        <button
          style={{whiteSpace: 'nowrap'}}
          disabled={!redeemable && !executable}
          className={redeemRewards}
          onClick={this.handleClickRedeem.bind(this)}
        >
          {
            beneficiaryHasRewards && !accountHasRewards ?
              'Redeem for beneficiary' :
            accountHasRewards || currentRedemptions ?
              'Redeem' :
              'Execute'
          }
        </button>
      )

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
              transactionState={currentAccountVoteState}
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
                      <span className={css.forLabel}>{proposal.votesYes} ({yesPercentage}%)</span>
                      <div className={css.graph}>
                        <div className={css.forBar} style={styles.forBar}></div>
                        <div className={css.againstBar} style={styles.againstBar}></div>
                        <div className={css.divider}></div>
                      </div>
                      <span className={css.againstLabel}>{proposal.votesNo} ({noPercentage}%)</span>
                  </div>
                </div>
              :  proposalFailed(proposal) ?
                <div className="css.clearfix">
                  <div className={css.proposalFailInfo}>
                    <strong className={css.failedBy}>FAILED</strong> {failedByDecision ? "BY DECISION" : "BY TIMEOUT"} ON {closingTime(proposal).format("MMM DD, YYYY")}
                  </div>
                  <div className={css.decisionGraph}>
                      <span className={css.forLabel}>{proposal.votesYes} ({yesPercentage}%)</span>
                      <div className={css.graph}>
                        <div className={css.forBar} style={styles.forBar}></div>
                        <div className={css.againstBar} style={styles.againstBar}></div>
                        <div className={css.divider}></div>
                      </div>
                      <span className={css.againstLabel}>{proposal.votesNo} ({noPercentage}%)</span>
                  </div>
                </div>
              : ""
            }
            <h3>
              <span>
                { !proposalEnded(proposal) ?
                  `${closingTime(proposal).isAfter(moment()) ? 'CLOSES' : 'CLOSED'} ${closingTime(proposal).fromNow().toUpperCase()}`
                  : ""
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
          { !proposalEnded(proposal) && (proposal.state == ProposalStates.Boosted || proposal.state == ProposalStates.QuietEndingPeriod) ?
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
                  transactionState={currentAccountStakeState}
                />
              </div>
            : !proposalEnded(proposal) && proposal.state == ProposalStates.PreBoosted ?
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
                  transactionState={currentAccountStakeState}
                />
              </div>
            : proposalEnded(proposal) ?
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
                  { currentRedemptions || executable ?
                      <Tooltip placement="left" trigger={["hover"]} overlay={redemptionsTip}>
                        {redeemButton}
                      </Tooltip>
                    : ''
                  }
                  <a href={proposal.description} target="_blank" className={css.viewProposal}>
                    <img src="/assets/images/Icon/View.svg"/> <span>View proposal</span>
                  </a>
                </div>
              </div>
            : ""

          }
        </div>
      );
    } else {
      return (<div>Loading... </div>);
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProposalContainer);
