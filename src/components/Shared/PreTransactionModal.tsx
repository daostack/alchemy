import { IDAOState, IMemberState, IProposalStage, IProposalState } from "@daostack/client";
import BN = require("bn.js");
import * as classNames from "classnames";
import ReputationView from "components/Account/ReputationView";
import TransferDetails from "components/Proposal/TransferDetails";
import VoteGraph from "components/Proposal/VoteGraph";
import Util from "lib/util";
import { checkNetworkAndWarn, humanProposalTitle } from "lib/util";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { connect } from "react-redux";
//@ts-ignore
import { Modal } from "react-router-modal";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import * as css from "./PreTransactionModal.scss";

export enum ActionTypes {
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
  currentAccount?: IMemberState;
  currentAccountGens?: BN;
  dao: IDAOState;
  effectText?: string | JSX.Element;
  proposal: IProposalState;
  secondaryHeader?: string;
  showNotification: typeof showNotification;
}

interface IState {
  instructionsOpen: boolean;
  stakeAmount: number;
}

const mapDispatchToProps = {
  showNotification
};

class PreTransactionModal extends React.Component<IProps, IState> {

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
    if (!checkNetworkAndWarn(this.props.showNotification)) { return; }

    if (actionType === ActionTypes.StakeFail || actionType === ActionTypes.StakePass) {
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

    let icon, transactionType, rulesHeader, rules, actionTypeClass;
    let accountGens, buyGensClass, reputationFor, reputationAgainst, yesPercentage, noPercentage;

    if (actionType === ActionTypes.VoteDown || actionType === ActionTypes.VoteUp) {
      reputationFor = proposal.votesFor.add(actionType === ActionTypes.VoteUp ? currentAccount.reputation : new BN(0));
      reputationAgainst = proposal.votesAgainst.add(actionType === ActionTypes.VoteDown ? currentAccount.reputation : new BN(0));

      const totalReputation = Util.fromWei(dao.reputationTotalSupply);

      // If percentages are less than 2 then set them to 2 so they can be visibly noticed
      yesPercentage = totalReputation && reputationFor.gt(new BN(0)) ? Math.max(2, Math.ceil(Util.fromWei(reputationFor) / totalReputation * 100)) : 0;
      noPercentage = totalReputation && reputationAgainst.gt(new BN(0)) ? Math.max(2, Math.ceil(Util.fromWei(reputationAgainst) / totalReputation * 100)) : 0;
    }

    if (actionType === ActionTypes.StakeFail || actionType === ActionTypes.StakePass) {
      accountGens = Util.fromWei(currentAccountGens);

      buyGensClass = classNames({
        [css.genError]: true,
        [css.hidden]: this.state.stakeAmount <= accountGens
      });
    }

    switch (actionType) {
      case ActionTypes.VoteUp:
        actionTypeClass = css.voteUp;
        icon = <img src="/assets/images/Icon/vote/for-fill-green.svg" />;
        transactionType = <span><strong className={css.passVote}>Pass</strong> vote</span>;
        // TODO: check if the commented lines are correctly refactored
        // passIncentive = proposal.state === ProposalStates.PreBoosted ? <span>GAIN GEN &amp; REPUTATION</span> : <span>NO REWARDS</span>;
        // failIncentive = proposal.state === ProposalStates.PreBoosted ? <span>LOSE 1% OF YOUR REPUTATION</span> : <span>NO REWARDS</span>;
        // passIncentive = proposal.stage === IProposalStage.Queued ? <span>GAIN GEN &amp; REPUTATION</span> : <span>NO REWARDS</span>;
        // failIncentive = proposal.stage === IProposalStage.Queued ? <span>LOSE 1% OF YOUR REPUTATION</span> : <span>NO REWARDS</span>;
        rulesHeader = "RULES FOR YES VOTES";
        rules = <div>
                  <p>When you vote on a regular proposal, 1% of your reputation is taken away for the duration of the vote. You will get the 1% back + an extra reputation reward if you vote correctly (e.g. vote Pass on a proposal that passes or vote Fail on a proposal that fails). If you vote on a regular proposal that times-out, you will get your reputation back.</p>
                  <p>If you vote Pass and the proposal passes you will be given a portion of whatever GEN have been staked on the proposal.</p>
                  <p>If you vote Fail and the proposal fails you will be given a portion of whatever GEN have been staked on the proposal.</p>
                  <p>You will not receive reputation or GEN for voting on a boosted proposal.</p>
                </div>;
        break;
      case ActionTypes.VoteDown:
        actionTypeClass = css.voteDown;
        icon = <img src="/assets/images/Icon/vote/against.svg" />;
        transactionType = <span><strong className={css.failVote}>Fail</strong> vote</span>;
        // TODO: check if the commented lines are correctly refactored
        // passIncentive = proposal.stage === IProposalStage.Queued ? <span>LOSE 1% YOUR REPUTATION</span> : <span>NO REWARDS</span>;
        // failIncentive = proposal.stage === IProposalStage.Queued ? <span>GAIN REPUTATION AND GEN</span> : <span>NO REWARDS</span>;
        rulesHeader = "RULES FOR NO VOTES";
        rules = <div>
                  <p>When you vote on a regular proposal, 1% of your reputation is taken away for the duration of the vote. You will get the 1% back + an extra reputation reward if you vote correctly (e.g. vote Pass on a proposal that passes or vote Fail on a proposal that fails). If you vote on a regular proposal that times-out, you will get your reputation back.</p>
                  <p>If you vote for something to pass and it does, you will be given a portion of whatever GEN have been staked on the proposal.</p>
                  <p>If you vote for something to fail and it does, you will be given a portion of whatever GEN have been staked on the proposal.</p>
                  <p>You will not receive reputation or GEN for voting on a boosted proposal.</p>
                </div>;
        break;
      case ActionTypes.StakePass:
        actionTypeClass = css.stakePass;
        icon = <img src="/assets/images/Icon/v-white.svg"/>;
        transactionType = <span><strong className={css.passVote}>Pass</strong> prediction</span>;

        // passIncentive = <span>YOU GAIN GEN AND REPUTATION</span>;
        // failIncentive = <span>LOSE YOUR STAKE</span>;
        rulesHeader = "RULES FOR PASS PREDICTIONS";
        rules = <div>
                  <p>When you predict correctly you gain (1) GEN from the DAO bounty. (2) A portion of GEN from incorrect predictions.</p>
                  <p>When you predict correctly, you receive some reputation from other voters who didn't vote correctly on the proposal.</p>
                  <p>When you predict incorrectly you simply lose all the GEN you have staked.</p>
                </div>;
        break;
      case ActionTypes.StakeFail:
        actionTypeClass = css.stakeFail;
        icon = <img src="/assets/images/Icon/x-white.svg"/>;
        transactionType = <span><strong className={css.failVote}>Fail</strong> prediction</span>;
        // passIncentive = <span>LOSE YOUR STAKE</span>;
        // failIncentive = <span>YOU GAIN GEN AND REPUTATION</span>;
        rulesHeader = "RULES FOR FAIL PREDICTIONS";
        rules = <div>
                  <p>When you predict correctly you gain (1) GEN from the DAO bounty. (2) A portion of GEN from incorrect predictions.</p>
                  <p>When you predict correctly, you receive some reputation from other voters who didn't vote correctly on the proposal.</p>
                  <p>When you predict incorrectly you simply lose all the GEN you have staked.</p>
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
            <div className={css.transactionHeader + " " + css.clearfix + " " + actionTypeClass}>
              <div className={css.transactionIcon}>{icon}</div>
              <div className={css.transactionInfo}>
                <span className={css.transactionType}>{transactionType}</span>
                &nbsp; | &nbsp;
                <span className={css.secondaryHeader}>{secondaryHeader}</span>
                <div className={css.transactionEffect}>
                {effectText}
                </div>
              </div>
              {actionType != ActionTypes.Redeem && actionType != ActionTypes.Execute ?
                <div className={css.helpButton}>
                  <button className={css.hover}  onClick={this.toggleInstructions.bind(this)}>?</button>
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
                      <a href="https://docs.google.com/document/d/1LMe0S4ZFWELws1-kd-6tlFmXnlnX9kfVXUNzmcmXs6U/edit?usp=drivesdk" target="_blank">View the Genesis Protocol</a>
                    </div>
                  </span>
                </div> : ""
              }
            </div>
            <div className={css.proposalInfo}>
              <div className={css.proposalTitle}>
                <strong>{humanProposalTitle(proposal)}</strong>
              </div>
              <TransferDetails beneficiaryProfile={beneficiaryProfile} proposal={proposal} dao={dao} transactionModal={true}/>
            </div>
            { /******* Staking form ******  **/
              actionType === ActionTypes.StakeFail || actionType === ActionTypes.StakePass ?
              <div className={css.stakingInfo + " " + css.clearfix}>
                <div className={css.stakingForm}>
                  <span className={css.yourStakeTitle}>Your stake</span>
                  <div className={buyGensClass}>
                    <h4>
                      You do not have enough GEN
                      <span>YOUR STAKE: {stakeAmount} - WALLET BALANCE: {accountGens}</span>
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
                    <input
                      autoFocus={true}
                      type="number"
                      min="1"
                      ref={(input) => { this.stakeInput = input; }}
                      className={css.predictionAmount}
                      onChange={(e) => this.setState({stakeAmount: Number(e.target.value)})}
                      value={stakeAmount}
                    />
                    <span className={css.genLabel + " " + css.genSymbol}>GEN</span>
                    <span>Your balance: {accountGens} GEN</span>
                  </div>
                </div>
              </div> : ""
            }
            {actionType === ActionTypes.VoteDown || actionType === ActionTypes.VoteUp ?
              <div className={css.decisionGraph}>
                 <h3>State after your vote</h3>
                 <div className={css.clearfix}>
                   <div className={css.graphContainer}>
                     <VoteGraph size={90} yesPercentage={yesPercentage} noPercentage={noPercentage} relative={proposal.stage === IProposalStage.Boosted} />
                   </div>
                   <div className={css.graphInfo}>
                     <div>
                       <img src="/assets/images/Icon/vote/for.svg"/>
                       For <ReputationView daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={reputationFor} />
                     </div>
                     <div>
                       <img src="/assets/images/Icon/vote/against.svg"/>
                       Against <ReputationView daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={reputationAgainst} />
                     </div>
                 </div>
                 </div>
              </div>
              : ""
            }
          {/*
        <div className={css.transactionInstructions}>

          <p>
            When you click "Launch MetaMask" we will pop up a Metamask dialogue.
            This dialogue will ask you to approve your transaction, including a small ETH cost.
            It will set a default gas limit and gas price. It's fine to stick with these defaults.
            You can also consult <a href="https://ethgasstation.info/calculatorTxV.php" target='_blank'>this calculator</a> to adjust the gas price.
          </p>

        </div>
           */}
            { (actionType === ActionTypes.StakeFail || actionType === ActionTypes.StakePass) && (stakeAmount <= 0 || stakeAmount > accountGens) ?
              <Tooltip placement="left" trigger={["hover"]} overlay={this.state.stakeAmount <= 0 ? "Please enter a positive amount" : "Insufficient GENs"}>
                <button
                  className={classNames({[css.launchMetaMask]: true, [css.disabled]: true})}
                  disabled={true}
                  onClick={this.handleClickAction.bind(this)}
                  data-test-id="launch-metamask"
                >
                  {transactionType}
                </button>
              </Tooltip> :
              <div className={css.preTransactionBottom}>
                <div className={css.closeTransactionContainer}>
                  <button onClick={this.props.closeAction}>
                    Cancel
                  </button>
                </div>
                <button className={css.launchMetaMask} onClick={this.handleClickAction.bind(this)} data-test-id="launch-metamask">
                  {transactionType}
                </button>
              </div>
            }
          </div>
        </div>
      </Modal>
    );
  }
}

export default connect(null, mapDispatchToProps)(PreTransactionModal);
