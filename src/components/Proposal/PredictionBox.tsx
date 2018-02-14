import * as React from 'react';
import { Link } from 'react-router-dom'

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IProposalState, ProposalStates } from 'reducers/arcReducer';

import EthBalance from 'components/EthBalance/EthBalance';

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