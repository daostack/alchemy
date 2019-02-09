import * as classNames from "classnames";
import Tooltip from "rc-tooltip";
import * as React from "react";
//@ts-ignore
import { Modal } from 'react-router-modal';

import { proposalEnded } from "reducers/arcReducer";
import { IProfileState } from "reducers/profilesReducer";
import { IDAOState, IProposalState, ProposalStage } from '@daostack/client'

import RewardsString from "components/Proposal/RewardsString";
import TransferDetails from "components/Proposal/TransferDetails";

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
  beneficiaryProfile?: IProfileState;
  closeAction: any;
  currentAccount?: string;
  currentAccountGens?: number;
  dao: IDAOState;
  effectText?: string | JSX.Element;
  proposal: IProposalState;
  secondaryHeader?: string;
}

interface IState {
  instructionsOpen: boolean;
  stakeAmount: number;
}

export default class PreTransactionModal extends React.Component<IProps, IState> {

  public stakeInput: any;

  constructor(props: IProps) {
    super(props);

    this.state = {
      instructionsOpen: false,
      stakeAmount: 0
    };
  }

  public handleClickAction() {
    const { actionType } = this.props;
    if (actionType == ActionTypes.StakeFail || actionType == ActionTypes.StakePass) {
      this.props.action(this.state.stakeAmount);
    } else {
      this.props.action();
    }
    this.props.closeAction();
  }

  public toggleInstructions() {
    this.setState({ instructionsOpen: !this.state.instructionsOpen });
  }

  public render() {
    const { actionType, beneficiaryProfile, currentAccount, currentAccountGens, dao, effectText, proposal, secondaryHeader } = this.props;
    const { stakeAmount } = this.state;

    // TODO: calculate reputationWhenExecuted
    // const totalReputation = proposal.state == ProposalStates.Executed ? proposal.reputationWhenExecuted : dao.reputationCount;
    const totalReputation = dao.reputationTotalSupply;

    // If percentages are less than 2 then set them to 2 so they can be visibly noticed
    const yesPercentage = totalReputation && proposal.votesFor ? Math.max(2, Math.ceil(proposal.votesFor / totalReputation * 100)) : 0;
    const noPercentage = totalReputation  && proposal.votesAgainst ? Math.max(2, Math.ceil(proposal.votesAgainst / totalReputation * 100)) : 0;

    const styles = {
      forBar: {
        width: yesPercentage + "%",
      },
      againstBar: {
        width: noPercentage + "%",
      },
    };

    const buyGensClass = classNames({
      [css.genError]: true,
      [css.hidden]: this.state.stakeAmount <= currentAccountGens
    });

    let icon, transactionType, passIncentive, failIncentive, rulesHeader, rules;
    switch (actionType) {
      case ActionTypes.VoteUp:
        icon = <img src="/assets/images/Tx/Upvote.svg" />;
        transactionType = <span><strong className={css.passVote}>Pass</strong> vote</span>;
        // TODO: check if the commented lines are correctly refactored
        // passIncentive = proposal.state == ProposalStates.PreBoosted ? <span>GAIN GEN &amp; REPUTATION</span> : <span>NO REWARDS</span>;
        // failIncentive = proposal.state == ProposalStates.PreBoosted ? <span>LOSE 1% OF YOUR REPUTATION</span> : <span>NO REWARDS</span>;
        passIncentive = proposal.stage == ProposalStage.Open ? <span>GAIN GEN &amp; REPUTATION</span> : <span>NO REWARDS</span>;
        failIncentive = proposal.stage == ProposalStage.Open ? <span>LOSE 1% OF YOUR REPUTATION</span> : <span>NO REWARDS</span>;
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
        transactionType = <span><strong className={css.failVote}>Fail</strong> vote</span>;
        // TODO: check if the commented lines are correctly refactored
        passIncentive = proposal.stage == ProposalStage.Open ? <span>LOSE 1% YOUR REPUTATION</span> : <span>NO REWARDS</span>;
        failIncentive = proposal.stage == ProposalStage.Open ? <span>GAIN REPUTATION AND GEN</span> : <span>NO REWARDS</span>;
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
        transactionType = <span><strong className={css.passVote}>Pass</strong> prediction</span>;

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
        transactionType = <span><strong className={css.failVote}>Fail</strong> prediction</span>;
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
        transactionType = <span>Create <strong className={css.redeem}>proposal</strong></span>;

        if (currentAccount == proposal.beneficiary) {
          const rewards = [];
          passIncentive = <span>GAIN REPUTATION &amp; <RewardsString proposal={proposal} dao={dao} /></span>;
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
        transactionType = <span>Redeem proposal</span>;
        break;
      case ActionTypes.Execute:
        icon = <img src="/assets/images/Tx/Redemption.svg"/>;
        transactionType = <span>Execute proposal</span>;
        break;
    }

    return (
      <Modal onBackdropClick={this.props.closeAction}>
        <div className={css.metaMaskModal}>
          <div className={css.bg} onClick={this.props.closeAction}></div>
          <div className={css.modalWindow}>
            <div className={css.transactionHeader + " " + css.clearfix}>
              <div className={css.transactionIcon}>{icon}</div>
              <div className={css.transactionInfo}>
                <span className={css.transactionType}>{transactionType}</span>
                &nbsp; | &nbsp;
                <span className={css.secondaryHeader}>{secondaryHeader}</span>
              </div>
              <div className={css.closeTransactionContainer}>
                <button onClick={this.props.closeAction}>
                  <img src="/assets/images/Tx/Close.svg"/>
                </button>
              </div>
            </div>
            <div className={css.proposalInfo}>
              <div className={css.proposalTitle}>
                <strong>{proposal.title || "[no title]"}</strong>
              </div>
              <TransferDetails beneficiaryProfile={beneficiaryProfile} proposal={proposal} dao={dao} />
            </div>
            {/* TODO: do we need this? */}
             <div className={css.transactionEffect}>
              {effectText}
            </div>
            { /******* Staking form ******  **/
              actionType == ActionTypes.StakeFail || actionType == ActionTypes.StakePass ?
              <div className={css.stakingInfo + " " + css.clearfix}>
                <div className={css.currentPredictions}>
                  <div>Pass {proposal.stakesFor} + {stakeAmount} = {proposal.stakesFor + stakeAmount} GEN</div>
                  <div>Fail {proposal.stakesAgainst}</div>
                </div>
                <div className={css.stakingForm}>
                  <span>Your stake</span>
                  <div className={buyGensClass}>
                    <h4>
                      You do not have enough GEN
                      <span>YOUR STAKE: {stakeAmount} - WALLET BALANCE: {currentAccountGens}</span>
                    </h4>
                    <div className={css.exchangeList}>
                      Select an exchange  &#8964;
                      <ul>
                        <li><a href="https://idex.market/eth/gen" target="_blank"><img src="/assets/images/Exchanges/idex.png"/> IDEX</a></li>
                        <li><a href="https://ddex.io/trade/GEN-ETH" target="_blank"><img src="/assets/images/Exchanges/ddex.png"/> DDEX</a></li>
                        <li><a href="https://forkdelta.github.io/#!/trade/0x543ff227f64aa17ea132bf9886cab5db55dcaddf-ETH" target="_blank"><img src="/assets/images/Exchanges/forkdelta.png"/> Forkdelta</a></li>
                        <li><a href="https://etherdelta.com/#0x543ff227f64aa17ea132bf9886cab5db55dcaddf-ETH" target="_blank"><img src="/assets/images/Exchanges/etherdelta.png"/> Etherdelta</a></li>
                        <li><a href="https://www.hotbit.io/exchange?symbol=GEN_ETH" target="_blank"><img src="/assets/images/Exchanges/hotbit.png"/> Hotbit</a></li>
                      </ul>
                    </div>
                    <span>Use one of our trusted exchanges to acquire more GEN</span>
                  </div>
                 <div className={css.formGroup + " " + css.clearfix}>
                    <span className={css.genLabel}>Stake</span>
                    <input
                      autoFocus={true}
                      type="number"
                      min="1"
                      ref={(input) => { this.stakeInput = input; }}
                      className={css.predictionAmount}
                      onChange={(e) => this.setState({stakeAmount: Number(e.target.value)})}
                      value={stakeAmount}
                    />
                    <span className={css.genLabel}>GEN</span>
                    <span>Your balance: {currentAccountGens} GEN</span>
                  </div>
                </div>
              </div> : ""
            }
            {actionType != ActionTypes.Redeem && actionType != ActionTypes.Execute ?
              <div className={css.incentives + " " + css.clearfix}>
                <span className={css.outcomes}>OUTCOMES</span>
                <span className={css.passIncentive}><strong>PASS</strong>{passIncentive}</span>
                <span className={css.failIncentive}><strong>FAIL</strong>{failIncentive}</span>

                <img src="/assets/images/Icon/Help.svg" onClick={this.toggleInstructions.bind(this)} />
                <img className={css.hover} src="/assets/images/Icon/Help-hover.svg"/>

                <span className={classNames({[css.help]: true, [css.hidden]: !this.state.instructionsOpen})}>
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
            { /* Commenting out the proposal vote status for now, lets see if we want to bring this back
              !proposalEnded(proposal) ?
              <div className={css.decisionGraph}>
                  <span className={css.forLabel}>{proposal.votesFor} ({yesPercentage}%) PASS</span>
                  <div className={css.graph}>
                    <div className={css.forBar} style={styles.forBar}></div>
                    <div className={css.againstBar} style={styles.againstBar}></div>
                    <div className={css.divider}></div>
                  </div>
                  <span className={css.againstLabel}>{proposal.votesAgainst} ({noPercentage}%) FAIL</span>
              </div>
              : ""
            **/ }

            <div className={css.transactionInstructions}>
              <p>
                When you click "Launch MetaMask" we will pop up a Metamask dialogue.
                This dialogue will ask you to approve your transaction, including a small ETH cost.
                It will set a default gas limit and gas price. It's fine to stick with these defaults.
                You can also consult <a href="https://ethgasstation.info/calculatorTxV.php" target='_blank'>this calculator</a> to adjust the gas price.
              </p>
              { (actionType == ActionTypes.StakeFail || actionType == ActionTypes.StakePass) && (stakeAmount <= 0 || stakeAmount > currentAccountGens) ?
                <Tooltip placement="left" trigger={['hover']} overlay={this.state.stakeAmount <= 0 ? 'Please enter a positive amount' : 'Insufficient GENs'}>
                  <button
                    className={classNames({[css.launchMetaMask]: true, [css.disabled]: true})}
                    disabled={true}
                    onClick={this.handleClickAction.bind(this)}
                    data-test-id="launch-metamask"
                  >
                    {transactionType} with MetaMask
                  </button>
                </Tooltip> :
                <button className={css.launchMetaMask} onClick={this.handleClickAction.bind(this)} data-test-id="launch-metamask">
                  <img src="/assets/images/Tx/MetaMask.svg"/>
                  {transactionType} with MetaMask
                </button>
              }
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}
