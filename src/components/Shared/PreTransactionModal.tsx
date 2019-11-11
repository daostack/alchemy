import { IDAOState, IMemberState, IProposalState  } from "@daostack/client";
import { enableWalletProvider } from "arc";

import BN = require("bn.js");
import * as classNames from "classnames";
import Reputation from "components/Account/Reputation";
import ProposalSummary from "components/Proposal/ProposalSummary";
import VoteGraph from "components/Proposal/Voting/VoteGraph";
import { formatTokens, fromWei } from "lib/util";
import { getExchangesList, humanProposalTitle } from "lib/util";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { connect } from "react-redux";
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
  multiLineMsg?: boolean;
}

interface IState {
  instructionsOpen: boolean;
  stakeAmount: number;
}

const mapDispatchToProps = {
  showNotification,
};

class PreTransactionModal extends React.Component<IProps, IState> {

  public stakeInput: any;

  constructor(props: IProps) {
    super(props);

    this.state = {
      instructionsOpen: false,
      stakeAmount: 0,
    };
  }

  public async handleClickAction() {
    const { actionType, showNotification } = this.props;
    if (!await enableWalletProvider({ showNotification })) { return; }

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

  public render(): RenderOutput {
    const { actionType, beneficiaryProfile, currentAccount, currentAccountGens, dao, effectText, multiLineMsg, proposal, secondaryHeader } = this.props;
    const { stakeAmount } = this.state;

    let icon; let transactionType; let rulesHeader; let rules; let actionTypeClass;
    let accountGens; let buyGensClass; let reputationFor; let reputationAgainst;

    const modalWindowClass = classNames({
      [css.modalWindow]: true,
      [css.instructionsOpen]: this.state.instructionsOpen,
    });

    if (actionType === ActionTypes.VoteDown || actionType === ActionTypes.VoteUp) {
      reputationFor = proposal.votesFor.add(actionType === ActionTypes.VoteUp ? currentAccount.reputation : new BN(0));
      reputationAgainst = proposal.votesAgainst.add(actionType === ActionTypes.VoteDown ? currentAccount.reputation : new BN(0));
    }

    if (actionType === ActionTypes.StakeFail || actionType === ActionTypes.StakePass) {
      accountGens = fromWei(currentAccountGens);

      buyGensClass = classNames({
        [css.genError]: true,
        [css.hidden]: this.state.stakeAmount <= accountGens,
      });
    }

    switch (actionType) {
      case ActionTypes.VoteUp:
        actionTypeClass = css.voteUp;
        icon = <img src="/assets/images/Icon/vote/for-fill-green.svg" />;
        transactionType = <span><strong className={css.passVote}>For</strong> vote</span>;
        rulesHeader = "RULES FOR YES VOTES";
        rules = <div>
          <p>When you vote on a regular proposal, 1% of your reputation is taken away for the duration of the vote. You will get the 1% back + an extra reputation reward if you vote correctly (e.g. vote For on a proposal that passes or vote Against on a proposal that fails). If you vote on a regular proposal that times-out, you will get your reputation back.</p>
          <p>If you vote For and the proposal passes you will be given a portion of whatever GEN have been staked on the proposal.</p>
          <p>If you vote Against and the proposal fails you will be given a portion of whatever GEN have been staked on the proposal.</p>
          <p>You will not receive reputation or GEN for voting on a boosted proposal.</p>
          <div className={css.notification}>
            <img src="/assets/images/Icon/Alert-yellow.svg"/> You will not receive reputation or GEN for voting on a boosted proposal.
          </div>
          <a className={css.genesisProtocolLink} href="https://docs.google.com/document/d/1LMe0S4ZFWELws1-kd-6tlFmXnlnX9kfVXUNzmcmXs6U/edit?usp=drivesdk" target="_blank" rel="noopener noreferrer">View the Genesis Protocol &gt;</a>
          <div className={css.passFailConditions}>
            <span className={css.passCondition}>
                      If you vote For and the proposal passes you will be given a portion of whatever GEN have been staked on the proposal.
            </span>
            <span className={css.failCondition}>
                      If you vote Against and the proposal fails you will be given a portion of whatever GEN have been staked on the proposal.
            </span>
          </div>
        </div>;
        break;
      case ActionTypes.VoteDown:
        actionTypeClass = css.voteDown;
        icon = <img src="/assets/images/Icon/vote/against.svg" />;
        transactionType = <span><strong className={css.failVote}>Against</strong> vote</span>;
        rulesHeader = "RULES FOR NO VOTES";
        rules = <div>
          <p>When you vote on a regular proposal, 1% of your reputation is taken away for the duration of the vote. You will get the 1% back + an extra reputation reward if you vote correctly (e.g. vote For on a proposal that passes or vote Against on a proposal that fails). If you vote on a regular proposal that times-out, you will get your reputation back.</p>
          <p>If you vote for something to pass and it does, you will be given a portion of whatever GEN have been staked on the proposal.</p>
          <p>If you vote for something to fail and it does, you will be given a portion of whatever GEN have been staked on the proposal.</p>
          <p>You will not receive reputation or GEN for voting on a boosted proposal.</p>
          <div className={css.notification}>
            <img src="/assets/images/Icon/Alert-yellow.svg"/> You will not receive reputation or GEN for voting on a boosted proposal.
          </div>
          <a className={css.genesisProtocolLink} href="https://docs.google.com/document/d/1LMe0S4ZFWELws1-kd-6tlFmXnlnX9kfVXUNzmcmXs6U/edit?usp=drivesdk" target="_blank" rel="noopener noreferrer">View the Genesis Protocol &gt;</a>
          <div className={css.passFailConditions}>
            <span className={css.passCondition}>
                      If you vote Against and the proposal passes you will be given a portion of whatever GEN have been staked on the proposal.
            </span>
            <span className={css.failCondition}>
                      If you vote Against and the proposal fails you will be given a portion of whatever GEN have been staked on the proposal.
            </span>
          </div>
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
          <p>When you predict correctly, you receive some reputation from other voters who didn&apos;t vote correctly on the proposal.</p>
          <p>When you predict incorrectly you simply lose all the GEN you have staked.</p>
          <div className={css.notification}>
            <img src="/assets/images/Icon/Alert-yellow.svg"/> You will not receive reputation or GEN for voting on a boosted proposal.
          </div>
          <a className={css.genesisProtocolLink} href="https://docs.google.com/document/d/1LMe0S4ZFWELws1-kd-6tlFmXnlnX9kfVXUNzmcmXs6U/edit?usp=drivesdk" target="_blank" rel="noopener noreferrer">View the Genesis Protocol &gt;</a>
          <div className={css.passFailConditions}>
            <span className={css.passCondition}>
                      If you vote For and the proposal passes you will be given a portion of whatever GEN have been staked on the proposal.
            </span>
            <span className={css.failCondition}>
                      If you vote Against and the proposal fails you will be given a portion of whatever GEN have been staked on the proposal.
            </span>
          </div>
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
          <p>When you predict correctly, you receive some reputation from other voters who didn&apos;t vote correctly on the proposal.</p>
          <p>When you predict incorrectly you simply lose all the GEN you have staked.</p>
          <div className={css.notification}>
            <img src="/assets/images/Icon/Alert-yellow.svg"/> You will not receive reputation or GEN for voting on a boosted proposal.
          </div>
          <a className={css.genesisProtocolLink} href="https://docs.google.com/document/d/1LMe0S4ZFWELws1-kd-6tlFmXnlnX9kfVXUNzmcmXs6U/edit?usp=drivesdk" target="_blank" rel="noopener noreferrer">View the Genesis Protocol &gt;</a>
          <div className={css.passFailConditions}>
            <span className={css.passCondition}>
                      If you vote For and the proposal passes you will be given a portion of whatever GEN have been staked on the proposal.
            </span>
            <span className={css.failCondition}>
                      If you vote Against and the proposal fails you will be given a portion of whatever GEN have been staked on the proposal.
            </span>
          </div>
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
          <div className={modalWindowClass}>
            <div className={css.transactionHeader + " clearfix " + actionTypeClass}>
              <div className={css.transactionIcon}>{icon}</div>
              <div className={css.transactionInfo}>
                <span className={css.transactionType}>{transactionType}</span>
                { !multiLineMsg ? <span className={css.titleSeparator}>|</span>: "" }
                <span className={css.secondaryHeader}>{secondaryHeader}</span>
                <div className={css.transactionEffect}>
                  {effectText}
                </div>
              </div>
              {actionType !== ActionTypes.Redeem && actionType !== ActionTypes.Execute ?
                <div className={classNames({[css.helpButton]: true, [css.open]: this.state.instructionsOpen})}>
                  <button className={css.hover}  onClick={this.toggleInstructions.bind(this)}>
                    <b> &lt; Got it</b>
                    <span>x</span>
                    <span>?</span>
                  </button>
                </div> : ""
              }
            </div>
            <div className={css.preTransactionContent}>
              <span className={classNames({[css.help]: true, [css.hidden]: !this.state.instructionsOpen})}>
                <div className={css.helpBox}>
                  <div className={css.bg}></div>
                  <div className={css.header}>
                  </div>
                  <div className={css.body}>
                    <h2>Genesis Protocol</h2>
                    <h3>{rulesHeader}</h3>
                    {rules}
                  </div>
                </div>
              </span>

              <div className={css.proposalInfo}>
                <div className={css.proposalTitle}>
                  <strong>{humanProposalTitle(proposal)}</strong>
                </div>
                <ProposalSummary beneficiaryProfile={beneficiaryProfile} proposal={proposal} dao={dao} transactionModal/>
              </div>
              { /******* Staking form ******  **/
                actionType === ActionTypes.StakeFail || actionType === ActionTypes.StakePass ?
                  <div className={css.stakingInfo + " clearfix"}>
                    <div className={css.stakingForm}>
                      <span className={css.yourStakeTitle}>Your stake</span>
                      <div className={buyGensClass}>
                        <h4>
                        You do not have enough GEN
                        </h4>
                      </div>
                      <div className={css.formGroup + " clearfix"}>
                        <input
                          autoFocus
                          type="number"
                          min="1"
                          ref={(input) => { this.stakeInput = input; }}
                          className={css.predictionAmount}
                          onChange={(e) => this.setState({stakeAmount: Number(e.target.value)})}
                          placeholder="0"
                        />
                        <span className={css.genLabel + " " + css.genSymbol}>GEN</span>
                        <div className={css.yourBalance}>
                          <div>Your balance: {formatTokens(currentAccountGens)} GEN</div>
                          <div className={css.exchangeList}>
                          Buy GEN &gt;
                            <ul>
                              <div className={css.diamond}></div>
                              {
                                getExchangesList().map((item: any) => {
                                  return(
                                    <li key={item.name}>
                                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                                        <b><img src={item.logo}/></b>
                                        <span>{item.name}</span>
                                      </a>
                                    </li>
                                  );
                                })
                              }
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div> : ""
              }
              {actionType === ActionTypes.VoteDown || actionType === ActionTypes.VoteUp ?
                <div className={css.decisionGraph}>
                  <h3>State after your vote</h3>
                  <div className="clearfix">
                    <div className={css.graphContainer}>
                      <VoteGraph
                        newVotesAgainst={actionType === ActionTypes.VoteDown ? currentAccount.reputation : new BN(0)}
                        newVotesFor={actionType === ActionTypes.VoteUp ? currentAccount.reputation : new BN(0)}
                        proposal={proposal}
                        size={90}
                      />
                    </div>
                    <div className={css.graphInfo}>
                      <div>
                        <img src="/assets/images/Icon/vote/for.svg"/>
                         For <Reputation daoName={dao.name} totalReputation={proposal.totalRepWhenCreated} reputation={reputationFor} />
                      </div>
                      <div>
                        <img src="/assets/images/Icon/vote/against.svg"/>
                         Against <Reputation daoName={dao.name} totalReputation={proposal.totalRepWhenCreated} reputation={reputationAgainst} />
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
              {
                <div className={css.preTransactionBottom}>
                  <div className={css.closeTransactionContainer}>
                    <button onClick={this.props.closeAction}>
                      Cancel
                    </button>
                  </div>
                  { (actionType === ActionTypes.StakeFail || actionType === ActionTypes.StakePass) && (stakeAmount <= 0 || stakeAmount > accountGens) ?
                    <Tooltip placement="left" trigger={["hover"]} overlay={this.state.stakeAmount <= 0 ? "Please enter a positive amount" : "Insufficient GENs"}>
                      <button
                        className={classNames({[css.launchMetaMask]: true, [css.disabled]: true})}
                        disabled
                        onClick={this.handleClickAction.bind(this)}
                        data-test-id="launch-metamask"
                      >
                        {transactionType}
                      </button>
                    </Tooltip>
                    :
                    <button className={css.launchMetaMask} onClick={this.handleClickAction.bind(this)} data-test-id="launch-metamask">
                      {transactionType}
                    </button>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

export default connect(null, mapDispatchToProps)(PreTransactionModal);
