import * as classNames from "classnames";
import * as moment from "moment";
import Tooltip from 'rc-tooltip';
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import * as web3Actions from "actions/web3Actions";
import { IRootState } from "reducers";
import { IDaoState, IProposalState, ProposalStates, IRedemptionState, TransactionStates, VoteOptions } from "reducers/arcReducer";

import AccountPopupContainer from "components/Account/AccountPopupContainer";
import ReputationView from "components/Account/ReputationView";
import PredictionBox from "./PredictionBox";
import VoteBox from "./VoteBox";

import * as css from "./Proposal.scss";
import { proposalEnded } from "actions/arcActions";

interface IStateProps {
  currentAccountAddress: string;
  currentAccountGens: number;
  currentAccountRedemptions?: IRedemptionState;
  currentAccountGenStakingAllowance: number;
  dao?: IDaoState;
  proposal?: IProposalState;
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

class ProposalContainer extends React.Component<IProps, null> {

  public handleClickRedeem(event: any) {
    const { currentAccountAddress, dao, proposal, redeemProposal } = this.props;
    redeemProposal(dao.avatarAddress, proposal, currentAccountAddress);
  }

  public render() {
    const { currentAccountAddress, currentAccountGens, currentAccountRedemptions, currentAccountGenStakingAllowance, dao, proposal, approveStakingGens, stakeProposal, voteOnProposal } = this.props;

    if (proposal) {
      const proposalClass = classNames({
        [css.proposal]: true,
        [css.openProposal]: proposal.state == ProposalStates.PreBoosted || proposal.state == ProposalStates.Boosted,
        [css.failedProposal]: proposalEnded(proposal) && proposal.winningVote == VoteOptions.No,
        [css.passedProposal]: proposalEnded(proposal) && proposal.winningVote == VoteOptions.Yes,
        [css.redeemable]: !!currentAccountRedemptions,
        [css.unconfirmedProposal]: proposal.transactionState == TransactionStates.Unconfirmed,
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
        redemptionsTip = <ul>
          {currentAccountRedemptions.beneficiaryEth
            ? <li>
                Beneficiary reward: {currentAccountRedemptions.beneficiaryEth} ETH
                {dao.ethCount < currentAccountRedemptions.beneficiaryEth ? " (Insufficient funds in DAO)" : ""}
              </li>
            : ""}
          {currentAccountRedemptions.beneficiaryReputation ? <li>Beneficiary reward: <ReputationView reputation={currentAccountRedemptions.beneficiaryReputation} totalReputation={dao.reputationCount} daoName={dao.name}/></li> : ""}
          {currentAccountRedemptions.proposerReputation ? <li>Proposer reward: <ReputationView reputation={currentAccountRedemptions.proposerReputation} totalReputation={dao.reputationCount} daoName={dao.name}/></li> : ""}
          {currentAccountRedemptions.voterReputation ? <li>Voter reward: <ReputationView reputation={currentAccountRedemptions.voterReputation} totalReputation={dao.reputationCount} daoName={dao.name}/></li> : ""}
          {currentAccountRedemptions.voterTokens ? <li>Voter reward: {currentAccountRedemptions.voterTokens} GEN</li> : ""}
          {currentAccountRedemptions.stakerTokens ? <li>Prediction reward: {currentAccountRedemptions.stakerTokens} GEN</li> : ""}
          {currentAccountRedemptions.stakerBountyTokens
            ? <li>
                Prediction bounty: {currentAccountRedemptions.stakerBountyTokens} GEN
                {dao.genCount < currentAccountRedemptions.stakerBountyTokens ? " (Insufficient funds in DAO)" : ""}
              </li>
            : ""}
          {currentAccountRedemptions.stakerReputation ? <li>Prediction reward: <ReputationView reputation={currentAccountRedemptions.stakerReputation} totalReputation={dao.reputationCount} daoName={dao.name}/></li> : ""}
        </ul>;
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
      const rewardsString = <strong>{rewards.reduce((acc, v) => <React.Fragment>{acc} <em>and</em> {v}</React.Fragment>)}</strong>;

      const styles = {
        forBar: {
          width: yesPercentage + "%",
        },
        againstBar: {
          width: noPercentage + "%",
        },
      };

      const closingTime = (proposal: IProposalState) => {
        const { state, boostedTime, submittedTime, preBoostedVotePeriodLimit, boostedVotePeriodLimit } = proposal;
        const start = state === ProposalStates.Boosted ? boostedTime : submittedTime;
        const duration = state === ProposalStates.Boosted ? boostedVotePeriodLimit : preBoostedVotePeriodLimit;
        return moment((start + duration) * 1000);
      }

      return (
        <div className={proposalClass + " " + css.clearfix}>
          { !proposalEnded(proposal) ?
            <VoteBox
              currentVote={currentAccountVote}
              currentAccountReputation={currentAccountReputation}
              daoName={dao.name}
              daoTotalReputation={dao.reputationCount}
              proposal={proposal}
              transactionState={currentAccountVoteState}
              voteOnProposal={voteOnProposal}
            />
            : proposal.winningVote == VoteOptions.Yes ?
              <div className={css.decidedProposal}>
                  <div className={css.result}>
                    <div><img src="/assets/images/Icon/Passed.svg"/></div>
                  </div>
              </div>
            : proposal.winningVote == VoteOptions.No ?
              <div className={css.decidedProposal}>
                  <div className={css.result}>
                    <div><img src="/assets/images/Icon/Failed.svg"/></div>
                  </div>
              </div>
            : ""
          }
          <div className={css.proposalInfo}>
            { proposalEnded(proposal) && proposal.winningVote == VoteOptions.Yes ?
                <div className="css.clearfix">
                  <div className={css.proposalPassInfo}>
                    <strong className={css.passedBy}>PASSED</strong> {passedByDecision ? "BY DECISION" : "BY TIMEOUT"} ON {submittedTime.format("MMM DD, YYYY")}
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
              :  proposalEnded(proposal) && proposal.winningVote == VoteOptions.No ?
                <div className="css.clearfix">
                  <div className={css.proposalFailInfo}>
                    <strong className={css.failedBy}>FAILED</strong> {failedByDecision ? "BY DECISION" : "BY TIMEOUT"} ON {submittedTime.format("MMM DD, YYYY")}
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
                  currentPrediction={currentAccountPrediction}
                  currentStake={currentAccountStake}
                  currentAccountGens={currentAccountGens}
                  currentAccountGenStakingAllowance={currentAccountGenStakingAllowance}
                  daoAddress={dao.avatarAddress}
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
                  currentPrediction={currentAccountPrediction}
                  currentStake={currentAccountStake}
                  currentAccountGens={currentAccountGens}
                  currentAccountGenStakingAllowance={currentAccountGenStakingAllowance}
                  daoAddress={dao.avatarAddress}
                  proposal={proposal}
                  stakeProposal={stakeProposal}
                  approveStakingGens={approveStakingGens}
                  transactionState={currentAccountStakeState}
                />
              </div>
            : proposalEnded(proposal) ?
              <div>
                <div className={css.proposalDetails + " " + css.concludedDecisionDetails}>
                  { currentAccountRedemptions
                    ? <Tooltip placement="left" trigger={["hover"]} overlay={redemptionsTip}>
                        <button className={css.redeemRewards} onClick={this.handleClickRedeem.bind(this)}>Redeem</button>
                      </Tooltip>
                    : ""
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
