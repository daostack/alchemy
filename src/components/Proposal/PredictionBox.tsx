import * as classNames from "classnames";
import * as React from "react";
import { Link } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IProposalState, ProposalStates, TransactionStates, VoteOptions } from "reducers/arcReducer";

import * as css from "./Proposal.scss";

interface IState {
  showStakeModal: number;
}

interface IProps {
  currentPrediction: number;
  currentStake: number;
  proposal: IProposalState;
  stakeProposal: typeof arcActions.stakeProposal;
  transactionState: TransactionStates;
}

export default class PredictionBox extends React.Component<IProps, IState> {
  public stakeInput: any;

  constructor(props: IProps) {
    super(props);

    this.state = {
      showStakeModal: 0,
    };
  }

  public showModal(prediction: number, event: any) {
    this.setState({ showStakeModal: prediction });
    setTimeout(() => this.stakeInput.focus(), 10);
  }

  public closeModal(event: any) {
    this.setState({ showStakeModal: 0 });
  }

  public handleClickStake(prediction: number, stake: number, event: any) {
    const { proposal, stakeProposal } = this.props;
    const amount = this.stakeInput.value;
    this.setState({ showStakeModal: 0 });
    stakeProposal(proposal.daoAvatarAddress, proposal.proposalId, prediction, amount);
  }

  public render() {
    const { currentPrediction, currentStake, proposal, transactionState } = this.props;
    const { showStakeModal } = this.state;

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

    return (
      <div className={wrapperClass}>
        <div className={css.loading}>
          <img src="/assets/images/Icon/Loading-black.svg"/>
        </div>
        <div className={predictionModalClass}>
          <div className={css.newPredictionTitle}>
            NEW <strong>{showStakeModal == VoteOptions.Yes ? "PASS" : "FAIL"}</strong> STAKE
          </div>
          <input type="number" min="1" ref={(input) => { this.stakeInput = input; }} className={css.predictionAmount}/>
          <span className={css.genLabel}>GEN</span>
          <div className={css.clearfix}>
            <button className={css.cancelPrediction} onClick={this.closeModal.bind(this)}>
              <img src="/assets/images/Icon/Close-black.svg"/>
            </button>
            <button className={css.placePrediction} onClick={this.handleClickStake.bind(this, showStakeModal)}>Place stake</button>
          </div>
        </div>
        <div>
          <span>PREDICTIONS</span>
          <table>
            <tbody>
              <tr className={stakeUpClass}>
                <td className={css.passPrediction}>
                  { proposal.state == ProposalStates.PreBoosted
                    ? <button onClick={this.showModal.bind(this, 1)}>PASS +</button>
                    : "PASS"
                  }
                </td>
                <td>{proposal.stakesYes} GEN</td>
              </tr>
              <tr className={stakeDownClass} >
                <td className={css.failPrediction}>
                  { proposal.state == ProposalStates.PreBoosted
                    ? <button onClick={this.showModal.bind(this, 2)}>FAIL +</button>
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
