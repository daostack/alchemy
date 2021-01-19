import { Address, IDAOState, IProposalOutcome, IProposalStage, IProposalState, Stake } from "@daostack/arc.js";
import { approveStakingGens, stakeProposal } from "@store/arc/arcActions";
import { enableWalletProvider } from "arc";

import * as BN from "bn.js";
import classNames from "classnames";
import Analytics from "lib/analytics";
import { formatTokens, getNetworkByDAOAddress } from "lib/util";
import { ActionTypes, default as PreTransactionModal } from "components/Shared/PreTransactionModal";
import { Page } from "pages";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { connect } from "react-redux";
import { Modal } from "react-router-modal";
import { showNotification } from "@store/notifications/notifications.reducer";
import { IProfileState } from "@store/profiles/profilesReducer";

import * as css from "./StakeButtons.scss";

interface IState {
  pendingPrediction: number;
  showApproveModal: boolean;
  showPreStakeModal: boolean;
}

interface IExternalProps {
  proposal: IProposalState;
  beneficiaryProfile?: IProfileState;
  contextMenu?: boolean;
  currentAccountAddress?: Address;
  currentAccountGens: BN | null;
  currentAccountGenStakingAllowance: BN;
  dao: IDAOState;
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

  public showApprovalModal = async (_event: any): Promise<void> => {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification }, getNetworkByDAOAddress(this.props.dao.address))) { return; }

    this.setState({ showApproveModal: true });
  }

  public closeApprovalModal = (_event: any): void => {
    this.setState({ showApproveModal: false });
  }

  public closePreStakeModal = (_event: any): void => {
    this.setState({ showPreStakeModal: false });
  }

  public showPreStakeModal = (prediction: number): (_event: any) => void => async (_event: any): Promise<void> => {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification }, getNetworkByDAOAddress(this.props.dao.address))) { return; }
    this.setState({ pendingPrediction: prediction, showPreStakeModal: true });
  }

  public handleCancelPreApprove = async (_event: any): Promise<void> => {
    this.setState({ showApproveModal: false });
  }

  public handleClickPreApprove = async (_event: any): Promise<void> => {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification }, getNetworkByDAOAddress(this.props.dao.address))) { return; }

    const { approveStakingGens } = this.props;
    approveStakingGens(this.props.proposal.votingMachine, this.props.dao.id);

    Analytics.track("Enable predictions");

    this.setState({ showApproveModal: false });
  }

  private getStakeProposalAction = (proposal: IProposalState, dao: IDAOState, pendingPrediction: number) =>
    (amount: number) => {
      this.props.stakeProposal(proposal.dao.id, proposal.id, pendingPrediction, amount);

      Analytics.track("Stake", {
        "DAO Address": proposal.dao.id,
        "DAO Name": dao.name,
        "GEN Staked": amount,
        "Proposal Hash": proposal.id,
        "Proposal TItle": proposal.title,
        "Scheme Address": proposal.scheme.address,
        "Scheme Name": proposal.scheme.name,
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
      dao,
      expired,
      parentPage,
      proposal,
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
      currentAccountPrediction = currentStake.staticState.outcome;
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
      [css.unconfirmedPrediction]: isPredicting,
    });

    const stakingEnabled = (proposal.stage === IProposalStage.Queued && !expired) ||
      (proposal.stage === IProposalStage.PreBoosted);

    const disabledMessage =
      (proposal.stage !== IProposalStage.Executed) ?
        ((proposal.stage === IProposalStage.Queued && expired) || proposal.stage === IProposalStage.ExpiredInQueue ? "Can't predict on expired proposals" :
          (proposal.stage === IProposalStage.Boosted || proposal.stage === IProposalStage.QuietEndingPeriod) ? "Can't predict on boosted proposals" : "")
        : "";

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
        <img className={css.stakeIcon} src="/assets/images/Icon/v.svg" /> Pass
      </button>
    );

    const failButton = (
      <button className={failButtonClass} onClick={disableStakeFail ? null : this.showPreStakeModal(2)}>
        <img className={css.stakeIcon} src="/assets/images/Icon/x.svg" /> Fail
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
            action={this.getStakeProposalAction(proposal, dao, pendingPrediction)}
            beneficiaryProfile={beneficiaryProfile}
            closeAction={this.closePreStakeModal}
            currentAccountGens={currentAccountGens}
            dao={dao}
            parentPage={parentPage}
            proposal={proposal}

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

        <div className={contextMenu ? css.contextContent : ""}>
          {stakingEnabled ?
            <>
              {
                (currentAccountAddress && tip(IProposalOutcome.Fail) !== "") ?
                  <Tooltip placement="left" trigger={["hover"]} overlay={tip(IProposalOutcome.Fail)}>
                    {passButton}
                  </Tooltip> :
                  passButton
              }
              {parentPage !== Page.ProposalDetails && proposal.stage === IProposalStage.Queued && !expired && proposal.upstakeNeededToPreBoost.gten(0) ?
                <div className={css.toBoostMessage}>&gt; {formatTokens(proposal.upstakeNeededToPreBoost, "GEN to boost")}</div>
                : ""}
              {
                (currentAccountAddress && tip(IProposalOutcome.Pass) !== "") ?
                  <Tooltip placement="left" trigger={["hover"]} overlay={tip(IProposalOutcome.Pass)}>
                    {failButton}
                  </Tooltip> :
                  failButton
              }
              {parentPage !== Page.ProposalDetails && proposal.stage === IProposalStage.PreBoosted && !expired && proposal.downStakeNeededToQueue.gtn(0) ?
                <div className={css.toBoostMessage}>&gt;= {formatTokens(proposal.downStakeNeededToQueue, " GEN to un-boost")}</div>
                : ""}
            </>
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
