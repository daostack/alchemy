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
  Execute,
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

    // If percentages are less than 2 then set them to 2 so they can be visibly noticed
    const yesPercentage = totalReputation && proposal.votesYes ? Math.max(2, Math.ceil(proposal.votesYes / totalReputation * 100)) : 0;
    const noPercentage = totalReputation  && proposal.votesNo ? Math.max(2, Math.ceil(proposal.votesNo / totalReputation * 100)) : 0;

    const styles = {
      forBar: {
        width: yesPercentage + "%",
      },
      againstBar: {
        width: noPercentage + "%",
      },
    };

    let icon, transactionInfo, passIncentive, failIncentive, rulesHeader, rules;
    switch (actionType) {
      case ActionTypes.VoteUp:
        icon = <img src="/assets/images/Tx/Upvote.svg" />;
        transactionInfo = <span><strong className={css.passVote}>Pass</strong> vote</span>;
        passIncentive = proposal.state == ProposalStates.PreBoosted ? <span>GAIN GEN &amp; REPUTATION</span> : <span>NO REWARDS</span>;
        failIncentive = proposal.state == ProposalStates.PreBoosted ? <span>LOSE 1% OF YOUR REPUTATION</span> : <span>NO REWARDS</span>;
        rulesHeader = "RULES FOR YES VOTES";
        rules = <div>
                  <p>When you vote on a regular proposal, 1% of your reputation is taken away for the duration of the vote. You will get the 1% back + an extra reputation reward if you vote correctly (e.g. vote Pass on a proposal that passes or vote Fail on a proposal that fails). If you vote on a regular proposal that times-out, you will get your reputation back.</p>
                  <p>If you vote Pass and the proposal passes you will be given a portion of whatever GEN have been staked on the proposal.</p>
                  <p>If you vote Fail and the proposal fails you will be given a portion of whatever GEN have been staked on the proposal.</p>
                  <p>You will not receive reputation or GEN for voting on a boosted proposal.</p>
                </div>;
        break;
      case ActionTypes.VoteDown:
        icon = <img src="/assets/images/Tx/Downvote.svg" />;
        transactionInfo = <span><strong className={css.failVote}>Fail</strong> vote</span>;
        passIncentive = proposal.state == ProposalStates.PreBoosted ? <span>LOSE 1% YOUR REPUTATION</span> : <span>NO REWARDS</span>;
        failIncentive = proposal.state == ProposalStates.PreBoosted ? <span>GAIN REPUTATION AND GEN</span> : <span>NO REWARDS</span>;
        rulesHeader = "RULES FOR NO VOTES";
        rules = <div>
                  <p>When you vote on a regular proposal, 1% of your reputation is taken away for the duration of the vote. You will get the 1% back + an extra reputation reward if you vote correctly (e.g. vote Pass on a proposal that passes or vote Fail on a proposal that fails). If you vote on a regular proposal that times-out, you will get your reputation back.</p>
                  <p>If you vote for something to pass and it does, you will be given a portion of whatever GEN have been staked on the proposal.</p>
                  <p>If you vote for something to fail and it does, you will be given a portion of whatever GEN have been staked on the proposal.</p>
                  <p>You will not receive reputation or GEN for voting on a boosted proposal.</p>
                </div>;
        break;
      case ActionTypes.StakePass:
        icon = <img src="/assets/images/Tx/StakePass.svg"/>;
        transactionInfo = <span><strong className={css.passVote}>Pass</strong> prediction</span>;
        passIncentive = <span>YOU GAIN GEN AND REPUTATION</span>;
        failIncentive = <span>LOSE YOUR STAKE</span>;
        rulesHeader = "RULES FOR PASS PREDICTIONS";
        rules = <div>
                  <p>When you predict correctly you gain (1) GEN from the DAO bounty. (2) A portion of GEN from incorrect predictions.</p>
                  <p>When you predict correctly, you receive some reputation from other voters who didn't vote correctly on the proposal.</p>
                  <p>When you predict incorrectly you simply lose all the GEN you have staked.</p>
                </div>;
        break;
      case ActionTypes.StakeFail:
        icon = <img src="/assets/images/Tx/StakeFail.svg"/>;
        transactionInfo = <span><strong className={css.failVote}>Fail</strong> prediction</span>;
        passIncentive = <span>LOSE YOUR STAKE</span>;
        failIncentive = <span>YOU GAIN GEN AND REPUTATION</span>;
        rulesHeader = "RULES FOR FAIL PREDICTIONS";
        rules = <div>
                  <p>When you predict correctly you gain (1) GEN from the DAO bounty. (2) A portion of GEN from incorrect predictions.</p>
                  <p>When you predict correctly, you receive some reputation from other voters who didn't vote correctly on the proposal.</p>
                  <p>When you predict incorrectly you simply lose all the GEN you have staked.</p>
                </div>;
        break;
      case ActionTypes.CreateProposal:
        icon = <img src="/assets/images/Tx/NewProposal.svg"/>;
        transactionInfo = <span>Create <strong className={css.redeem}>proposal</strong></span>;

        if (currentAccount == proposal.beneficiaryAddress) {
          let rewards = [];
          if (proposal.reputationChange) {
            rewards.push(
              <ReputationView daoName={dao.name} totalReputation={totalReputation} reputation={proposal.reputationChange}/>
            );
          }
          if (proposal.ethReward) {
            rewards.push(proposal.ethReward + " ETH");
          }
          const rewardsString = <strong>{rewards.reduce((acc, v) => acc == null ? <React.Fragment>{v}</React.Fragment> : <React.Fragment>{acc} <em>and</em> {v}</React.Fragment>, null)}</strong>;
          passIncentive = <span>GAIN REPUTATION &amp; {rewardsString}</span>;
        } else {
          passIncentive = <span>GAIN REPUTATION</span>;
        }

        failIncentive = <span>NOTHING TO LOSE</span>;
        rulesHeader = "RULES FOR CREATING PROPOSALS";
        rules = <div>
                  <p>If a proposal you submit passes, you will be awarded reputation. If you are the receiver of the budget, you will gain ETH and/or reputation.</p>
                </div>;
        break;
      case ActionTypes.Redeem:
        icon = <img src="/assets/images/Tx/Redemption.svg"/>;
        transactionInfo = <span>Redeem proposal</span>;
        break;
      case ActionTypes.Execute:
        icon = <img src="/assets/images/Tx/Redemption.svg"/>;
        transactionInfo = <span>Execute proposal</span>;
        break;
    }

    return (
      <Modal onBackdropClick={this.props.closeAction}>
        <div className={css.metaMaskModal}>
          <div className={css.bg} onClick={this.props.closeAction}></div>
          <div className={css.modalWindow}>
            <div className={css.transaction + " " + css.clearfix}>
              <div className={css.transactionIcon}>{icon}</div>
              <div className={css.transactionInfo}>
                <div className={css.transactionType}>{transactionInfo}</div>
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
            {actionType != ActionTypes.Redeem && actionType != ActionTypes.Execute ?
              <div className={css.incentives}>
                <span className={css.outcomes}>OUTCOMES</span>
                <span className={css.passIncentive}><strong>PASS</strong>{passIncentive}</span>
                <span className={css.failIncentive}><strong>FAIL</strong>{failIncentive}</span>
                <span className={css.help}>
                  <img src="/assets/images/Icon/Help.svg"/>
                  <img className={css.hover} src="/assets/images/Icon/Help-hover.svg"/>
                  <div className={css.helpBox}>
                    <div className={css.pointer}></div>
                    <div className={css.bg}></div>
                    <div className={css.bridge}></div>
                    <div className={css.header}>
                      <h2>Genesis Protocol</h2>
                      <h3>{rulesHeader}</h3>
                    </div>
                    <div className={css.body}>{rules}</div>
                    <a href="https://docs.google.com/document/d/1LMe0S4ZFWELws1-kd-6tlFmXnlnX9kfVXUNzmcmXs6U/edit?usp=drivesdk" target='_blank'>View the Genesis Protocol</a>
                  </div>
                </span>
              </div> : ""
            }
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
                It will set a default gas limit and gas price. It's fine to stick with these defaults.
                You can also consult <a href="https://ethgasstation.info/calculatorTxV.php" target='_blank'>this calculator</a> to adjust the gas price.
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
