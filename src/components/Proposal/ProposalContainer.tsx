import * as classNames from 'classnames';
import * as moment from 'moment';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Link } from 'react-router-dom'

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IDaoState, IProposalState, ProposalStates, VotesStatus } from 'reducers/arcReducer';
import { IWeb3State } from 'reducers/web3Reducer'

import AccountPopupContainer from 'components/Account/AccountPopupContainer';
import PredictionBox from './PredictionBox';
import VoteBox from './VoteBox';

import * as css from './Proposal.scss';

interface IStateProps {
  dao: IDaoState
  proposal: IProposalState
  web3: IWeb3State
}

const mapStateToProps = (state : IRootState, ownProps: any) => {
  const proposal = state.arc.proposals[ownProps.proposalId];
  return {
    dao: state.arc.daos[proposal.daoAvatarAddress],
    proposal: proposal,
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
    const { dao, proposal, voteOnProposal, stakeProposal, web3 } = this.props;

    if (proposal) {
      var proposalClass = classNames({
        [css.proposal]: true,
        [css.openProposal]: proposal.state == ProposalStates.PreBoosted || proposal.state == ProposalStates.Boosted,
        [css.failedProposal]: proposal.winningVote == VotesStatus.No,
        [css.passedProposal]: proposal.winningVote == VotesStatus.Yes
      });

      let submittedAt = moment.unix(proposal.submittedAt);

      const yesPercentage = dao.reputationCount ? Math.round(proposal.votesYes / dao.reputationCount * 100) : 0;
      const noPercentage = dao.reputationCount ? Math.round(proposal.votesNo / dao.reputationCount * 100) : 0;

      const styles = {
        forBar: {
          width: yesPercentage + "%"
        },
        againstBar: {
          width: noPercentage + "%"
        }
      }

      return (
        <div className={proposalClass + " " + css.clearfix}>
          { proposal.state == ProposalStates.PreBoosted || proposal.state == ProposalStates.Boosted ?
            <VoteBox
              proposal={proposal}
              voteOnProposal={voteOnProposal}
              daoTotalReputation={dao.reputationCount}
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
            { proposal.state == ProposalStates.Executed ?
              <div className={css.decisionGraph}>
                <span className={css.forLabel}>{proposal.votesYes} ({yesPercentage}%)</span>
                <div className={css.graph}>
                  <div className={css.forBar} style={styles.forBar}></div>
                  <div className={css.againstBar} style={styles.againstBar}></div>
                  <div className={css.divider}></div>
                </div>
                <span className={css.againstLabel}>{proposal.votesNo} ({noPercentage}%)</span>
              </div>
              : ""
            }
            <h3>
              { proposal.state == ProposalStates.PreBoosted ?
                <span>CLOSES IN 3 WEEKS</span>
              : proposal.state == ProposalStates.Boosted ?
                <span>5 DAYS</span>
              : ""
              }
              {proposal.title}
            </h3>
            <div className={css.transferDetails}>
              <span className={css.transferType}>Transfer of</span>
              <span className={css.transferAmount}>{proposal.rewardToken} {dao.tokenSymbol} &amp; {proposal.rewardReputation} Reputation</span>
              <img src="/assets/images/Icon/Transfer.svg"/>

              <AccountPopupContainer
                accountAddress={proposal.beneficiary}
                daoAvatarAddress={proposal.daoAvatarAddress}
              />
            </div>
          </div>
          { proposal.state == ProposalStates.Boosted ?
              <div>
                <div className={css.proposalDetails}>
                  <div className={css.createdBy}>
                    CREATED BY

                    <AccountPopupContainer
                      accountAddress={proposal.beneficiary}
                      daoAvatarAddress={proposal.daoAvatarAddress}
                    />

                    ON {submittedAt.format("MMM DD, YYYY")}
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

                    <AccountPopupContainer
                      accountAddress={proposal.beneficiary}
                      daoAvatarAddress={proposal.daoAvatarAddress}
                    />
                    ON {submittedAt.format("MMM DD, YYYY")}
                  </div>

                  <a href={proposal.description} target="_blank" className={css.viewProposal}>
                    <img src="/assets/images/Icon/View.svg"/>
                  </a>
                </div>

                <PredictionBox
                  proposal={proposal}
                  stakeProposal={stakeProposal}
                />
              </div>
            : proposal.winningVote == VotesStatus.Yes ?
              <div>
                <div className={css.proposalDetails + " " + css.concludedDecisionDetails}>
                  <a href={proposal.description} target="_blank" className={css.viewProposal}>
                    <img src="/assets/images/Icon/View.svg"/>
                  </a>
                </div>
              </div>
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