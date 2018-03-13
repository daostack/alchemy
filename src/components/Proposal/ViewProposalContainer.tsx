import * as classNames from "classnames";
import * as moment from "moment";
import { denormalize } from "normalizr";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link, Route, RouteComponentProps, Switch } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDaoState, IProposalState, ProposalStates, TransactionStates, VoteOptions } from "reducers/arcReducer";
import * as selectors from "selectors/daoSelectors";
import * as schemas from "../../schemas";

import AccountPopupContainer from "components/Account/AccountPopupContainer";
import PredictionBox from "./PredictionBox";
import VoteBox from "./VoteBox";

import * as css from "./Proposal.scss";

interface IStateProps extends RouteComponentProps<any> {
  currentAccountAddress: string;
  dao: IDaoState;
  proposal: IProposalState;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    currentAccountAddress: state.web3.ethAccountAddress,
    dao: state.arc.daos[ownProps.match.params.daoAddress],
    proposal: state.arc.proposals[ownProps.match.params.proposalId],
  };
};

interface IDispatchProps {
  getProposal: typeof arcActions.getProposal;
  voteOnProposal: typeof arcActions.voteOnProposal;
  stakeProposal: typeof arcActions.stakeProposal;
}

const mapDispatchToProps = {
  getProposal: arcActions.getProposal,
  voteOnProposal: arcActions.voteOnProposal,
  stakeProposal: arcActions.stakeProposal,
};

type IProps = IStateProps & IDispatchProps;

class ViewProposalContainer extends React.Component<IProps, null> {

  public componentDidMount() {
    this.props.getProposal(this.props.dao.avatarAddress, this.props.proposal.proposalId);
  }

  public render() {
    const { currentAccountAddress, dao, proposal, voteOnProposal, stakeProposal } = this.props;

    if (proposal) {
      const proposalClass = classNames({
        [css.viewProposalWrapper]: true,
        [css.openProposal]: proposal.state == ProposalStates.PreBoosted || proposal.state == ProposalStates.Boosted,
        [css.failedProposal]: proposal.winningVote == VoteOptions.No,
        [css.passedProposal]: proposal.winningVote == VoteOptions.Yes,
      });

      const submittedTime = moment.unix(proposal.submittedTime);

      // Calculate reputation percentages
      const totalReputation = proposal.state == ProposalStates.Executed ? proposal.reputationWhenExecuted : dao.reputationCount;
      const yesPercentage = totalReputation ? Math.round(proposal.votesYes / totalReputation * 100) : 0;
      const noPercentage = totalReputation ? Math.round(proposal.votesNo / totalReputation * 100) : 0;

      const daoAccount = dao.members[currentAccountAddress];
      let currentAccountVote = 0, currentAccountPrediction = 0, currentAccountStake = 0,
          currentAccountStakeState = TransactionStates.Confirmed, currentAccountVoteState = TransactionStates.Confirmed;
      if (daoAccount) {
        currentAccountVote = daoAccount.votes[proposal.proposalId] ? daoAccount.votes[proposal.proposalId].vote : 0;
        if (daoAccount.stakes[proposal.proposalId]) {
          currentAccountPrediction =  daoAccount.stakes[proposal.proposalId].prediction;
          currentAccountStake = daoAccount.stakes[proposal.proposalId].stake;
          currentAccountStakeState = daoAccount.stakes[proposal.proposalId].transactionState;
          currentAccountVoteState = daoAccount.votes[proposal.proposalId].transactionState;
        }
      }

      const styles = {
        forBar: {
          width: yesPercentage + "%",
        },
        againstBar: {
          width: noPercentage + "%",
        },
      };

      return(
        <div className={proposalClass + " " + css.clearfix}>
          { proposal.state == ProposalStates.PreBoosted || proposal.state == ProposalStates.Boosted ?
            <VoteBox
              currentVote={currentAccountVote}
              daoTotalReputation={dao.reputationCount}
              proposal={proposal}
              transactionState={currentAccountVoteState}
              voteOnProposal={voteOnProposal}
            />
            : proposal.winningVote == VoteOptions.Yes ?
              <div className={css.decidedProposal}>
                  <div className={css.result}>
                    <div>PASSED</div>
                    <div><img src="/assets/images/Icon/Passed.svg"/></div>
                    <div>{submittedTime.format("MMM DD, YYYY")}</div>
                  </div>
              </div>
            : proposal.winningVote == VoteOptions.No ?
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
                  currentPrediction={currentAccountPrediction}
                  currentStake={currentAccountStake}
                  proposal={proposal}
                  stakeProposal={stakeProposal}
                  transactionState={currentAccountStakeState}
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
                  currentPrediction={currentAccountPrediction}
                  currentStake={currentAccountStake}
                  proposal={proposal}
                  stakeProposal={stakeProposal}
                  transactionState={currentAccountStakeState}
                />
              </div>
            : proposal.winningVote == VoteOptions.Yes ?
              <div>
                <div className={css.proposalDetails + " " + css.concludedDecisionDetails}>
                  <a href={proposal.description} target="_blank" className={css.viewProposal}>
                    <img src="/assets/images/Icon/View.svg"/>
                  </a>
                </div>
              </div>
            : proposal.winningVote == VoteOptions.No ?
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
