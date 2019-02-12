import * as classNames from "classnames";
import Tooltip from "rc-tooltip";
import * as React from "react";
//@ts-ignore
import { Modal } from 'react-router-modal';

import * as arcActions from "actions/arcActions";
import * as web3Actions from "actions/web3Actions";
import { VoteOptions } from "reducers/arcReducer";
import { IProfileState } from "reducers/profilesReducer";
import { default as PreTransactionModal, ActionTypes } from "components/Shared/PreTransactionModal";
import { IDAOState, IProposalState, ProposalStage } from '@daostack/client'

import * as css from "./Proposal.scss";

interface IState {
  pendingPrediction: number;
  showApproveModal: boolean;
  showPreStakeModal: boolean;
}

interface IProps {
  beneficiaryProfile?: IProfileState;
  currentPrediction: number;
  currentStake: number;
  currentAccountGens: number;
  currentAccountGenStakingAllowance: number;
  dao: IDAOState;
  proposal: IProposalState;
  stakeProposal: typeof arcActions.stakeProposal;
  threshold: number;
  approveStakingGens: typeof web3Actions.approveStakingGens;
  isPredictingFail: boolean;
  isPredictingPass: boolean;
}

export default class PredictionBox extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      pendingPrediction: null,
      showApproveModal: false,
      showPreStakeModal: false
    };
  }

  public showApprovalModal(event: any) {
    this.setState({ showApproveModal: true });
  }

  public closeApprovalModal(event: any) {
    this.setState({ showApproveModal: false });
  }

  public closePreStakeModal(event: any) {
    this.setState({ showPreStakeModal: false });
  }

  public showPreStakeModal = (prediction: number) => (event: any) => {
    const { proposal, stakeProposal } = this.props;
    this.setState({ pendingPrediction: prediction, showPreStakeModal: true });
  }

  public handleClickPreApprove(event: any) {
    const { approveStakingGens } = this.props;
    approveStakingGens(this.props.dao.address);
    this.setState({ showApproveModal: false });
  }

  public render() {
    const {
      beneficiaryProfile,
      currentPrediction,
      currentStake,
      currentAccountGens,
      currentAccountGenStakingAllowance,
      dao,
      proposal,
      isPredictingFail,
      isPredictingPass,
      stakeProposal,
      threshold
    } = this.props;

    const {
      pendingPrediction,
      showApproveModal,
      showPreStakeModal
    } = this.state;

    const isPredicting = isPredictingFail || isPredictingPass;

    if (showApproveModal) {
      return (
        <Modal onBackdropClick={this.closeApprovalModal.bind(this)}>
          <div className={css.preApproval}>
            <div className={css.preapproveBackdrop} onClick={this.closeApprovalModal.bind(this)}></div>
            <div className={css.preapproveWrapper}>
              <p>
                In order to activate predictions, you must authorize our smart
                contract to receive GENs from you. Upon activation, the smart contract
                will be authorized to receive up to 100000 GENs. This transaction will not
                cost you GEN or commit you in any way to spending your GENs in the future.
              </p>
              <p>
                Once you click the button below, we will pop-up a MetaMask dialogue.
                It will set a default gas limit and price. It's fine to stick with these defaults.
                You can also consult <a href="https://ethgasstation.info/calculatorTxV.php" target='_blank'>this calculator</a>
                &nbsp;to adjust the Gwei price.
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
          <button onClick={this.showApprovalModal.bind(this)}>Enable Predicting</button>
        </div>
      );
    }

    // round second decimal up
    const stakingLeftToBoost = Math.ceil((threshold - (proposal.stakesFor - proposal.stakesAgainst)) * 100) / 100;

    let wrapperClass = classNames({
      [css.predictions] : true,
      [css.unconfirmedPrediction] : isPredicting,
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

    const tip = (prediction: VoteOptions) =>
      !currentAccountGens ?
        'Insufficient GENs' :
      currentPrediction === prediction ?
        "Can't change prediction" :
      isPredicting ?
        'Warning: Staking on this proposal is already in progress' :
        ''
    ;

    const passButton = (
      <button className={isPredictingPass ? css.pendingPrediction : undefined} onClick={disableStakePass ? null : this.showPreStakeModal(1)}>
        PASS <strong>+</strong>
        <img src="/assets/images/Icon/Loading-black.svg"/>
      </button>
    );

    const failButton = (
      <button className={isPredictingFail ? css.pendingPrediction : undefined} onClick={disableStakeFail ? null : this.showPreStakeModal(2)}>
        FAIL <strong>+</strong>
        <img src="/assets/images/Icon/Loading-black.svg"/>
      </button>
    );

    return (
      <div className={wrapperClass}>
        {showPreStakeModal ?
          <PreTransactionModal
            actionType={pendingPrediction == VoteOptions.Yes ? ActionTypes.StakePass : ActionTypes.StakeFail}
            action={(amount: number) => { stakeProposal(proposal.dao.address, proposal.id, pendingPrediction, amount)}}
            beneficiaryProfile={beneficiaryProfile}
            closeAction={this.closePreStakeModal.bind(this)}
            currentAccountGens={currentAccountGens}
            dao={dao}
            proposal={proposal}
            secondaryHeader={stakingLeftToBoost + " GEN for boost!"}
          /> : ""
        }

        <div>
          <span className={css.boostedAmount}>
            {
              // TODO: check if commented line is presented well below
              // proposal.state == ProposalStates.PreBoosted && stakingLeftToBoost > 0 ? <span><b>{stakingLeftToBoost.toFixed(2)} MORE GEN TO BOOST</b></span> : ''}
              proposal.stage == ProposalStage.Open && stakingLeftToBoost > 0 ?
             <span><b>{stakingLeftToBoost.toFixed(2)} MORE GEN TO BOOST</b></span> : ''
           }
          </span>
          <table>
            <tbody>
              <tr className={stakeUpClass}>
                <td className={passPrediction}>
                  {
                    // TODO: check if commented line is presented well below
                    // proposal.state == ProposalStates.PreBoosted
                   proposal.stage === ProposalStage.Open
                    ? (
                      tip(VoteOptions.No) != '' ?
                        <Tooltip placement="left" trigger={["hover"]} overlay={tip(VoteOptions.No)}>
                          {passButton}
                        </Tooltip> :
                        passButton
                      )
                    : "PASS"
                  }
                </td>
                <td>{proposal.stakesFor} GEN</td>
              </tr>
              <tr className={stakeDownClass} >
                <td className={failPrediction}>
                  {
                    // TODO: check if commented line is presented well below
                    // tslint:disable-next-line
                    // proposal.state == ProposalStates.PreBoosted
                    proposal.stage === ProposalStage.Open
                    ? (
                        tip(VoteOptions.Yes) != '' ?
                          <Tooltip placement="left" trigger={["hover"]} overlay={tip(VoteOptions.Yes)}>
                            {failButton}
                          </Tooltip> :
                          failButton
                      )
                    : "FAIL"
                  }
                </td>
                <td>{proposal.stakesAgainst} GEN</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
