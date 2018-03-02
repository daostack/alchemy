import * as classNames from 'classnames';
import * as moment from 'moment';
import { denormalize } from 'normalizr';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Link, Route, RouteComponentProps, Switch } from 'react-router-dom'

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IDaoState, IProposalState, ProposalStates, VotesStatus } from 'reducers/arcReducer';
import * as schemas from '../../schemas';
import * as selectors from 'selectors/daoSelectors';

import AccountPopupContainer from 'components/Account/AccountPopupContainer';
import PredictionBox from './PredictionBox';
import VoteBox from './VoteBox';

import * as css from './Proposal.scss';

interface IStateProps extends RouteComponentProps<any> {
  dao: IDaoState
  proposal : IProposalState
}

const mapStateToProps = (state : IRootState, ownProps: any) => {
  return {
    dao: state.arc.daos[ownProps.match.params.daoAddress],
    proposal: state.arc.proposals[ownProps.match.params.proposalId]
  };
};

interface IDispatchProps {
  getProposal: typeof arcActions.getProposal
  voteOnProposal: typeof arcActions.voteOnProposal
  stakeProposal: typeof arcActions.stakeProposal
}

const mapDispatchToProps = {
  getProposal: arcActions.getProposal,
  voteOnProposal: arcActions.voteOnProposal,
  stakeProposal: arcActions.stakeProposal
};

type IProps = IStateProps & IDispatchProps

class ViewProposalContainer extends React.Component<IProps, null> {

  componentDidMount() {
    this.props.getProposal(this.props.dao.avatarAddress, this.props.proposal.proposalId);
  }

  render() {
    const { dao, proposal, voteOnProposal, stakeProposal } = this.props;

    if (proposal) {
      var proposalClass = classNames({
        [css.viewProposalWrapper]: true,
        [css.openProposal]: proposal.state == ProposalStates.PreBoosted || proposal.state == ProposalStates.Boosted,
        [css.failedProposal]: proposal.winningVote == VotesStatus.No,
        [css.passedProposal]: proposal.winningVote == VotesStatus.Yes
      });

      let submittedTime = moment.unix(proposal.submittedTime);

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

      return(
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
                    <div>{submittedTime.format("MMM DD, YYYY")}</div>
                  </div>
              </div>
            : proposal.winningVote == VotesStatus.No ?
              <div className={css.decidedProposal}>
                  <div className={css.result}>
                    <div>FAILED</div>
                    <div><img src="/assets/images/Icon/Failed.svg"/></div>
                    <div>{submittedTime.format("MMM DD, YYYY")}</div>
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
              <span className={css.transferAmount}>{proposal.nativeTokenReward} {dao.tokenSymbol} &amp; {proposal.reputationChange} Reputation</span>
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
                      accountAddress={proposal.proposer}
                      daoAvatarAddress={proposal.daoAvatarAddress}
                    />

                    ON {submittedTime.format("MMM DD, YYYY")}
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
            : proposal.state == ProposalStates.PreBoosted ?
              <div>

                <div className={css.proposalDetails}>
                  <div className={css.createdBy}>
                    CREATED BY

                    <AccountPopupContainer
                      accountAddress={proposal.proposer}
                      daoAvatarAddress={proposal.daoAvatarAddress}
                    />
                    ON {submittedTime.format("MMM DD, YYYY")}
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

export default connect(mapStateToProps, mapDispatchToProps)(ViewProposalContainer);