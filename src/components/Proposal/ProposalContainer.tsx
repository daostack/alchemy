import * as classNames from 'classnames';
import * as moment from 'moment';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Link } from 'react-router-dom'

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IProposalState, ProposalStates, VotesStatus } from 'reducers/arcReducer';
import { IWeb3State } from 'reducers/web3Reducer'

import PredictionBox from './PredictionBox';
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
  stakeProposal: typeof arcActions.stakeProposal
}

const mapDispatchToProps = {
  voteOnProposal: arcActions.voteOnProposal,
  stakeProposal: arcActions.stakeProposal
};

type IProps = IStateProps & IDispatchProps

class ProposalContainer extends React.Component<IProps, null> {

  render() {
    const { proposal, voteOnProposal, stakeProposal, web3 } = this.props;

    if (proposal) {
      var proposalClass = classNames({
        [css.proposal]: true,
        [css.openProposal]: proposal.state == ProposalStates.PreBoosted || proposal.state == ProposalStates.Boosted,
        [css.failedProposal]: proposal.winningVote == VotesStatus.No,
        [css.passedProposal]: proposal.winningVote == VotesStatus.Yes
      });

      const yesPercentage = proposal.totalVotes ? Math.round(proposal.votesYes / proposal.totalVotes * 100) : 0;
      const noPercentage = proposal.totalVotes ? Math.round(proposal.votesNo / proposal.totalVotes * 100) : 0;

      let submittedAt = moment.unix(proposal.submittedAt);

      return (
        <div className={proposalClass + " " + css.clearfix}>
          { proposal.state == ProposalStates.PreBoosted || proposal.state == ProposalStates.Boosted ?
            <VoteBox
              proposal={proposal}
              voteOnProposal={voteOnProposal}
            />
            : proposal.winningVote == VotesStatus.Yes ?
              <div className={css.decidedProposal}>
                  <div className={css.result}>
                    <div>PASSED</div>
                    <div><img src="/assets/images/Icon/Passed.svg"/></div>
                    <div>{submittedAt.format("MMM DD, YYYY")}</div>
                  </div>
              </div>
            : proposal.winningVote == VotesStatus.No ?
              <div className={css.decidedProposal}>
                  <div className={css.result}>
                    <div>FAILED</div>
                    <div><img src="/assets/images/Icon/Failed.svg"/></div>
                    <div>{submittedAt.format("MMM DD, YYYY")}</div>
                  </div>
              </div>
            : ""
          }
          <div className={css.proposalInfo}>
            { proposal.winningVote == VotesStatus.Yes || proposal.winningVote == VotesStatus.No ?
              <div className={css.decisionGraph}>
                <span className={css.forLabel}>{proposal.votesYes} ({yesPercentage}%)</span>
                <div className={css.graph}>
                  <div className={css.forBar}></div>
                  <div className={css.againstBar}></div>
                  <div className={css.divider}></div>
                </div>
                <span className={css.againstLabel}>{proposal.votesNo} ({noPercentage}%)</span>
              </div>
              : ""
            }
            <h3>
              {proposal.title}
              { proposal.state == ProposalStates.Boosted ?
                <span>CLOSES IN 3 WEEKS</span>
              : proposal.state == ProposalStates.PreBoosted ?
                <span>5 DAYS</span>
              : ""
              }
            </h3>
            <div className={css.transferDetails}>
              <span className={css.transferType}>Transfer of</span>
              <span className={css.transferAmount}>{proposal.rewardToken} ETH &amp; {proposal.rewardReputation} Reputation</span>
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
          { proposal.state == ProposalStates.Boosted ?
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

                <PredictionBox
                  proposal={proposal}
                  stakeProposal={stakeProposal}
                />
              </div>
            : proposal.state == ProposalStates.PreBoosted ?
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

                <PredictionBox
                  proposal={proposal}
                  stakeProposal={stakeProposal}
                />
              </div>
            : proposal.winningVote == VotesStatus.Yes ?
              ""
            : proposal.winningVote == VotesStatus.No ?
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