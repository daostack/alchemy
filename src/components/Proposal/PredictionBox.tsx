import * as classNames from 'classnames';
import * as React from 'react';
import { Link } from 'react-router-dom'

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IProposalState, ProposalStates, VoteOptions } from 'reducers/arcReducer';

import * as css from './Proposal.scss';

interface IState {
  currentPrediction: number
  currentStake: number
}

interface IProps {
  currentPrediction: number
  currentStake: number
  proposal: IProposalState
  stakeProposal: typeof arcActions.stakeProposal
}

export default class PredictionBox extends React.Component<IProps, IState> {

  constructor(props: IProps){
    super(props);

    this.state = {
      currentPrediction: props.currentPrediction,
      currentStake: props.currentStake
    };
  }

  handleClickStake(prediction : number, stake: number, event : any) {
    const { proposal, stakeProposal } = this.props;

    // TODO: need a better UI for specifiying stake amounts
    const amount = parseInt(prompt(`How much would you like to stake? (min = 1)`, '1'));

    this.setState({ currentPrediction: prediction, currentStake : amount });
    stakeProposal(proposal.daoAvatarAddress, proposal.proposalId, prediction, amount);
  }

  render() {
    const { currentPrediction, currentStake, proposal } = this.props;

    var stakeUpClass = classNames({
      [css.predicted]: currentPrediction == VoteOptions.Yes
    });
    var stakeDownClass = classNames({
      [css.predicted]: currentPrediction == VoteOptions.No
    });

    return (
      <div className={css.predictions}>
        <div className={css.loading}>
          <img src="/assets/images/Icon/loading-black.svg"/>
        </div>
        <div className={css.newPrediction + " " + css.newPassPrediction}>        {/*switch out for newFailPrediction*/}
          <div className={css.newPredictionTitle}>
            NEW <strong>PASS</strong> STAKE
          </div>
          <input type="text" placeholder="0" className={css.predictionAmount}/>
          <span className={css.genLabel}>GEN</span>
          <div className={css.clearfix}>
            <button className={css.cancelPrediction}>
              <img src="/assets/images/Icon/Close-black.svg"/>
            </button>
            <button className={css.placePrediction}>Place stake</button>
          </div>
        </div>
        <div>
          <span>PREDICTIONS</span>
          <table>
            <tbody>
              <tr className={stakeUpClass}>
                <td className={css.passPrediction}>
                  { proposal.state == ProposalStates.PreBoosted
                    ? <button onClick={this.handleClickStake.bind(this, 1, 1)}>PASS +</button>
                    : "PASS"
                  }
                </td>
                <td>{proposal.stakesYes} GEN</td>
              </tr>
              <tr className={stakeDownClass} >
                <td className={css.failPrediction}>
                  { proposal.state == ProposalStates.PreBoosted
                    ? <button onClick={this.handleClickStake.bind(this, 2, 1)}>FAIL +</button>
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