import * as classNames from "classnames";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { Link } from "react-router-dom";
//@ts-ignore
import { Modal } from 'react-router-modal';

import * as arcActions from "actions/arcActions";
import { IDaoState, IProposalState, ProposalStates, proposalEnded } from "reducers/arcReducer";

import ReputationView from "components/Account/ReputationView";

import * as css from "./PreTransactionModal.scss";

export enum ActionTypes {
  CreateProposal,
  Redeem,
  StakeFail,
  StakePass,
  VoteDown,
  VoteUp
}

interface IProps {
  action: any;
  actionType: ActionTypes;
  closeAction: any;
  currentAccount?: string;
  dao: IDaoState;
  effectText: JSX.Element;
  proposal: IProposalState;
}

export default class PreTransactionModal extends React.Component<IProps> {

  public handleClickAction() {
    this.props.action();
    this.props.closeAction();
  }

  public render() {
    const { actionType, currentAccount, dao, effectText, proposal } = this.props;

    const totalReputation = proposal.state == ProposalStates.Executed ? proposal.reputationWhenExecuted : dao.reputationCount;
    const yesPercentage = totalReputation ? Math.round(proposal.votesYes / totalReputation * 100) : 0;
    const noPercentage = totalReputation ? Math.round(proposal.votesNo / totalReputation * 100) : 0;

    const styles = {
      forBar: {
        width: yesPercentage + "%",
      },
      againstBar: {
        width: noPercentage + "%",
      },
    };

    let rewards = [];
    if (proposal.reputationChange) {
      rewards.push(
        <ReputationView daoName={dao.name} totalReputation={totalReputation} reputation={proposal.reputationChange}/>
      );
    }
    if (proposal.ethReward) {
      rewards.push(proposal.ethReward + " ETH");
    }
    const rewardsString = rewards.join("&").toUpperCase();

    return (
      <Modal onBackdropClick={this.props.closeAction}>
        <div className={css.metaMaskModal}>
          <div className={css.bg}></div>
          <div className={css.modalWindow}>
            <div className={css.transaction + " " + css.clearfix}>
              <div className={css.transactionIcon}>
                { actionType == ActionTypes.VoteUp ? <img src="/assets/images/Tx/Upvote.svg" />
                  : actionType == ActionTypes.VoteDown ? <img src="/assets/images/Tx/Downvote.svg" />
                  : actionType == ActionTypes.CreateProposal ? <img src="/assets/images/Tx/NewProposal.svg"/>
                  : actionType == ActionTypes.Redeem ? <img src="/assets/images/Tx/Redemption.svg"/>
                  : actionType == ActionTypes.StakeFail ? <img src="/assets/images/Tx/StakeFail.svg"/>
                  : actionType == ActionTypes.StakePass ? <img src="/assets/images/Tx/StakePass.svg"/> : ""
                }
              </div>
              <div className={css.transactionInfo}>
                <div className={css.transactionType}>
                  { actionType == ActionTypes.VoteUp ? <span><strong className={css.passVote}>Pass</strong> vote</span>
                    : actionType == ActionTypes.VoteDown ? <span><strong className={css.failVote}>Fail</strong> vote</span>
                    : actionType == ActionTypes.CreateProposal ? <span>Create <strong className={css.redeem}>proposal</strong></span>
                    : actionType == ActionTypes.Redeem ? <span>Redeem rewards</span>
                    : actionType == ActionTypes.StakeFail ? <span><strong className={css.passVote}>Fail</strong> prediction</span>
                    : actionType == ActionTypes.StakePass ? <span><strong className={css.passVote}>Pass</strong> prediction</span> : ""
                  }
                </div>
                <div className={css.transactionTitle}>
                  <strong>{proposal.title}</strong>
                </div>
                <div className={css.transactionEffect}>
                  {effectText}
                </div>
              </div>
              <div className={css.closeTransactionContainer}>
                <button onClick={this.props.closeAction}>
                  <img src="/assets/images/Tx/Close.svg"/>
                </button>
              </div>
            </div>
            <div className={css.incentives}>
              <span className={css.outcomes}>OUTCOMES</span>
              <span className={css.passIncentive}>
                <strong>PASS</strong>
                  { actionType == ActionTypes.VoteUp && proposal.state == ProposalStates.PreBoosted ?
                    <span>YOU GAIN GEN &amp; REPUTATION</span>
                  : actionType == ActionTypes.VoteUp && (proposal.state == ProposalStates.Boosted || proposal.state == ProposalStates.QuietEndingPeriod) ?
                    <span>NO REWARDS</span>
                  : actionType == ActionTypes.VoteDown && proposal.state == ProposalStates.PreBoosted ?
                    <span>LOSE 1% YOUR REPUTATION</span>
                  : actionType == ActionTypes.VoteDown && (proposal.state == ProposalStates.Boosted || proposal.state == ProposalStates.QuietEndingPeriod) ?
                    <span>NO REWARDS</span>
                  : actionType == ActionTypes.CreateProposal ?
                    <span>{currentAccount == proposal.beneficiaryAddress ? `GAIN REPUTATION & REWARDS OF ${rewardsString}` : "GAIN REPUTATION"}</span>
                  : actionType == ActionTypes.StakePass ?
                    <span>YOU GAIN GEN AND REPUTATION</span>
                  : actionType == ActionTypes.StakeFail ?
                    <span>NO REWARDS &amp; LOSE YOUR STAKE</span>
                  : ""}
              </span>
              <span className={css.failIncentive}>
                <strong>FAIL</strong>
                { actionType == ActionTypes.VoteUp && proposal.state == ProposalStates.PreBoosted ?
                    <span>LOSE 1% OF YOUR REPUTATION</span>
                  : actionType == ActionTypes.VoteUp && (proposal.state == ProposalStates.Boosted || proposal.state == ProposalStates.QuietEndingPeriod) ?
                    <span>NO REWARDS</span>
                  : actionType == ActionTypes.VoteDown && proposal.state == ProposalStates.PreBoosted ?
                    <span>GAIN GEN</span>
                  : actionType == ActionTypes.VoteDown && (proposal.state == ProposalStates.Boosted || proposal.state == ProposalStates.QuietEndingPeriod) ?
                    <span>NO REWARDS</span>
                  : actionType == ActionTypes.CreateProposal ?
                    <span>NO REWARDS</span>
                  : actionType == ActionTypes.StakePass ?
                    <span>NO REWARDS &amp; LOSE YOUR STAKE</span>
                  : actionType == ActionTypes.StakeFail ?
                    <span>YOU GAIN GEN AND REPUTATION</span>
                  : ""
                }
              </span>
              <span className={css.help}>
                <img src="/assets/images/Icon/Help.svg"/>
                <img className={css.hover} src="/assets/images/Icon/Help-hover.svg"/>
                <div className={css.helpBox}>
                  <div className={css.pointer}></div>
                  <div className={css.bg}></div>
                  <div className={css.bridge}></div>
                  <div className={css.header}>
                    <h2>Genesis Protocol</h2>
                    <h3>RULES FOR YES VOTES</h3>
                  </div>
                  <div className={css.body}>
                    { actionType == ActionTypes.VoteUp || actionType == ActionTypes.VoteDown ?
                        <div>
                          <p>When you vote, 1% of your reputation is taken away for the duration of the vote. If you vote for something to pass and it does, you gain reputation in addition to the reputation you lost.</p>
                          <p>If you vote for something to pass and it does, you will be given a portion of whatever GEN have been staked on the proposal.</p>
                          <p>If you vote for something to fail and it does, you will be given a portion of whatever GEN have been staked on the proposal.</p>
                          <p>You will not receive reputation or GEN for voting on a boosted proposal.</p>
                        </div>
                      : actionType == ActionTypes.StakePass || actionType == ActionTypes.StakeFail ?
                        <div>
                          <p>When you place a stake, GEN are taken from your wallet and held in a smart contract for the duration of the vote. If your stake is correct, you receive your GEN + a portion of whatever has been staked on the incorrect outcome.</p>
                          <p>If your stake is correct, you will also receive reputation within the DAO.</p>
                        </div>
                      : actionType == ActionTypes.CreateProposal ?
                        <div>
                          <p>If a proposal you submit passes, you will be awarded reputation. If you are also the benificiary of the proposal, when the proposal passes the allocated tokens will be given to you.</p>
                          <p>If a proposal you submit fails, you do not lose anything.</p>
                        </div>
                      : ""
                    }
                  </div>
                  <a href="https://docs.google.com/document/d/1LMe0S4ZFWELws1-kd-6tlFmXnlnX9kfVXUNzmcmXs6U/edit?usp=drivesdk">View the Gensis Protocol</a>
                </div>
              </span>
            </div>
            { !proposalEnded(proposal) ?
              <div className={css.decisionGraph}>
                  <span className={css.forLabel}>{proposal.votesYes} ({yesPercentage}%) PASS</span>
                  <div className={css.graph}>
                    <div className={css.forBar} style={styles.forBar}></div>
                    <div className={css.againstBar} style={styles.againstBar}></div>
                    <div className={css.divider}></div>
                  </div>
                  <span className={css.againstLabel}>{proposal.votesNo} ({noPercentage}%) FAIL</span>
              </div>
              : ""
            }
            <div className={css.transactionInstructions}>
              <p>
                When you click "Launch MetaMask" we will pop up a Metamask dialogue.
                This dialogue will ask you to approve your transaction, including a small ETH cost.
                It will set a default gas limit and price. It's fine to stick with these defaults.
              </p>
              <button className={css.launchMetaMask} onClick={this.handleClickAction.bind(this)}>
                <img src="/assets/images/Tx/MetaMask.svg"/>
                Launch MetaMask
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}
