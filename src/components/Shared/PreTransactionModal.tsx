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
                </div>
              </div>
              <div className={css.closeTransactionContainer}>
                <button>
                  <img src="/assets/images/Tx/Close.svg"/>
                </button>
              </div>
            </div>
            <div className={css.incentives}>
              <span className={css.outcomes}>OUTCOMES</span>
              <span className={css.passIncentive}><strong>PASS</strong> <span>YOU GAIN GEN & REPUTATION</span></span>
              {/* 

              PASS CONDITIONS:

              Action
              Copy

              ----

              Voting up a regular proposal
              YOU GAIN GEN & REPUTATION

              Voting up a boosted proposal
              NO REWARDS

              Vote down a regular proposal
              LOSE 1% YOUR REPUTATION

              Vote down a boosted proposal
              NO REWARDS

              Propose
              GAIN REPUTATION & [if target of proposal, list token and reputation]

              Stake up regular proposal
              YOU GAIN GEN AND REPUTATION

              Stake down a regular proposal
              NO REWARDS & LOSE YOUR STAKE

              */}
              <span className={css.failIncentive}><strong>FAIL</strong> <span>YOU GAIN GEN</span></span>

              {/*

              FAIL CONDITIONS:

              Action
              Copy

              ----

              Voting up a regular proposal
              LOSE 1% OF YOUR REPUTATION

              Voting up a boosted proposal
              NO REWARDS

              Vote down a regular proposal
              GAIN GEN

              Vote down a boosted proposal
              NO REWARDS

              Propose
              NO REWARDS

              Stake up regular proposal
              NO REWARDS & LOSE YOUR STAKE

              Stake down a regular proposal
              YOU GAIN GEN AND REPUTATION

              */}
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

                    {/*

                    HELP TEXT:

                    ACTION
                    Copy

                    ----

                    VOTING UP A REGULAR PROPOSAL, VOTING DOWN A REGULAR PROPOSAL, VOTING ON BOOSTED PROPOSALS
                    
                    <p>When you vote, 1% of your reputation is taken away for the duration of the vote. If you vote for something to pass and it does, you gain reputation in addition to the reputation you lost.</p>

                    <p>If you vote for something to pass and it does, you will be given a portion of whatever GEN have been staked on the proposal.</p>

                    <p>If you vote for something to fail and it does, you will be given a portionof whatever GEN have been staked on the proposal.</p>

                    <p>You will not receive reputation or GEN for voting on a boosted proposal.</p>

                    STAKING UP OR DOWN

                    <p>When you place a stake, GEN are taken from your wallet and held in a smart contract for the duration of the vote. If your stake is correct, you receive your GEN+ a portion of whatever has been staked on the incorrect outcome.</p>

                    <p>If your stake is correct, you will also receive reputation within the DAO.</p>

                    PROPOSING

                    <p>If a proposal you submit passes, you will be awarded reputation. If you are also the benificiary of the proposal, when the proposal passes the allocated tokens will be given to you.

                    <p>If a proposal you submit fails, you do not lose anything.</p>

                    */}


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
