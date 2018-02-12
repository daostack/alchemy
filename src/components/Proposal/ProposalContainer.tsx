import * as classNames from 'classnames';
import { denormalize } from 'normalizr';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Link } from 'react-router-dom'

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IProposalState } from 'reducers/arcReducer';
import { IWeb3State } from 'reducers/web3Reducer'

import VoteBox from './VoteBox';

import * as css from './Proposal.scss';

interface IStateProps {
  web3: IWeb3State
  proposal: IProposalState
}

const mapStateToProps = (state : IRootState, ownProps: any) => {
  return {
    proposal: state.arc.proposals[ownProps.proposalId],
    web3: state.web3 // TODO: just need the current account address right?
  };
};

interface IDispatchProps {
  voteOnProposal: typeof arcActions.voteOnProposal
}

const mapDispatchToProps = {
  voteOnProposal: arcActions.voteOnProposal
};

type IProps = IStateProps & IDispatchProps

class ProposalContainer extends React.Component<IProps, null> {

  render() {
    const { proposal, voteOnProposal, web3 } = this.props;

    if (proposal) {
      var proposalClass = classNames({
        [css.proposal]: true,
        [css.openProposal]: proposal.state == "NotBoosted",
        [css.failedProposal]: proposal.winningVote == 2,
        [css.passedProposal]: proposal.winningVote == 1
      });

      return (
        <div className={proposalClass + " " + css.clearfix}>
          { proposal.state == "NotBoosted" ?
            <VoteBox
              proposal={proposal}
              voterAddress={web3.ethAccountAddress}
              voteOnProposal={voteOnProposal}
            />
            : proposal.winningVote == 1 ?
              <div className={css.decidedProposal}>
                  <div className={css.result}>
                    <div>PASSED</div>
                    <div><img src="/assets/images/Icon/Passed.svg"/></div>
                    <div>Jan 18, 2017</div>
                  </div>
              </div>
            : proposal.winningVote == 2 ?
              <div className={css.decidedProposal}>
                  <div className={css.result}>
                    <div>FAILED</div>
                    <div><img src="/assets/images/Icon/Failed.svg"/></div>
                    <div>Jan 18, 2017</div>
                  </div>
              </div>
            : ""
          }
          <div className={css.proposalInfo}>
            { proposal.winningVote == 1 || proposal.winningVote == 2 ? 
              <div className={css.decisionGraph}>
                <span className={css.forLabel}>12,603 (22%)</span>
                <div className={css.graph}>
                  <div className={css.forBar}></div>
                  <div className={css.againstBar}></div>
                  <div className={css.divider}></div>
                </div>
                <span className={css.againstLabel}>12,603 (22%)</span>
              </div>
              : ""
            }
            <h3>
              {proposal.description}
              { proposal.state == "NotBoosted" ?
                <span>CLOSES IN 3 WEEKS</span>
              : proposal.state == "Boosted" ?
                <span>5 DAYS</span>
              : ""
              }
            </h3>
            <div className={css.transferDetails}>
              <span className={css.transferType}>Transfer of</span> 
              <span className={css.transferAmount}>{proposal.rewardToken} ETH + {proposal.rewardReputation} Reputation</span>
              <img src="/assets/images/Icon/Transfer.svg"/>


              <div className={css.targetAccount}>
                <div className={css.avatar}>
                  <img src="/assets/images/generic-user-avatar.png"/>
                </div>
                <div className={css.accountInfo}>
                  <div className={css.beneficiaryAddress}>
                    <span>{proposal.beneficiary}</span>
                    <button><img src="/assets/images/Icon/Copy-white.svg"/></button>
                  </div>
                  <div className={css.holdings}>
                    <span>HOLDINGS</span>
                    <div>15,2333 <strong>Genesis Reputation</strong></div>
                    <div>15,2333 <strong>GEN</strong></div>
                    <div>15,2333 <strong>ETH</strong></div>
                  </div>
                  <button className={css.viewProfile}>View Profile</button>
                </div>
              </div>



            </div>
          </div>
          { proposal.state == "Boosted" ?
              <div>
                <div className={css.proposalDetails}>
                  <div className={css.createdBy}>
                    CREATED BY


                    <div className={css.targetAccount}>
                      <div className={css.avatar}>
                        <img src="/assets/images/generic-user-avatar.png"/>
                      </div>
                      <div className={css.accountInfo}>
                        <div className={css.beneficiaryAddress}>
                          <span>{proposal.beneficiary}</span>
                          <button><img src="/assets/images/Icon/Copy-white.svg"/></button>
                        </div>
                        <div className={css.holdings}>
                          <span>HOLDINGS</span>
                          <div>15,2333 <strong>Genesis Reputation</strong></div>
                          <div>15,2333 <strong>GEN</strong></div>
                          <div>15,2333 <strong>ETH</strong></div>
                        </div>
                        <button className={css.viewProfile}>View Profile</button>
                      </div>
                    </div>


                    ON JAN 29TH
                  </div>
                </div>

                <div className={css.predictions}>
                  <div>
                    <span>PREDICTIONS</span>
                    <table>
                      <tbody>
                        <tr>
                          <td className={css.passPrediction}>PASS</td>
                          <td>42 GEN</td>
                        </tr>
                        <tr>
                          <td className={css.failPrediction}>FAIL</td>
                          <td>42 GEN</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            : proposal.state == "NotBoosted" ?
              <div>

                <div className={css.proposalDetails}>
                  <div className={css.createdBy}>
                    CREATED BY


                    <div className={css.targetAccount}>
                      <div className={css.avatar}>
                        <img src="/assets/images/generic-user-avatar.png"/>
                      </div>
                      <div className={css.accountInfo}>
                        <div className={css.beneficiaryAddress}>
                          <span>{proposal.beneficiary}</span>
                          <button><img src="/assets/images/Icon/Copy-white.svg"/></button>
                        </div>
                        <div className={css.holdings}>
                          <span>HOLDINGS</span>
                          <div>15,2333 <strong>Genesis Reputation</strong></div>
                          <div>15,2333 <strong>GEN</strong></div>
                          <div>15,2333 <strong>ETH</strong></div>
                        </div>
                        <button className={css.viewProfile}>View Profile</button>
                      </div>
                    </div>



                    ON JAN 29TH
                  </div>

                  <button className={css.viewProposal}>
                    <img src="/assets/images/Icon/View.svg"/>
                  </button>
                </div>

                <div className={css.predictions}>
                  <div>
                    <span>PREDICTIONS</span>
                    <table>
                      <tbody>
                        <tr>
                          <td className={css.passPrediction}><button>PASS +</button></td>
                          <td>502 GEN</td>
                        </tr>
                        <tr>
                          <td className={css.failPrediction}><button>FAIL +</button></td>
                          <td>42 GEN</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>          
            : proposal.winningVote == 1 ?
              ""
            : proposal.winningVote == 2 ?
              ""
            : ""

          }
        </div>
      );
    } else {
      return (<div>Loading... </div>);
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProposalContainer);