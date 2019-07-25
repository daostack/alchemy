import { Address, IDAOState, IProposalStage, IProposalState, IStake } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import * as web3Actions from "actions/web3Actions";
import { enableWeb3ProviderAndWarn, getArc } from "arc";

import BN = require("bn.js");
import * as classNames from "classnames";
import { ActionTypes, default as PreTransactionModal } from "components/Shared/PreTransactionModal";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { formatTokens } from "lib/util";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { connect } from "react-redux";
//@ts-ignore
import { Modal } from "react-router-modal";
import { IRootState } from "reducers";
import { VoteOptions } from "reducers/arcReducer";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import { combineLatest, of } from "rxjs";
import { isStakePending } from "selectors/operations";

import * as css from "./StakeButtons.scss";

interface IState {
  pendingPrediction: number;
  showApproveModal: boolean;
  showPreStakeModal: boolean;
}

interface IContainerProps {
  proposal: IProposalState;
  beneficiaryProfile?: IProfileState;
  contextMenu?: boolean;
  currentAccountAddress?: Address;
  dao: IDAOState;
  detailView?: boolean;
  expired?: boolean;
  historyView?: boolean;
}

interface IDispatchProps {
  stakeProposal: typeof arcActions.stakeProposal;
  showNotification: typeof showNotification;
  approveStakingGens: typeof web3Actions.approveStakingGens;
}

interface IStateProps {
  isPredictingFail: boolean;
  isPredictingPass: boolean;
}

const mapDispatchToProps = {
  approveStakingGens: web3Actions.approveStakingGens,
  stakeProposal: arcActions.stakeProposal,
  showNotification,
};

type IProps = IStateProps & IDispatchProps & IContainerProps & {
  currentAccountGens: BN;
  currentAccountGenStakingAllowance: BN;
  stakesOfCurrentUser: IStake[];
};

const mapStateToProps = (state: IRootState, ownProps: IContainerProps): IStateProps => {

  return {
    ...ownProps,
    isPredictingPass: isStakePending(ownProps.proposal.id, VoteOptions.Yes)(state),
    isPredictingFail: isStakePending(ownProps.proposal.id, VoteOptions.No)(state),
  };
};

class StakeButtons extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      pendingPrediction: null,
      showApproveModal: false,
      showPreStakeModal: false,
    };
  }

  public showApprovalModal = (_event: any): void => {
    this.setState({ showApproveModal: true });
  }

  public closeApprovalModal = (_event: any): void => {
    this.setState({ showApproveModal: false });
  }

  public closePreStakeModal = (_event: any): void => {
    this.setState({ showPreStakeModal: false });
  }

  public showPreStakeModal = (prediction: number): (_event: any) => void => (_event: any): void => {
    if (!this.props.currentAccountAddress) {
      enableWeb3ProviderAndWarn(this.props.showNotification.bind(this));
    } else {
      this.setState({ pendingPrediction: prediction, showPreStakeModal: true });
    }
  }

  public handleClickPreApprove = async (_event: any): Promise<void> => {
    if (!(await enableWeb3ProviderAndWarn(this.props.showNotification.bind(this)))) { return; }
    const { approveStakingGens } = this.props;
    approveStakingGens(this.props.proposal.votingMachine);
    this.setState({ showApproveModal: false });
  }

  public render(): any {
    const {
      beneficiaryProfile,
      contextMenu,
      currentAccountGens,
      currentAccountGenStakingAllowance,
      dao,
      detailView,
      expired,
      historyView,
      proposal,
      isPredictingFail,
      isPredictingPass,
      stakeProposal,
      stakesOfCurrentUser,
    } = this.props;

    const {
      pendingPrediction,
      showApproveModal,
      showPreStakeModal,
    } = this.state;

    let currentStake: IStake;
    let currentAccountPrediction = 0;
    if (stakesOfCurrentUser.length > 0) {
      currentStake = stakesOfCurrentUser[0];
    }
    if (currentStake) {
      currentAccountPrediction = currentStake.outcome;
    }

    const isPredicting = isPredictingFail || isPredictingPass;

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
              <div>
                <button onClick={this.handleClickPreApprove} data-test-id="button-preapprove">Preapprove</button>
              </div>
            </div>
          </div>
        </Modal>
      );
    }

    const wrapperClass = classNames({
      [css.predictions]: true,
      [css.contextMenu]: contextMenu,
      [css.detailView]: detailView,
      [css.historyView]: historyView,
      [css.unconfirmedPrediction]: isPredicting,
    });

    const stakingEnabled = (proposal.stage === IProposalStage.Queued && !expired) ||
      (proposal.stage === IProposalStage.PreBoosted);

    const hasGens = currentAccountGens.gt(new BN(0));
    // show staking buttons when !this.props.currentAccountAddress, even if no GENs
    const disableStakePass = (this.props.currentAccountAddress && !hasGens) || currentAccountPrediction === VoteOptions.No;
    const disableStakeFail = (this.props.currentAccountAddress && !hasGens) || currentAccountPrediction === VoteOptions.Yes;

    const passButtonClass = classNames({
      [css.pendingPrediction]: isPredictingPass,
      [css.passButton]: true,
    });

    const failButtonClass = classNames({
      [css.pendingPrediction]: isPredictingFail,
      [css.failButton]: true,
    });

    const tip = (prediction: VoteOptions) =>
      !hasGens ?
        "Insufficient GENs" :
        currentAccountPrediction === prediction ?
          "Can't change prediction" :
          isPredicting ?
            "Warning: Staking on this proposal is already in progress" :
            ""
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
    if (stakingEnabled && (this.props.currentAccountAddress && currentAccountGenStakingAllowance.eq(new BN(0)))) {
      return (
        <div className={wrapperClass}>
          <div className={css.enablePredictions}>
            <button onClick={this.showApprovalModal} data-test-id="button-enable-predicting">Enable Predicting</button>
          </div>
        </div>
      );
    }

    return (
      <div className={wrapperClass}>
        {showPreStakeModal ?
          <PreTransactionModal
            actionType={pendingPrediction === VoteOptions.Yes ? ActionTypes.StakePass : ActionTypes.StakeFail}
            action={(amount: number) => { stakeProposal(proposal.dao.address, proposal.id, pendingPrediction, amount); }}
            beneficiaryProfile={beneficiaryProfile}
            closeAction={this.closePreStakeModal.bind(this)}
            currentAccountGens={currentAccountGens}
            dao={dao}
            proposal={proposal}
            secondaryHeader={"> " + formatTokens(proposal.upstakeNeededToPreBoost, "GEN") + " for boost!"}
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
                (!this.props.currentAccountAddress ? "" : tip(VoteOptions.No) !== "") ?
                  <Tooltip placement="left" trigger={["hover"]} overlay={tip(VoteOptions.No)}>
                    {passButton}
                  </Tooltip> :
                  passButton
              }
              {
                (!this.props.currentAccountAddress ? "" : tip(VoteOptions.Yes) !== "") ?
                  <Tooltip placement="left" trigger={["hover"]} overlay={tip(VoteOptions.Yes)}>
                    {failButton}
                  </Tooltip> :
                  failButton
              }
            </div>
            : <span className={css.disabledPredictions}>
              Predictions are disabled
            </span>
          }
        </div>
      </div>
    );
  }
}

const ConnectedStakeButtons = connect(mapStateToProps, mapDispatchToProps)(StakeButtons);

export default (props: IContainerProps) => {

  const arc = getArc();
  let observable;

  const spender = props.proposal.votingMachine;
  const currentAccountAddress = props.currentAccountAddress;
  if (currentAccountAddress) {
    observable = combineLatest(
      arc.GENToken().balanceOf(currentAccountAddress),
      arc.allowance(currentAccountAddress, spender),
      props.proposal.proposal.stakes({where: { staker: currentAccountAddress }})
    );
  } else {
    observable = combineLatest(
      of(new BN("0")),
      of(undefined),
      of([]),
    );
  }
  return <Subscribe observable={observable}>{
    (state: IObservableState<[BN, any, IStake[]]>): any => {
      if (state.isLoading) {
        return <div>Loading PredictionBox</div>;
      } else if (state.error) {
        return <div>{state.error.message}</div>;
      } else {
        const currentAccountGens = state.data[0] || new BN(0);
        const currentAccountGenStakingAllowance = new BN(state.data[1]);
        const stakes = state.data[2];
        return <ConnectedStakeButtons {...props}
          currentAccountGens={currentAccountGens}
          currentAccountGenStakingAllowance={currentAccountGenStakingAllowance}
          stakesOfCurrentUser={stakes}
        />;
      }
    }
  }</Subscribe>;
};
