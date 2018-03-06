import * as React from 'react';
import { Link } from 'react-router-dom'

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IProposalState, ProposalStates } from 'reducers/arcReducer';

import * as css from './Proposal.scss';

interface IProps {
  proposal: IProposalState
  stakeProposal: typeof arcActions.stakeProposal
}

export default class PredictionBox extends React.Component<IProps, null> {

  handleClickStake = (vote : number) => (event : any) => {
    const { proposal, stakeProposal } = this.props;
    stakeProposal(proposal.daoAvatarAddress, proposal.proposalId, 1);
  }

  render() {
    const { proposal } = this.props;

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
              <tr>
                <td className={css.passPrediction}>
                  { proposal.state == ProposalStates.PreBoosted
                    ? <button onClick={this.handleClickStake(1)}>PASS +</button>
                    : "PASS"
                  }
                </td>
                <td>{proposal.stakesYes} GEN</td>
              </tr>
              <tr>
                <td className={css.failPrediction}>
                  { proposal.state == ProposalStates.PreBoosted
                    ? <button onClick={this.handleClickStake(2)}>FAIL +</button>
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