import * as classNames from "classnames";
import * as moment from "moment";
import Tooltip from 'rc-tooltip';
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDaoState, IProposalState, ProposalStates, IRedemptionState, TransactionStates, VoteOptions } from "reducers/arcReducer";

import AccountPopupContainer from "components/Account/AccountPopupContainer";
import PredictionBox from "./PredictionBox";
import VoteBox from "./VoteBox";

import * as css from "./Proposal.scss";

interface IStateProps {
  currentAccountAddress: string;
  currentAccountRedemptions?: IRedemptionState;
  dao?: IDaoState;
  proposal?: IProposalState;
}

const mapStateToProps = (state: IRootState, ownProps: any): IStateProps => {
  const proposal = state.arc.proposals[ownProps.proposalId];
  const dao = proposal && state.arc.daos[proposal.daoAvatarAddress];
  const currentAccountRedemptions = dao && dao.members[state.web3.ethAccountAddress] && dao.members[state.web3.ethAccountAddress].redemptions[proposal.proposalId];
  return {
    currentAccountAddress: state.web3.ethAccountAddress,
    currentAccountRedemptions,
    dao,
    proposal,
  };
};

interface IDispatchProps {
  redeemProposal: typeof arcActions.redeemProposal;
  voteOnProposal: typeof arcActions.voteOnProposal;
  stakeProposal: typeof arcActions.stakeProposal;
}

const mapDispatchToProps = {
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
    const { currentAccountAddress, currentAccountRedemptions, dao, proposal, stakeProposal, voteOnProposal } = this.props;

    if (proposal) {
      const proposalClass = classNames({
        [css.proposal]: true,
        [css.openProposal]: proposal.state == ProposalStates.PreBoosted || proposal.state == ProposalStates.Boosted,
        [css.failedProposal]: (proposal.state == ProposalStates.Executed || proposal.state == ProposalStates.Closed) && proposal.winningVote == VoteOptions.No,
        [css.passedProposal]: (proposal.state == ProposalStates.Executed || proposal.state == ProposalStates.Closed) && proposal.winningVote == VoteOptions.Yes,
        [css.redeemable]: !!currentAccountRedemptions,
        [css.unconfirmedProposal]: proposal.transactionState == TransactionStates.Unconfirmed,
      });

      const submittedTime = moment.unix(proposal.submittedTime);

      // Calculate reputation percentages
      const totalReputation = proposal.state == ProposalStates.Executed ? proposal.reputationWhenExecuted : dao.reputationCount;
      const yesPercentage = totalReputation ? Math.round(proposal.votesYes / totalReputation * 100) : 0;
      const noPercentage = totalReputation ? Math.round(proposal.votesNo / totalReputation * 100) : 0;

      const daoAccount = dao.members[currentAccountAddress];
      let currentAccountReputation = 0, currentAccountTokens = 0, currentAccountVote = 0, currentAccountPrediction = 0, currentAccountStake = 0,
          currentAccountStakeState = TransactionStates.Confirmed, currentAccountVoteState = TransactionStates.Confirmed,
          redemptionsTip: JSX.Element = null;

      if (daoAccount) {
        currentAccountReputation = daoAccount.reputation;
        currentAccountTokens = daoAccount.tokens;

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
          {currentAccountRedemptions.beneficiaryEth ? <li>Beneficiary ETH: {currentAccountRedemptions.beneficiaryEth}</li> : ""}
          {currentAccountRedemptions.beneficiaryNativeToken ? <li>Beneficiary {dao.tokenSymbol} tokens: {currentAccountRedemptions.beneficiaryNativeToken}</li> : ""}
          {currentAccountRedemptions.beneficiaryReputation ? <li>Beneficiary reputation: {currentAccountRedemptions.beneficiaryReputation}</li> : ""}
          {currentAccountRedemptions.proposerReputation ? <li>Reputation for proposing: {currentAccountRedemptions.proposerReputation}</li> : ""}
          {currentAccountRedemptions.voterReputation ? <li>Reputation for voting: {currentAccountRedemptions.voterReputation}</li> : ""}
          {currentAccountRedemptions.stakerReputation ? <li>Reputation for staking: {currentAccountRedemptions.stakerReputation}</li> : ""}
          {currentAccountRedemptions.voterTokens ? <li>{dao.tokenSymbol} tokens for voting: {currentAccountRedemptions.voterTokens}</li> : ""}
          {currentAccountRedemptions.stakerTokens ? <li>{dao.tokenSymbol} tokens for staking:{currentAccountRedemptions.stakerTokens}</li> : ""}
        </ul>;
      }

      let rewards = [];
      if (proposal.nativeTokenReward) {
        rewards.push(proposal.nativeTokenReward + " " + dao.tokenSymbol);
      }
      if (proposal.reputationChange) {
        rewards.push(
          <Tooltip placement="top" trigger={["hover"]} overlay={<span style={{minHeight: 'inherit !important'}}>{proposal.reputationChange} reputation</span>}>
            <span>
              {(100 * proposal.reputationChange / totalReputation).toFixed(1)}% reputation
            </span>
          </Tooltip>
        );
      }
      if (proposal.ethReward) {
        rewards.push(proposal.ethReward + " ETH");
      }
      const rewardsString = rewards.reduce((acc, v) => [acc, " & ", v] as any);

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
          { proposal.state == ProposalStates.PreBoosted || proposal.state == ProposalStates.Boosted ?
            <VoteBox
              currentVote={currentAccountVote}
              currentAccountReputation={currentAccountReputation}
              daoTotalReputation={dao.reputationCount}
              proposal={proposal}
              transactionState={currentAccountVoteState}
              voteOnProposal={voteOnProposal}
            />
            : proposal.winningVote == VoteOptions.Yes ?
              <div className={css.decidedProposal}>
                  <div className={css.result}>
                    <div>PASSED</div>
                    <div><img src="/assets/images/Icon/Passed.svg"/></div>
                    <div>{submittedTime.format("MMM DD, YYYY")}</div>
                  </div>
              </div>
            : proposal.winningVote == VoteOptions.No ?
              <div className={css.decidedProposal}>
                  <div className={css.result}>
                    <div>FAILED</div>
                    <div><img src="/assets/images/Icon/Failed.svg"/></div>
                    <div>{submittedTime.format("MMM DD, YYYY")}</div>
                  </div>
              </div>
            : ""
          }
          <div className={css.proposalInfo}>
            { proposal.state == ProposalStates.Executed ?
              <div className={css.decisionGraph}>
                <span className={css.forLabel}>{proposal.votesYes} ({yesPercentage}%)</span>
                <div className={css.graph}>
                  <div className={css.forBar} style={styles.forBar}></div>
                  <div className={css.againstBar} style={styles.againstBar}></div>
                  <div className={css.divider}></div>
                </div>
                <span className={css.againstLabel}>{proposal.votesNo} ({noPercentage}%)</span>
              </div>
              : ""
            }
            <h3>
              { proposal.state == ProposalStates.PreBoosted ?
                <span>CLOSES {moment((proposal.submittedTime + proposal.preBoostedVotePeriodLimit) * 1000).fromNow().toUpperCase()}</span>
              : proposal.state == ProposalStates.Boosted ?
                <span>CLOSES {moment((proposal.boostedTime + proposal.boostedVotePeriodLimit) * 1000).fromNow().toUpperCase()}</span>
              : ""
              }
              {proposal.title}
            </h3>
            <div className={css.transferDetails}>
              <span className={css.transferType}>Transfer of {rewardsString}</span>
              <span className={css.transferAmount}></span>
              <img src="/assets/images/Icon/Transfer.svg"/>

              <AccountPopupContainer
                accountAddress={proposal.beneficiaryAddress}
                daoAvatarAddress={proposal.daoAvatarAddress}
              />
            </div>
          </div>
          { proposal.state == ProposalStates.Boosted ?
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
                    <img src="/assets/images/Icon/View.svg"/>
                  </a>
                </div>

                <PredictionBox
                  currentPrediction={currentAccountPrediction}
                  currentStake={currentAccountStake}
                  currentAccountTokens={currentAccountTokens}
                  proposal={proposal}
                  stakeProposal={stakeProposal}
                  transactionState={currentAccountStakeState}
                />
              </div>
            : proposal.state == ProposalStates.PreBoosted ?
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
                    <img src="/assets/images/Icon/View.svg"/>
                  </a>
                </div>

                <PredictionBox
                  currentPrediction={currentAccountPrediction}
                  currentStake={currentAccountStake}
                  currentAccountTokens={currentAccountTokens}
                  proposal={proposal}
                  stakeProposal={stakeProposal}
                  transactionState={currentAccountStakeState}
                />
              </div>
            : proposal.state == ProposalStates.Executed || proposal.state == ProposalStates.Closed ?
              <div>
                <div className={css.proposalDetails + " " + css.concludedDecisionDetails}>
                  { currentAccountRedemptions
                    ? <Tooltip placement="left" trigger={["hover"]} overlay={redemptionsTip}>
                        <button className={css.redeemRewards} onClick={this.handleClickRedeem.bind(this)}>Redeem</button>
                      </Tooltip>
                    : ""
                  }

                  <a href={proposal.description} target="_blank" className={css.viewProposal}>
                    <img src="/assets/images/Icon/View.svg"/>
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
