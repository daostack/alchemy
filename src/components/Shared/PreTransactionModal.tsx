import * as classNames from "classnames";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { Link } from "react-router-dom";
//@ts-ignore
import { Modal } from 'react-router-modal';

import * as arcActions from "actions/arcActions";
import { IDaoState, IProposalState, ProposalStates, proposalEnded } from "reducers/arcReducer";

import * as css from "./PreTransactionModal.scss";

interface IProps {
  action: any;
  actionType: string;
  closeAction: any;
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
    const { actionType, dao, effectText, proposal } = this.props;

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

    return (
      <Modal onBackdropClick={this.props.closeAction}>
        <div className={css.metaMaskModal}>
          <div className={css.bg}></div>
          <div className={css.modalWindow}>
            <div className={css.transaction + " " + css.clearfix}>
              <div className={css.transactionIcon}>
                { actionType == 'upvote' ? <img src="/assets/images/Tx/Upvote.svg" />
                  : actionType == 'downvote' ? <img src="/assets/images/Tx/Downvote.svg" />
                  : actionType == 'createProposal' ? <img src="/assets/images/Tx/NewProposal.svg"/>
                  : actionType == 'redeem' ? <img src="/assets/images/Tx/Redemption.svg"/>
                  : actionType == 'stakeFail' ? <img src="/assets/images/Tx/StakeFail.svg"/>
                  : actionType == 'stakePass' ? <img src="/assets/images/Tx/StakePass.svg"/> : ""
                }
              </div>
              <div className={css.transactionInfo}>
                <div className={css.transactionType}>
                  { actionType == 'upvote' ? <span><strong className={css.passVote}>Pass</strong> vote</span>
                    : actionType == 'downvote' ? <span><strong className={css.failVote}>Fail</strong> vote</span>
                    : actionType == 'createProposal' ? <span>Create <strong className={css.redeem}>proposal</strong></span>
                    : actionType == 'redeem' ? <span>Redeem rewards</span>
                    : actionType == 'stakeFail' ? <span><strong className={css.passVote}>Fail</strong> prediction</span>
                    : actionType == 'stakePass' ? <span><strong className={css.passVote}>Pass</strong> prediction</span> : ""
                  }
                </div>
                <div className={css.transactionTitle}>
                  <strong>{proposal.title}</strong>
                </div>
                <div className={css.transactionEffect}>
                  {effectText}

                    {/*
                    <span>
                      For {reward type}, you will receive:<br/>
                      - {number of tokens or % of token if reputation} {type of token}<br/>
                      - {number of tokens or % of token if reputation} {type of token}
                    </span>
                    <span>Budget: {Proposal reputation requested %} % Rep and {Proposal ETH requested} ETH</span>
                    <span>Prediction amount: {GEN} Gens<br/>You are predicting the proposal will be [accepted/rejected] by the DAO</span>
                     */}
                </div>
              </div>
              <div className={css.closeTransactionContainer}>
                <button>
                  <img src="/assets/images/Tx/Close.svg"/>
                </button>
              </div>
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
