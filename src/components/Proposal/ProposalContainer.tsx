import * as classNames from "classnames";
import * as moment from "moment";
import Tooltip from 'rc-tooltip';
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import * as web3Actions from "actions/web3Actions";
import { IRootState } from "reducers";
import { IDaoState, IProposalState, ProposalStates, IRedemptionState, TransactionStates, VoteOptions, closingTime } from "reducers/arcReducer";
import { isStakePending, isVotePending } from "selectors/operations";

import AccountPopupContainer from "components/Account/AccountPopupContainer";
import ReputationView from "components/Account/ReputationView";
import { default as PreTransactionModal, ActionTypes } from "components/Shared/PreTransactionModal";
import PredictionBox from "./PredictionBox";
import VoteBox from "./VoteBox";

import * as css from "./Proposal.scss";
import { proposalEnded, proposalFailed, proposalPassed } from "reducers/arcReducer";

interface IStateProps {
  currentAccountAddress: string;
  currentAccountGens: number;
  currentAccountRedemptions?: IRedemptionState;
  currentAccountGenStakingAllowance: number;
  dao?: IDaoState;
  proposal?: IProposalState;
  isVotingYes: boolean;
  isVotingNo: boolean;
  isPredictingPass: boolean;
  isPredictingFail: boolean;
}

const mapStateToProps = (state: IRootState, ownProps: any): IStateProps => {
  const proposal = state.arc.proposals[ownProps.proposalId];
  const dao = proposal && state.arc.daos[proposal.daoAvatarAddress];
  const currentAccountRedemptions = dao && dao.members[state.web3.ethAccountAddress] && dao.members[state.web3.ethAccountAddress].redemptions[proposal.proposalId];
  return {
    currentAccountAddress: state.web3.ethAccountAddress,
    currentAccountGens: state.web3.currentAccountGenBalance,
    currentAccountGenStakingAllowance: state.web3.currentAccountGenStakingAllowance,
    currentAccountRedemptions,
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
  voteOnProposal: typeof arcActions.voteOnProposal;
  stakeProposal: typeof arcActions.stakeProposal;
}

const mapDispatchToProps = {
  approveStakingGens: web3Actions.approveStakingGens,
  redeemProposal: arcActions.redeemProposal,
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
    const { currentAccountAddress, dao, proposal, redeemProposal } = this.props;
    this.setState({ preRedeemModalOpen: true });
  }

  public closePreRedeemModal(event: any) {
    this.setState({ preRedeemModalOpen: false });
  }

  public render() {
    const {
      currentAccountAddress,
      currentAccountGens,
      currentAccountRedemptions,
      currentAccountGenStakingAllowance,
      dao,
      proposal,
      approveStakingGens,
      redeemProposal,
      stakeProposal,
      voteOnProposal,
      isPredictingFail,
      isPredictingPass,
      isVotingNo,
      isVotingYes
    } = this.props;

    const redeemable = currentAccountRedemptions && (
      currentAccountRedemptions.beneficiaryReputation ||
      currentAccountRedemptions.beneficiaryNativeToken ||
      currentAccountRedemptions.proposerReputation ||
      currentAccountRedemptions.stakerReputation ||
      currentAccountRedemptions.stakerTokens ||
      currentAccountRedemptions.voterReputation ||
      currentAccountRedemptions.voterTokens ||
      (currentAccountRedemptions.beneficiaryEth && dao.ethCount >= currentAccountRedemptions.beneficiaryEth) ||
      (currentAccountRedemptions.stakerBountyTokens && dao.genCount >= currentAccountRedemptions.stakerBountyTokens)
    ) as boolean;

    if (proposal) {
      const proposalClass = classNames({
        [css.proposal]: true,
        [css.openProposal]: proposal.state == ProposalStates.PreBoosted || proposal.state == ProposalStates.Boosted,
        [css.failedProposal]: proposalFailed(proposal),
        [css.passedProposal]: proposalPassed(proposal),
        [css.redeemable]: redeemable,
        [css.unconfirmedProposal]: proposal.transactionState == TransactionStates.Unconfirmed,
      });

      const redeemRewards = classNames({
        [css.redeemRewards]: true,
        [css.disabled]: !redeemable,
      });

      const submittedTime = moment.unix(proposal.submittedTime);

      // Calculate reputation percentages
      const totalReputation = proposal.state == ProposalStates.Executed ? proposal.reputationWhenExecuted : dao.reputationCount;
      const yesPercentage = totalReputation ? Math.round(proposal.votesYes / totalReputation * 100) : 0;
      const noPercentage = totalReputation ? Math.round(proposal.votesNo / totalReputation * 100) : 0;
      const passedByDecision = totalReputation ? (proposal.votesYes / totalReputation) > 0.5 : false;
      const failedByDecision = totalReputation ? (proposal.votesNo / totalReputation) > 0.5 : false;

      const daoAccount = dao.members[currentAccountAddress];
      let currentAccountReputation = 0, currentAccountVote = 0, currentAccountPrediction = 0, currentAccountStake = 0,
          currentAccountStakeState = TransactionStates.Confirmed, currentAccountVoteState = TransactionStates.Confirmed, redemptionsTip: JSX.Element = null;
      if (daoAccount) {
        currentAccountReputation = daoAccount.reputation;

        if (daoAccount.votes[proposal.proposalId]) {
          currentAccountVote = daoAccount.votes[proposal.proposalId].vote;
          currentAccountVoteState = daoAccount.votes[proposal.proposalId].transactionState;
        }

        if (daoAccount.stakes[proposal.proposalId]) {
          currentAccountPrediction =  daoAccount.stakes[proposal.proposalId].prediction;
          currentAccountStake = daoAccount.stakes[proposal.proposalId].stake;
          currentAccountStakeState = daoAccount.stakes[proposal.proposalId].transactionState;
        }
      }

      if (currentAccountRedemptions) {
        redemptionsTip =
          <div>
            {currentAccountRedemptions.beneficiaryEth || currentAccountRedemptions.beneficiaryReputation ?
              <div>
                <strong>As beneficiary of the proposal you will receive: </strong>
                <ul>
                  {currentAccountRedemptions.beneficiaryEth ?
                    <li>
                      {currentAccountRedemptions.beneficiaryEth} ETH
                      {dao.ethCount < currentAccountRedemptions.beneficiaryEth ? " (Insufficient funds in DAO)" : ""}
                    </li> : ""
                  }
                  {currentAccountRedemptions.beneficiaryReputation ? <li><ReputationView reputation={currentAccountRedemptions.beneficiaryReputation} totalReputation={dao.reputationCount} daoName={dao.name}/></li> : ""}
                </ul>
              </div> : ""
            }
            {currentAccountRedemptions.proposerReputation ?
              <div>
                <strong>For creating the proposal you will receive:</strong>
                <ul>
                  <li><ReputationView reputation={currentAccountRedemptions.proposerReputation} totalReputation={dao.reputationCount} daoName={dao.name}/></li>
                </ul>
              </div> : ""
            }
            {currentAccountRedemptions.voterReputation || currentAccountRedemptions.voterTokens ?
              <div>
                <strong>For voting on the proposal you will receive:</strong>
                <ul>
                  {currentAccountRedemptions.voterReputation ? <li><ReputationView reputation={currentAccountRedemptions.voterReputation} totalReputation={dao.reputationCount} daoName={dao.name}/></li> : ""}
                  {currentAccountRedemptions.voterTokens ? <li>{currentAccountRedemptions.voterTokens} GEN</li> : ""}
                </ul>
              </div> : ""
            }
            {currentAccountRedemptions.stakerTokens || currentAccountRedemptions.stakerBountyTokens || currentAccountRedemptions.stakerReputation ?
              <div>
                <strong>For staking on the proposal you will receive:</strong>
                <ul>
                  {currentAccountRedemptions.stakerTokens ? <li>{currentAccountRedemptions.stakerTokens} GEN</li> : ""}
                  {currentAccountRedemptions.stakerBountyTokens ?
                    <li>
                      {currentAccountRedemptions.stakerBountyTokens} GEN bounty
                      {dao.genCount < currentAccountRedemptions.stakerBountyTokens ? " (Insufficient funds in DAO)" : ""}
                    </li> : ""
                  }
                  {currentAccountRedemptions.stakerReputation ? <li><ReputationView reputation={currentAccountRedemptions.stakerReputation} totalReputation={dao.reputationCount} daoName={dao.name}/></li> : ""}
                </ul>
              </div> : ""
            }
          </div>;
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

      return (
        <div className={proposalClass + " " + css.clearfix}>
          { !proposalEnded(proposal) ?
            <VoteBox
              isVotingNo={isVotingNo}
              isVotingYes={isVotingYes}
              currentVote={currentAccountVote}
              currentAccountAddress={currentAccountAddress}
              currentAccountReputation={currentAccountReputation}
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
          { !proposalEnded(proposal) && proposal.state == ProposalStates.Boosted ?
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
                  currentStake={currentAccountStake}
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
                  currentStake={currentAccountStake}
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
                    actionType={ActionTypes.Redeem}
                    action={redeemProposal.bind(null, dao.avatarAddress, proposal, currentAccountAddress)}
                    closeAction={this.closePreRedeemModal.bind(this)}
                    dao={dao}
                    effectText={redemptionsTip}
                    proposal={proposal}
                  /> : ""
                }

                <div className={css.proposalDetails + " " + css.concludedDecisionDetails}>
                  { currentAccountRedemptions ?
                      <Tooltip placement="left" trigger={["hover"]} overlay={redemptionsTip}>
                        <button disabled={!redeemable} className={redeemRewards} onClick={this.handleClickRedeem.bind(this)}>Redeem</button>
                      </Tooltip>
                    :
                      <button className={css.redeemRewards} onClick={this.handleClickRedeem.bind(this)}>
                        {proposalPassed(proposal) ? 'Redeem for Beneficiary' : 'Execute'}
                      </button>
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
