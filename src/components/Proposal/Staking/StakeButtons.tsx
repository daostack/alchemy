import { Address, IDAOState, IProposalOutcome, IProposalStage, IProposalState, Stake } from "@dorgtech/arc.js";
import { approveStakingGens, stakeProposal } from "actions/arcActions";
import { enableWalletProvider } from "arc";

import BN = require("bn.js");
import classNames from "classnames";
import Analytics from "lib/analytics";
import { formatTokens } from "lib/util";
import { ActionTypes, default as PreTransactionModal } from "components/Shared/PreTransactionModal";
import { Page } from "pages";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { connect } from "react-redux";
import { Modal } from "react-router-modal";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";

import * as css from "./StakeButtons.scss";

interface IState {
  pendingPrediction: number;
  showApproveModal: boolean;
  showPreStakeModal: boolean;
}

interface IExternalProps {
  proposalState: IProposalState;
  beneficiaryProfile?: IProfileState;
  contextMenu?: boolean;
  currentAccountAddress?: Address;
  currentAccountGens: BN|null;
  currentAccountGenStakingAllowance: BN;
  daoState: IDAOState;
  expired?: boolean;
  parentPage: Page;
  stakes: Stake[];
}

interface IDispatchProps {
  stakeProposal: typeof stakeProposal;
  showNotification: typeof showNotification;
  approveStakingGens: typeof approveStakingGens;
}

const mapDispatchToProps = {
  approveStakingGens,
  stakeProposal,
  showNotification,
};

type IProps = IExternalProps & IDispatchProps;

class StakeButtons extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      pendingPrediction: null,
      showApproveModal: false,
      showPreStakeModal: false,
    };
  }

  public async componentDidMount() {
    await this.props.proposalState.plugin.entity.fetchState()
  }

  public showApprovalModal = async (_event: any): Promise<void> => {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    this.setState({ showApproveModal: true });
  }

  public closeApprovalModal = (_event: any): void => {
    this.setState({ showApproveModal: false });
  }

  public closePreStakeModal = (_event: any): void => {
    this.setState({ showPreStakeModal: false });
  }

  public showPreStakeModal = (prediction: number): (_event: any) => void => async (_event: any): Promise<void> => {
    if (!await enableWalletProvider( { showNotification: this.props.showNotification })) { return; }
    this.setState({ pendingPrediction: prediction, showPreStakeModal: true });
  }

  public handleCancelPreApprove = async (_event: any): Promise<void> => {
    this.setState({ showApproveModal: false });
  }

  public handleClickPreApprove = async (_event: any): Promise<void> => {
    if (!await enableWalletProvider( { showNotification: this.props.showNotification })) { return; }

    const { approveStakingGens } = this.props;
    approveStakingGens(this.props.proposalState.votingMachine);

    Analytics.track("Enable predictions");

    this.setState({ showApproveModal: false });
  }

  private getStakeProposalAction = (proposalState: IProposalState, daoState: IDAOState, pendingPrediction: number) =>
    (amount: number) => {
      this.props.stakeProposal(daoState.id, proposalState.id, pendingPrediction, amount);

      Analytics.track("Stake", {
        "DAO Address": daoState.id,
        "DAO Name": daoState.name,
        "GEN Staked": amount,
        "Proposal Hash": proposalState.id,
        "Proposal TItle": proposalState.title,
        "Plugin Address": proposalState.plugin.entity.coreState.address,
        "Plugin Name": proposalState.plugin.entity.coreState.name,
        "Stake Type": pendingPrediction === IProposalOutcome.Fail ? "Fail" : pendingPrediction === IProposalOutcome.Pass ? "Pass" : "None",
      });
    };

  public render(): RenderOutput {
    const {
      beneficiaryProfile,
      contextMenu,
      currentAccountAddress,
      currentAccountGens,
      currentAccountGenStakingAllowance,
      daoState,
      expired,
      parentPage,
      proposalState,
      stakes,
    } = this.props;

    const {
      pendingPrediction,
      showApproveModal,
      showPreStakeModal,
    } = this.state;

    let currentStake: Stake;
    let currentAccountPrediction = 0;
    if (stakes.length > 0) {
      currentStake = stakes[0];
    }
    if (currentStake) {
      currentAccountPrediction = currentStake.coreState.outcome;
    }

    const isPredicting = pendingPrediction !== null;

    if (showApproveModal) {
      return (
        <Modal onBackdropClick={this.closeApprovalModal}>
          <div className={css.preApproval}>
            <div className={css.preapproveWrapper}>
              <h3>Activate predictions</h3>
              <p>
                In order to activate predictions, you must authorize our smart
                contract to receive GENs from you. Upon activation, the smart contract
                will be authorized to receive up to 100000 GENs. This transaction will not
                cost you GEN or commit you in any way to spending your GENs in the future.
              </p>
              <div className={css.preapproveButtonsWrapper}>
                <button onClick={this.handleCancelPreApprove} data-test-id="button-cancel">Cancel</button>
                <button onClick={this.handleClickPreApprove} data-test-id="button-preapprove">Preapprove</button>
              </div>
            </div>
          </div>
        </Modal>
      );
    }

    const wrapperClass = classNames({
      [css.predictions]: true,
      [css.detailView]: parentPage === Page.ProposalDetails,
      [css.contextMenu]: contextMenu,
      [css.historyView]: parentPage === Page.DAOHistory,
      [css.unconfirmedPrediction]: isPredicting,
    });

    const stakingEnabled = (proposalState.stage === IProposalStage.Queued && !expired) ||
      (proposalState.stage === IProposalStage.PreBoosted);

    const disabledMessage =
      (proposalState.stage === IProposalStage.Queued && expired) || proposalState.stage === IProposalStage.ExpiredInQueue ? "Can't predict on expired proposals" :
        (proposalState.stage === IProposalStage.Boosted || proposalState.stage === IProposalStage.QuietEndingPeriod) ? "Can't predict on boosted proposals" :
          (proposalState.stage === IProposalStage.Executed) ? `Can't predict on ${proposalState.winningOutcome === IProposalOutcome.Pass ? "passed" : "failed"} proposals` : "";

    const hasGens = currentAccountGens && currentAccountGens.gt(new BN(0));

    // show staking buttons when !this.props.currentAccountAddress, even if no GENs
    const disableStakePass = (currentAccountAddress && !hasGens) || currentAccountPrediction === IProposalOutcome.Fail;
    const disableStakeFail = (currentAccountAddress && !hasGens) || currentAccountPrediction === IProposalOutcome.Pass;

    const passButtonClass = classNames({
      [css.pendingPrediction]: pendingPrediction === IProposalOutcome.Pass,
      [css.passButton]: true,
    });

    const failButtonClass = classNames({
      [css.pendingPrediction]: pendingPrediction === IProposalOutcome.Fail,
      [css.failButton]: true,
    });

    const tip = (prediction: IProposalOutcome) =>
      !hasGens ?
        "Insufficient GENs" :
        currentAccountPrediction === prediction ?
          "Can't change your prediction" : ""
      ;

    const passButton = (
      <button className={passButtonClass} onClick={disableStakePass ? null : this.showPreStakeModal(1)} data-test-id="stakePass">
        <img className={css.stakeIcon} src="/assets/images/Icon/v.svg"/> Pass
      </button>
    );

    const failButton = (
      <button className={failButtonClass} onClick={disableStakeFail ? null : this.showPreStakeModal(2)}>
        <img className={css.stakeIcon} src="/assets/images/Icon/x.svg"/> Fail
      </button>
    );

    // If don't have any staking allowance, replace with button to pre-approve
    // show staking buttons when !this.props.currentAccountAddress, even if no allowance
    if (stakingEnabled && (currentAccountAddress && currentAccountGenStakingAllowance && currentAccountGenStakingAllowance.eq(new BN(0)))) {
      return (
        <div className={wrapperClass}>

          {contextMenu ?
            <div className={css.contextTitle}>
              <div>
                <span>
                  Predict
                </span>
              </div>
            </div>
            : ""
          }

          <div className={css.enablePredictions}>
            <button onClick={this.showApprovalModal} data-test-id="button-enable-predicting">Enable Predictions</button>
          </div>
        </div>
      );
    }

    return (
      <div className={wrapperClass}>
        {showPreStakeModal ?
          <PreTransactionModal
            actionType={pendingPrediction === IProposalOutcome.Pass ? ActionTypes.StakePass : ActionTypes.StakeFail}
            action={this.getStakeProposalAction(proposalState, daoState, pendingPrediction)}
            beneficiaryProfile={beneficiaryProfile}
            closeAction={this.closePreStakeModal}
            currentAccountGens={currentAccountGens}
            daoState={daoState}
            parentPage={parentPage}
            proposalState={proposalState}

          /> : ""
        }

        {contextMenu ?
          <div className={css.contextTitle}>
            <div>
              <span>
                Predict
              </span>
            </div>
          </div>
          : ""
        }

        <div className={contextMenu ? css.contextContent : css.stakeControls}>
          {stakingEnabled ?
            <div>
              {
                (currentAccountAddress && tip(IProposalOutcome.Fail) !== "") ?
                  <Tooltip placement="left" trigger={["hover"]} overlay={tip(IProposalOutcome.Fail)}>
                    {passButton}
                  </Tooltip> :
                  passButton
              }
              {parentPage !== Page.ProposalDetails && proposalState.stage === IProposalStage.Queued && !expired && proposalState.upstakeNeededToPreBoost.gten(0) ?
                <div className={css.toBoostMessage}>&gt; {formatTokens(proposalState.upstakeNeededToPreBoost, "GEN to boost")}</div>
                : ""}
              {
                (currentAccountAddress && tip(IProposalOutcome.Pass) !== "") ?
                  <Tooltip placement="left" trigger={["hover"]} overlay={tip(IProposalOutcome.Pass)}>
                    {failButton}
                  </Tooltip> :
                  failButton
              }
              {parentPage !== Page.ProposalDetails && proposalState.stage === IProposalStage.PreBoosted && !expired && proposalState.downStakeNeededToQueue.gtn(0) ?
                <div className={css.toBoostMessage}>&gt;= {formatTokens(proposalState.downStakeNeededToQueue, " GEN to un-boost")}</div>
                : ""}
            </div>
            : <span className={css.disabledPredictions}>
              {disabledMessage}
            </span>
          }
        </div>
      </div>
    );
  }
}

export default connect(null, mapDispatchToProps)(StakeButtons);
