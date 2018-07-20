import * as classNames from "classnames";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { Link } from "react-router-dom";
//@ts-ignore
import { Modal } from 'react-router-modal';

import * as arcActions from "actions/arcActions";
import * as web3Actions from "actions/web3Actions";
import { IRootState } from "reducers";
import { IDaoState, IProposalState, ProposalStates, TransactionStates, VoteOptions } from "reducers/arcReducer";
import { default as PreTransactionModal, ActionTypes } from "components/Shared/PreTransactionModal";

import * as css from "./Proposal.scss";

interface IState {
  pendingPrediction: number;
  showStakeModal: number;
  showApproveModal: boolean;
  showPreStakeModal: boolean;
  stakeAmount: number;
}

interface IProps {
  currentPrediction: number;
  currentStake: number;
  currentAccountGens: number;
  currentAccountGenStakingAllowance: number;
  dao: IDaoState;
  proposal: IProposalState;
  stakeProposal: typeof arcActions.stakeProposal;
  approveStakingGens: typeof web3Actions.approveStakingGens;
  transactionState: TransactionStates;
  isPredictingFail: boolean;
  isPredictingPass: boolean;
}

export default class PredictionBox extends React.Component<IProps, IState> {
  public stakeInput: any;
  constructor(props: IProps) {
    super(props);

    this.state = {
      pendingPrediction: null,
      showStakeModal: 0,
      showApproveModal: false,
      showPreStakeModal: false,
      stakeAmount: 0
    };
  }

  public showApprovalModal(event: any) {
    this.setState({ showApproveModal: true });
  }

  public closeApprovalModal(event: any) {
    this.setState({ showApproveModal: false });
  }

  public showModal(prediction: number, event: any) {
    this.setState({ showStakeModal: prediction });
    setTimeout(() => this.stakeInput.focus(), 10);
  }

  public closeModal(event: any) {
    this.setState({ showStakeModal: 0 });
  }

  public closePreStakeModal(event: any) {
    this.setState({ showPreStakeModal: false });
  }

  public handleClickStake(prediction: number, stake: number, event: any) {
    const { proposal, stakeProposal } = this.props;
    const { stakeAmount } = this.state;
    this.setState({ pendingPrediction: prediction, showStakeModal: 0, showPreStakeModal: true });
  }

  public handleClickPreApprove(event: any) {
    const { approveStakingGens } = this.props;
    approveStakingGens(this.props.dao.avatarAddress);
    this.setState({ showApproveModal: false });
  }

  public render() {
    const {
      currentPrediction,
      currentStake,
      currentAccountGens,
      currentAccountGenStakingAllowance,
      dao,
      proposal,
      transactionState,
      isPredictingFail,
      isPredictingPass,
      stakeProposal
    } = this.props;
    const { pendingPrediction, showApproveModal, showPreStakeModal, showStakeModal, stakeAmount } = this.state;

    if (showApproveModal) {
      return (
        <Modal onBackdropClick={this.closeApprovalModal.bind(this)}>
          <div className={css.preApproval}>
            <div className={css.preapproveBackdrop} onClick={this.closeApprovalModal.bind(this)}></div>
            <div className={css.preapproveWrapper}>
              <p>
                In order to activate predictions, you must authorize our smart
                contract to receive GENs from you. Upon activation, the smart contract
                will be authorized to receive up to 1000 GENs. This transaction will not
                cost you GEN or commit you in any way to spending your GENs in the future.
              </p>
              <p>
                Once you click the button below, we will pop-up a MetaMask dialogue. It will set a default gas limit and price. It's fine to stick with these defaults. You can also consult  <a href="https://ethgasstation.info/calculatorTxV.php">this calculator</a> to adjust the Gwei price.
              </p>
              <div>
                <button onClick={this.handleClickPreApprove.bind(this)}>Preapprove</button>
              </div>
            </div>
          </div>
        </Modal>
      );
    }

    // If don't have any staking allowance, replace with button to pre-approve
    if (currentAccountGenStakingAllowance < 1) {
      return (
        <div className={css.predictions + " " + css.enablePredictions}>
          <span>0 PRE-APPROVED GEN</span>
          <button onClick={this.showApprovalModal.bind(this)}>Enable Predicting</button>
        </div>
      );
    }

    const stakingLeftToBoost = proposal.threshold - (proposal.stakesYes - proposal.stakesNo);

    let wrapperClass = classNames({
      [css.predictions] : true,
      [css.unconfirmedPrediction] : transactionState == TransactionStates.Unconfirmed,
    });
    let predictionModalClass = classNames({
      [css.newPrediction] : true,
      [css.newPassPrediction] : showStakeModal == VoteOptions.Yes,
      [css.newFailPrediction] : showStakeModal == VoteOptions.No,
    });
    let stakeUpClass = classNames({
      [css.predicted]: currentPrediction == VoteOptions.Yes,
    });
    let stakeDownClass = classNames({
      [css.predicted]: currentPrediction == VoteOptions.No,
    });

    const disableStakePass = !currentAccountGens || currentPrediction === VoteOptions.No;
    const disableStakeFail = !currentAccountGens || currentPrediction === VoteOptions.Yes;

    const passPrediction = classNames({
      [css.passPrediction]: true,
      [css.disabled]: disableStakePass
    });

    const failPrediction = classNames({
      [css.failPrediction]: true,
      [css.disabled]: disableStakeFail
    });

    const passTip = !currentAccountGens ? "Insufficient GENs" : currentPrediction === VoteOptions.No ? "Can't change prediction" : "";
    const failTip = !currentAccountGens ? "Insufficient GENs" : currentPrediction === VoteOptions.Yes ? "Can't change prediction" : "";

    return (
      <div className={wrapperClass}>
        {showPreStakeModal ?
          <PreTransactionModal
            actionType={pendingPrediction == VoteOptions.Yes ? ActionTypes.StakePass : ActionTypes.StakeFail}
            action={stakeProposal.bind(null, proposal.daoAvatarAddress, proposal.proposalId, stakeAmount, Number(stakeAmount))}
            closeAction={this.closePreStakeModal.bind(this)}
            dao={dao}
            effectText={<span>Prediction amount: {stakeAmount} GENs<br/>You are predicting the proposal will be {pendingPrediction == VoteOptions.Yes ? "accepted" : "rejected"} by the DAO</span>}
            proposal={proposal}
          /> : ""
        }
        <div className={css.loading}>
          <img src="/assets/images/Icon/Loading-black.svg"/>
        </div>
        <div className={predictionModalClass}>
          <button className={css.cancelPrediction} onClick={this.closeModal.bind(this)}>
            <img src="/assets/images/Icon/Close-black.svg"/>
          </button>
          <div className={css.newPredictionTitle}>
            Predict this will <strong>{showStakeModal == VoteOptions.Yes ? "pass" : "fail"}</strong>
          </div>
          <div className={css.formGroup + " " + css.clearfix}>
            <span className={css.genLabel}>Stake</span>
            <input
              type="number"
              min="1"
              ref={(input) => { this.stakeInput = input; }}
              className={css.predictionAmount}
              onChange={(e) => this.setState({stakeAmount: Number(e.target.value)})}
              value={stakeAmount}
            />
            <span className={css.genLabel}>GEN</span>
          </div>
          <div className={css.clearfix}>
            {
              stakeAmount <= 0 || stakeAmount > currentAccountGens ?
                <Tooltip placement="left" trigger={['hover']} overlay={this.state.stakeAmount <= 0 ? 'Please enter a positive amount' : 'Insufficient GENs'}>
                  <button
                    className={classNames({[css.placePrediction]: true, [css.disabled]: true})}
                    disabled={true}
                  >
                    Place stake
                  </button>
                </Tooltip> :
                <button className={css.placePrediction} onClick={this.handleClickStake.bind(this, showStakeModal)}>
                  Place stake
                </button>
            }
          </div>
        </div>
        <div>
          <span className={css.boostedAmount}>
            {proposal.state == ProposalStates.PreBoosted && stakingLeftToBoost > 0 ? <span><b>{stakingLeftToBoost.toFixed(2)} MORE GEN TO BOOST</b></span> : ''}
          </span>
          <table>
            <tbody>
              <tr className={stakeUpClass}>
                <td className={passPrediction}>
                  { proposal.state == ProposalStates.PreBoosted
                    ? <Tooltip placement="left" trigger={disableStakePass ? ["hover"] : []} overlay={passTip}>
                        <button className={isPredictingPass ? css.pendingPrediction : undefined} onClick={disableStakePass ? "" : this.showModal.bind(this, 1)}>
                          PASS <strong>+</strong>
                          <img src="/assets/images/Icon/Loading-black.svg"/>
                        </button>
                      </Tooltip>
                    : "PASS"
                  }
                </td>
                <td>{proposal.stakesYes} GEN</td>
              </tr>
              <tr className={stakeDownClass} >
                <td className={failPrediction}>
                  { proposal.state == ProposalStates.PreBoosted
                    ? <Tooltip placement="left" trigger={disableStakeFail ? ["hover"] : []} overlay={failTip}>
                        <button className={isPredictingFail ? css.pendingPrediction : undefined} onClick={disableStakeFail ? "" : this.showModal.bind(this, 2)}>
                          FAIL <strong>+</strong>
                          <img src="/assets/images/Icon/Loading-black.svg"/>
                        </button>
                      </Tooltip>
                    : "FAIL"
                  }
                </td>
                <td>{proposal.stakesNo} GEN</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
