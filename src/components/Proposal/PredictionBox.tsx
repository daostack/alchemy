import { Address, IDAOState, IProposalStage, IProposalState, IStake } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import * as web3Actions from "actions/web3Actions";
import { checkNetworkAndWarn, getArc } from "arc";
import BN = require("bn.js");
import * as classNames from "classnames";
import { ActionTypes, default as PreTransactionModal } from "components/Shared/PreTransactionModal";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import Util from "lib/util";
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

import * as css from "./Proposal.scss";

interface IState {
  pendingPrediction: number;
  showApproveModal: boolean;
  showPreStakeModal: boolean;
}

interface IContainerProps {
  proposal: IProposalState;
  beneficiaryProfile?: IProfileState;
  currentAccountAddress: Address;
  dao: IDAOState;
  detailView?: boolean;
  expired?: boolean;
  historyView?: boolean;
  threshold: number;
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
  showNotification
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

class PredictionBox extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      pendingPrediction: null,
      showApproveModal: false,
      showPreStakeModal: false
    };
  }

  public showApprovalModal = (event: any) => {
    this.setState({ showApproveModal: true });
  }

  public closeApprovalModal = (event: any) => {
    this.setState({ showApproveModal: false });
  }

  public closePreStakeModal = (event: any) => {
    this.setState({ showPreStakeModal: false });
  }

  public showPreStakeModal = (prediction: number) => (event: any) => {
    this.setState({ pendingPrediction: prediction, showPreStakeModal: true });
  }

  public handleClickPreApprove = async (event: any) => {
    if (!(await checkNetworkAndWarn(this.props.showNotification))) { return; }
    const { approveStakingGens } = this.props;
    approveStakingGens(this.props.dao.address);
    this.setState({ showApproveModal: false });
  }

  public render() {
    const {
      beneficiaryProfile,
      currentAccountGens,
      currentAccountGenStakingAllowance,
      dao,
      detailView,
      expired,
      historyView,
      proposal,
      isPredictingFail,
      isPredictingPass,
      threshold,
      stakeProposal,
      stakesOfCurrentUser
    } = this.props;

    const {
      pendingPrediction,
      showApproveModal,
      showPreStakeModal
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
            <div className={css.preapproveBackdrop} onClick={this.closeApprovalModal}></div>
            <div className={css.preapproveWrapper}>
            <h3>Activate predictions</h3>
              <p>
                In order to activate predictions, you must authorize our smart
                contract to receive GENs from you. Upon activation, the smart contract
                will be authorized to receive up to 100000 GENs. This transaction will not
                cost you GEN or commit you in any way to spending your GENs in the future.
              </p>
              <p>
                Once you click the button below, we will pop-up a MetaMask dialogue.
                It will set a default gas limit and price. It's fine to stick with these defaults.
                You can also consult <a href="https://ethgasstation.info/calculatorTxV.php" target="_blank">this calculator</a>
                &nbsp;to adjust the Gwei price.
              </p>
              <div>
                <button onClick={this.handleClickPreApprove}>Preapprove</button>
              </div>
            </div>
          </div>
        </Modal>
      );
    }

    // round second decimal up
    const stakesFor = Util.fromWei(proposal.stakesFor);
    const stakesAgainst = Util.fromWei(proposal.stakesAgainst);
    const stakingLeftToBoost = Math.ceil((threshold - (stakesFor - stakesAgainst)) * 100) / 100;
    const isPassing = stakesFor >= stakesAgainst;
    const isFailing = stakesAgainst >= stakesFor;
    const maxWidth = Math.max(stakesFor, stakesAgainst);
    const passWidth = stakesFor <= 0.0001 ? 0 : Math.max(stakesFor / maxWidth * 100, 3);
    const failWidth = stakesAgainst <= 0.0001 ? 0 : Math.max(stakesAgainst / maxWidth * 100, 3);

    const wrapperClass = classNames({
      [css.detailView] : detailView,
      [css.historyView] : historyView,
      [css.isPassing] : isPassing,
      [css.isFailing] : isFailing,
      [css.predictions] : true,
      [css.unconfirmedPrediction] : isPredicting,
    });
    const stakeUpClass = classNames({
      [css.predicted]: currentAccountPrediction === VoteOptions.Yes,
    });
    const stakeDownClass = classNames({
      [css.predicted]: currentAccountPrediction === VoteOptions.No,
    });

    const stakingEnabled = proposal.stage === IProposalStage.Queued ||
                            (proposal.stage === IProposalStage.PreBoosted && !expired);

    const hasGens = currentAccountGens.gt(new BN(0));
    const disableStakePass = !hasGens || currentAccountPrediction === VoteOptions.No;
    const disableStakeFail = !hasGens || currentAccountPrediction === VoteOptions.Yes;

    const passPrediction = classNames({
      [css.passPrediction]: true,
      [css.disabled]: disableStakePass
    });

    const failPrediction = classNames({
      [css.failPrediction]: true,
      [css.disabled]: disableStakeFail
    });

    const passButtonClass = classNames({
      [css.pendingPrediction]: isPredictingPass,
      [css.passButton]: true
    });

    const failButtonClass = classNames({
      [css.pendingPrediction]: isPredictingFail,
      [css.failButton]: true
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
        <img src="/assets/images/Icon/Loading-black.svg"/>
      </button>
    );

    const failButton = (
      <button className={failButtonClass} onClick={disableStakeFail ? null : this.showPreStakeModal(2)}>
        <img className={css.stakeIcon} src="/assets/images/Icon/x.svg"/> Fail
        <img src="/assets/images/Icon/Loading-black.svg"/>
      </button>
    );

    // If don't have any staking allowance, replace with button to pre-approve

    if (currentAccountGenStakingAllowance.eq(new BN(0))) {
      return (
        <div className={wrapperClass}>
          <h3><span>Predictions</span></h3>
          <div className={css.stakes}>
            <div className={css.clearfix}>
              <div className={css.stakesFor}>
                <img src="/assets/images/Icon/v-small-line.svg"/>
                {Util.fromWei(proposal.stakesFor).toFixed(2)}
              </div>
              <div className={css.forBar}>
                <b>Pass</b>
                <span style={{width: passWidth + "%"}}></span>
              </div>
            </div>
            <div className={css.clearfix}>
              <div className={css.stakesAgainst}>
                <img src="/assets/images/Icon/x-small-line.svg"/>
                {Util.fromWei(proposal.stakesAgainst).toFixed(2)}
              </div>
              <div className={css.againstBar}>
                <b>Fail</b>
                <span style={{width: failWidth + "%"}}></span>
              </div>
            </div>
          </div>

          <div className={css.enablePredictions}>
            <button onClick={this.showApprovalModal}>Enable Predicting</button>
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
            secondaryHeader={stakingLeftToBoost + " GEN for boost!"}
          /> : ""
        }

        <div>
          <div className={css.statusTitle}>
            <h3>Predictions</h3>
            { this.props.detailView ?
              <div className={css.stakeControls}>
                {
                  stakingEnabled
                  ? (
                    tip(VoteOptions.No) !== "" ?
                      <Tooltip placement="left" trigger={["hover"]} overlay={tip(VoteOptions.No)}>
                        {passButton}
                      </Tooltip> :
                      passButton
                    )
                  : " "
                }
                {
                  stakingEnabled
                  ? (
                      tip(VoteOptions.Yes) !== "" ?
                        <Tooltip placement="left" trigger={["hover"]} overlay={tip(VoteOptions.Yes)}>
                          {failButton}
                        </Tooltip> :
                        failButton
                    )
                  :
                  <span className={css.disabledPredictions}>
                     Predictions are disabled
                  </span>
                }
              </div>
              : " "
            }
          </div>
          <div className={css.stakes}>
            <div className={css.clearfix}>
              <div className={css.stakesFor}>
                <img className={css.defaultIcon} src="/assets/images/Icon/v-small-line.svg"/>
                <img className={css.detailIcon} src="/assets/images/Icon/v-small.svg"/>
                <span>{Util.fromWei(proposal.stakesFor).toFixed(2)}</span>
              </div>
              <div className={css.forBar}>
                <b>Pass</b>
                <span style={{width: passWidth + "%"}}></span>
              </div>
            </div>
            <div className={css.clearfix}>
              <div className={css.stakesAgainst}>
                <img className={css.defaultIcon} src="/assets/images/Icon/x-small-line.svg"/>
                <img className={css.detailIcon} src="/assets/images/Icon/x-small.svg"/>
                <span>{Util.fromWei(proposal.stakesAgainst).toFixed(2)}</span>
              </div>
              <div className={css.againstBar}>
                <b>Fail</b>
                <span style={{width: failWidth + "%"}}></span>
              </div>
            </div>
          </div>
          <span className={css.boostedAmount}>
            {
              proposal.stage === IProposalStage.Queued && stakingLeftToBoost > 0 ?
                <span>
                  <b>
                    <img src="/assets/images/Icon/Boost-slate.svg" />
                    {stakingLeftToBoost.toFixed(2)} GEN to boost
                  </b>
                </span>
              : ""
            }

          </span>
          { !this.props.detailView ?
            <div className={css.centered}>
              {
                stakingEnabled
                ? (
                  tip(VoteOptions.No) !== "" ?
                    <Tooltip placement="left" trigger={["hover"]} overlay={tip(VoteOptions.No)}>
                      {passButton}
                    </Tooltip> :
                    passButton
                  )
                :
                <span className={css.disabledPredictions}>Predictions are disabled</span>
              }
              {
                stakingEnabled
                ? (
                    tip(VoteOptions.Yes) !== "" ?
                      <Tooltip placement="left" trigger={["hover"]} overlay={tip(VoteOptions.Yes)}>
                        {failButton}
                      </Tooltip> :
                      failButton
                  )
                : " "
              }
            </div>
            : " "
          }
        </div>
      </div>
    );
  }
}

const ConnectedPredictionBox = connect(mapStateToProps, mapDispatchToProps)(PredictionBox);

export default (props: IContainerProps) => {

  const arc = getArc();
  const dao = arc.dao(props.dao.address);
  let observable;
  if (props.currentAccountAddress) {
    observable = combineLatest(
      arc.GENToken().balanceOf(props.currentAccountAddress),
      arc.allowance(props.currentAccountAddress),
      dao.proposal(props.proposal.id).stakes({ staker: props.currentAccountAddress})
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
        return <div>{ state.error.message }</div>;
      } else {
        const currentAccountGens = state.data[0] || new BN(0);
        const currentAccountGenStakingAllowance = state.data[1] ? new BN(state.data[1].amount) : new BN(0);
        const stakes = state.data[2];
        return <ConnectedPredictionBox {...props }
          currentAccountGens={currentAccountGens}
          currentAccountGenStakingAllowance={currentAccountGenStakingAllowance}
          stakesOfCurrentUser={stakes}
          />;
      }
    }
  }</Subscribe>;
};
