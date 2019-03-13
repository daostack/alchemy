import { IDAOState, IProposalStage, IProposalState } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import * as web3Actions from "actions/web3Actions";
import BN = require("bn.js");
import * as classNames from "classnames";
import { ActionTypes, default as PreTransactionModal } from "components/Shared/PreTransactionModal";
import Util, { checkNetworkAndWarn } from "lib/util";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { connect } from "react-redux";
//@ts-ignore
import { Modal } from "react-router-modal";
import { VoteOptions } from "reducers/arcReducer";
import { IProfileState } from "reducers/profilesReducer";

import * as css from "./Proposal.scss";

interface IState {
  pendingPrediction: number;
  showApproveModal: boolean;
  showPreStakeModal: boolean;
}

interface IProps {
  beneficiaryProfile?: IProfileState;
  currentPrediction: number;
  currentStake: BN;
  currentAccountGens: BN;
  currentAccountGenStakingAllowance: BN;
  dao: IDAOState;
  detailView?: boolean;
  proposal: IProposalState;
  stakeProposal: typeof arcActions.stakeProposal;
  threshold: number;
  approveStakingGens: typeof web3Actions.approveStakingGens;
  isPredictingFail: boolean;
  isPredictingPass: boolean;
}
const mapDispatchToProps = {
  stakeProposal: arcActions.stakeProposal,
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

  public handleClickPreApprove = (event: any) => {
    if (!checkNetworkAndWarn()) { return; }
    const { approveStakingGens } = this.props;
    approveStakingGens(this.props.dao.address);
    this.setState({ showApproveModal: false });
  }

  public render() {
    const {
      beneficiaryProfile,
      currentPrediction,
      currentAccountGens,
      currentAccountGenStakingAllowance,
      dao,
      detailView,
      proposal,
      isPredictingFail,
      isPredictingPass,
      threshold,
      stakeProposal
    } = this.props;

    const {
      pendingPrediction,
      showApproveModal,
      showPreStakeModal
    } = this.state;

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

    let wrapperClass = classNames({
      [css.detailView] : detailView,
      [css.isPassing] : isPassing,
      [css.isFailing] : isFailing,
      [css.predictions] : true,
      [css.unconfirmedPrediction] : isPredicting,
    });
    let stakeUpClass = classNames({
      [css.predicted]: currentPrediction == VoteOptions.Yes,
    });
    let stakeDownClass = classNames({
      [css.predicted]: currentPrediction == VoteOptions.No,
    });

    const hasGens = currentAccountGens.gt(new BN(0));
    const disableStakePass = !hasGens || currentPrediction === VoteOptions.No;
    const disableStakeFail = !hasGens || currentPrediction === VoteOptions.Yes;

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
      currentPrediction === prediction ?
        "Can't change prediction" :
      isPredicting ?
        "Warning: Staking on this proposal is already in progress" :
        ""
    ;

    const passButton = (
      <button className={passButtonClass} onClick={disableStakePass ? null : this.showPreStakeModal(1)}>
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
                 proposal.stage === IProposalStage.Queued
                  ? (
                    tip(VoteOptions.No) != "" ?
                      <Tooltip placement="left" trigger={["hover"]} overlay={tip(VoteOptions.No)}>
                        {passButton}
                      </Tooltip> :
                      passButton
                    )
                  : " "
                }
                {
                  proposal.stage === IProposalStage.Queued
                  ? (
                      tip(VoteOptions.Yes) != "" ?
                        <Tooltip placement="left" trigger={["hover"]} overlay={tip(VoteOptions.Yes)}>
                          {failButton}
                        </Tooltip> :
                        failButton
                    )
                  : 
                  <span className={css.disabledPredections}>
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
              proposal.stage == IProposalStage.Queued && stakingLeftToBoost > 0 ?
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
               proposal.stage === IProposalStage.Queued
                ? (
                  tip(VoteOptions.No) != "" ?
                    <Tooltip placement="left" trigger={["hover"]} overlay={tip(VoteOptions.No)}>
                      {passButton}
                    </Tooltip> :
                    passButton
                  )
                : "Pass"
              }
              {
                proposal.stage === IProposalStage.Queued
                ? (
                    tip(VoteOptions.Yes) != "" ?
                      <Tooltip placement="left" trigger={["hover"]} overlay={tip(VoteOptions.Yes)}>
                        {failButton}
                      </Tooltip> :
                      failButton
                  )
                : "Fail"
              }
            </div>
            : " "
          }
        </div>
      </div>
    );
  }
}
export default connect(null, mapDispatchToProps)(PredictionBox);
