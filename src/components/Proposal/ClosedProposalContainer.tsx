import { Address, IDAOState, IMemberState, IProposalState, IRewardState, IStake, IVote, IProposalStage, ProposalOutcome } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import * as web3Actions from "actions/web3Actions";
import { getArc } from "arc";
import BN = require("bn.js");
import * as classNames from "classnames";
import AccountPopupContainer from "components/Account/AccountPopupContainer";
import AccountProfileName from "components/Account/AccountProfileName";
import { ActionTypes, default as PreTransactionModal } from "components/Shared/PreTransactionModal";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as moment from "moment";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { IRootState } from "reducers";
import { proposalEnded, proposalFailed, proposalPassed } from "reducers/arcReducer";
import { closingTime, VoteOptions } from "reducers/arcReducer";
import { IProfileState } from "reducers/profilesReducer";
import { combineLatest, Observable, of } from "rxjs";
import { isRedeemPending } from "selectors/operations";
import Util from "lib/util";

import PredictionBox from "./PredictionBox";
import * as css from "./Proposal.scss";
import RedeemButton from "./RedeemButton";
import RedemptionsTip from "./RedemptionsTip";
import TransferDetails from "./TransferDetails";
import VoteBox from "./VoteBox";

interface IStateProps {
  beneficiaryProfile?: IProfileState;
  creatorProfile?: IProfileState;
  currentAccount: IMemberState;
  daoEthBalance: BN;
  rewardsForCurrentUser: IRewardState[];
  stakesOfCurrentUser: IStake[];
  votesOfCurrentUser: IVote[];
  dao: IDAOState;
  proposal: IProposalState;
  isRedeemPending: boolean;
}

interface IContainerProps {
  dao: IDAOState;
  daoEthBalance: BN;
  detailView?: boolean;
  currentAccount: IMemberState;
  proposal: IProposalState;
  rewardsForCurrentUser: IRewardState[];
  stakesOfCurrentUser: IStake[];
  votesOfCurrentUser: IVote[];
}

const mapStateToProps = (state: IRootState, ownProps: IContainerProps): IStateProps => {
  const proposal = ownProps.proposal;
  const dao = ownProps.dao;

  let currentAccount = ownProps.currentAccount;

  return {
    beneficiaryProfile: state.profiles[proposal.beneficiary],
    creatorProfile: state.profiles[proposal.proposer],
    currentAccount,
    dao,
    daoEthBalance: ownProps.daoEthBalance,
    isRedeemPending: isRedeemPending(proposal.id, currentAccount.address)(state),
    proposal,
    rewardsForCurrentUser: ownProps.rewardsForCurrentUser,
    stakesOfCurrentUser: ownProps.stakesOfCurrentUser,
    votesOfCurrentUser: ownProps.votesOfCurrentUser
  };
};

interface IDispatchProps {
  redeemProposal: typeof arcActions.redeemProposal;
  executeProposal: typeof arcActions.executeProposal;
}

const mapDispatchToProps = {
  redeemProposal: arcActions.redeemProposal,
  executeProposal: arcActions.executeProposal,
};

type IProps = IStateProps & IDispatchProps & IContainerProps;

interface IState {
  preRedeemModalOpen: boolean;
}

class ProposalContainer extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      preRedeemModalOpen: false
    };
  }

  public handleClickExecute(event: any) {
    this.props.executeProposal(this.props.dao.address, this.props.proposal.id);
  }

  public handleClickRedeem(event: any) {
    this.setState({ preRedeemModalOpen: true });
  }

  public closePreRedeemModal(event: any) {
    this.setState({ preRedeemModalOpen: false });
  }

  public render() {
    const {
      beneficiaryProfile,
      creatorProfile,
      currentAccount,
      dao,
      daoEthBalance,
      detailView,
      proposal,
      redeemProposal,
      executeProposal,
      isRedeemPending,
      rewardsForCurrentUser,
      stakesOfCurrentUser,
      votesOfCurrentUser,
    } = this.props;

    const externalTokenBalance = dao.externalTokenBalance;

    const beneficiaryHasRewards = (
      proposal.reputationReward.gt(new BN(0)) ||
      proposal.nativeTokenReward.gt(new BN(0)) ||
      (proposal.ethReward.gt(new BN(0)) && daoEthBalance.gte(proposal.ethReward)) ||
      (proposal.externalTokenReward.gt(new BN(0)) && externalTokenBalance.gte(proposal.externalTokenReward))
    ) as boolean;

    const accountHasRewards = rewardsForCurrentUser.length !== 0;

    const redeemable = accountHasRewards || beneficiaryHasRewards;

    if (proposal) {
      // TODO: check if the commented lines are represented correctly in the line below
      // const executable = proposalEnded(proposal) && proposal.state !== ProposalStates.Closed && proposal.state !== ProposalStates.Executed;
      const executable = proposalEnded(proposal) && !proposal.executedAt;
      const proposalClass = classNames({
        [css.proposal]: true,
        [css.failedProposal]: proposalFailed(proposal),
        [css.passedProposal]: proposalPassed(proposal),
        [css.redeemable]: redeemable
      });

      const submittedTime = moment.unix(proposal.createdAt);

      // Calculate reputation percentages
      const totalReputation = Util.fromWei(proposal.stage == IProposalStage.Executed ? proposal.totalRepWhenExecuted : dao.reputationTotalSupply);
      const votesFor = Util.fromWei(proposal.votesFor);
      const votesAgainst = Util.fromWei(proposal.votesAgainst);
      const yesPercentage = totalReputation && votesFor ? Math.max(2, Math.ceil(votesFor / totalReputation * 100)) : 0;
      const noPercentage = totalReputation && votesAgainst ? Math.max(2, Math.ceil(votesAgainst / totalReputation * 100)) : 0;
      const passedByDecision = totalReputation ? (votesFor / totalReputation) > 0.5 : false;
      const failedByDecision = totalReputation ? (votesAgainst / totalReputation) > 0.5 : false;

      let currentAccountVote = 0, currentAccountPrediction = 0, currentAccountStakeAmount = new BN(0);

      const redeemProps = {
        accountHasRewards,
        isRedeemPending,
        redeemable,
        executable,
        beneficiaryHasRewards,
        rewards: rewardsForCurrentUser,
        currentAccount,
        dao,
        proposal,
        handleClickRedeem: this.handleClickRedeem.bind(this)
      };

      const redemptionsTip = RedemptionsTip(redeemProps);
      const redeemButton = RedeemButton(redeemProps);

      let currentVote: IVote;
      if (votesOfCurrentUser.length > 0) {
        currentVote = votesOfCurrentUser[0];
        currentAccountVote = currentVote.outcome;
      }

      let currentStake: IStake;
      if (stakesOfCurrentUser.length > 0) {
        currentStake = stakesOfCurrentUser[0];
      }
      if (currentStake) {
        currentAccountPrediction = currentStake.outcome;
        currentAccountStakeAmount = currentStake.amount;
      }

      const styles = {
        forBar: {
          width: yesPercentage + "%",
        },
        againstBar: {
          width: noPercentage + "%",
        },
      };

      const disqusConfig = {
        url: process.env.BASE_URL + "/dao/" + dao.address + "/proposal/" + proposal.id,
        identifier: proposal.id
      };

      const executeButtonClass = classNames({
        [css.stateChange]: true,
        [css.invisible]: proposalEnded(proposal) || closingTime(proposal).isAfter(moment())
      });

      return (
        <div className={proposalClass + " " + css.clearfix}>
          <div className={css.proposalInfo}>
            <h3 className={css.proposalTitleTop}>
              <span data-test-id="proposal-closes-in">
                {proposal.stage == IProposalStage.QuietEndingPeriod ?
                  <strong>
                    <img src="/assets/images/Icon/Overtime.svg" /> OVERTIME: CLOSES {closingTime(proposal).fromNow().toUpperCase()}
                    <div className={css.help}>
                      <img src="/assets/images/Icon/Help-light.svg" />
                      <img className={css.hover} src="/assets/images/Icon/Help-light-hover.svg" />
                      <div className={css.helpBox}>
                        <div className={css.pointer}></div>
                        <div className={css.bg}></div>
                        <div className={css.bridge}></div>
                        <div className={css.header}>
                          <h2>Genesis Protocol</h2>
                          <h3>RULES FOR OVERTIME</h3>
                        </div>
                        <div className={css.body}>
                          <p>Boosted proposals can only pass if the final 1 day of voting has seen “no change of decision”. In case of change of decision on the last day of voting, the voting period is increased one day. This condition (and procedure) remains until a resolution is reached, with the decision kept unchanged for the last 24 hours.</p>
                        </div>
                        <a href="https://docs.google.com/document/d/1LMe0S4ZFWELws1-kd-6tlFmXnlnX9kfVXUNzmcmXs6U/edit?usp=drivesdk" target="_blank">View the Genesis Protocol</a>
                      </div>
                    </div>
                  </strong>
                  : " "
                }
              </span>
              <Link to={"/dao/" + dao.address + "/proposal/" + proposal.id} data-test-id="proposal-title">{proposal.title || "[No title]"}</Link>
            </h3>

            <span>Closed {closingTime(proposal).format("MMM D, YYYY")} </span>

            {proposalPassed(proposal) ?
              <div className="css.clearfix">
                <div className={css.proposalPassInfo}>
                  <strong className={css.passedBy}>PASSED</strong> {passedByDecision ? "BY DECISION" : "BY TIMEOUT"} ON {closingTime(proposal).format("MMM DD, YYYY")}
                </div>
                <div className={css.decisionGraph}>
                  <span className={css.forLabel}>{votesFor.toFixed(2).toLocaleString()} ({yesPercentage}%)</span>
                  <div className={css.graph}>
                    <div className={css.forBar} style={styles.forBar}></div>
                    <div className={css.againstBar} style={styles.againstBar}></div>
                    <div className={css.divider}></div>
                  </div>
                  <span className={css.againstLabel}>{votesAgainst.toFixed(2).toLocaleString()} ({noPercentage}%)</span>
                </div>
              </div>
              : proposalFailed(proposal) ?
                <div className="css.clearfix">
                  <div className={css.proposalFailInfo}>
                    <strong className={css.failedBy}>FAILED</strong> {failedByDecision ? "BY DECISION" : "BY TIMEOUT"} ON {closingTime(proposal).format("MMM DD, YYYY")}
                  </div>
                  <div className={css.decisionGraph}>
                    <span className={css.forLabel}>{votesFor.toFixed(2).toLocaleString()} ({yesPercentage}%)</span>
                    <div className={css.graph}>
                      <div className={css.forBar} style={styles.forBar}></div>
                      <div className={css.againstBar} style={styles.againstBar}></div>
                      <div className={css.divider}></div>
                    </div>
                    <span className={css.againstLabel}>{votesAgainst.toFixed(2).toLocaleString()} ({noPercentage}%)</span>
                  </div>
                </div>
                : ""
            }
            <div className={css.createdBy}>
              <AccountPopupContainer accountAddress={proposal.proposer} dao={dao} />
              <AccountProfileName accountProfile={creatorProfile} daoAvatarAddress={dao.address} />
            </div>
            <div className={css.description}>
              First proposal to test it out.
              I’m glad to be apart and test things out. I’m interested in helping the general public and non-devs more involved in the space and creating DAO’s.
            </div>

            <Link to={"/dao/" + dao.address + "/proposal/" + proposal.id} data-test-id="proposal-title">{proposal.title || "[No title]"}</Link>

            <TransferDetails proposal={proposal} dao={dao} beneficiaryProfile={beneficiaryProfile} />

          </div>

          <div className={css.proposalActions + " " + css.clearfix}>
              <VoteBox
                isVotingNo={false}
                isVotingYes={false}
                currentVote={currentAccountVote}
                currentAccount={currentAccount}
                dao={dao}
                proposal={proposal}
                voteOnProposal={null}
              />
              {proposalPassed(proposal) ?
                <div className={css.decidedProposal}>
                  <div className={css.result}>
                    <div><img src="/assets/images/Icon/Passed.svg" /></div>
                  </div>
                </div>
                : proposalFailed(proposal) ?
                  <div className={css.decidedProposal}>
                    <div className={css.result}>
                      <div><img src="/assets/images/Icon/Failed.svg" /></div>
                    </div>
                  </div>
                  : ""
              }

              <div>
                {this.state.preRedeemModalOpen ?
                  <PreTransactionModal
                    actionType={executable && !redeemable ? ActionTypes.Execute : ActionTypes.Redeem}
                    action={executable && !redeemable ? executeProposal.bind(null, dao.address, proposal.id) : redeemProposal.bind(null, dao.address, proposal.id, currentAccount.address)}
                    beneficiaryProfile={beneficiaryProfile}
                    closeAction={this.closePreRedeemModal.bind(this)}
                    dao={dao}
                    effectText={redemptionsTip}
                    proposal={proposal}
                  /> : ""
                }

                <div className={css.proposalDetails + " " + css.concludedDecisionDetails}>
                  {redeemButton}
                </div>
              </div>

              <PredictionBox
                isPredictingFail={false}
                isPredictingPass={false}
                beneficiaryProfile={beneficiaryProfile}
                currentPrediction={currentAccountPrediction}
                currentStake={currentAccountStakeAmount}
                currentAccountGens={new BN(0)}
                currentAccountGenStakingAllowance={new BN(1000000)}
                dao={dao}
                proposal={proposal}
                stakeProposal={null}
                threshold={0}
                approveStakingGens={null}
                detailView={detailView}
              />
          </div>
        </div>
      );
    } else {
      return (<div>Loading proposal... </div>);
    }
  }
}

export const ConnectedProposalContainer = connect<IStateProps, IDispatchProps, IContainerProps>(mapStateToProps, mapDispatchToProps)(ProposalContainer);

export default (props: { proposalId: string, dao: IDAOState, currentAccountAddress: Address}) => {
  // TODO: get things to work without an account
  if (!props.currentAccountAddress) {
    return null;
  }

  const arc = getArc();
  const dao = arc.dao(props.dao.address);

  const observable = combineLatest(
    dao.proposal(props.proposalId).state(), // the list of pre-boosted proposals
    props.currentAccountAddress ? dao.member(props.currentAccountAddress).state() : of(null),
    // TODO: filter by beneficiary - see https://github.com/daostack/subgraph/issues/60
    // arc.proposal(props.proposalId).rewards({ beneficiary: props.currentAccountAddress})
    props.currentAccountAddress ? dao.proposal(props.proposalId).rewards({}) : of([]),
    props.currentAccountAddress ? dao.proposal(props.proposalId).stakes({ staker: props.currentAccountAddress}) : of([]),
    props.currentAccountAddress ? dao.proposal(props.proposalId).votes({ voter: props.currentAccountAddress }) : of([]),
    dao.ethBalance()
  );
  return <Subscribe observable={observable}>{
    (state: IObservableState<[IProposalState, IMemberState, IRewardState[], IStake[], IVote[], BN]>): any => {
      if (state.isLoading) {
        return <div>Loading proposal</div>;
      } else if (state.error) {
        return <div>{ state.error.message }</div>;
      } else {
        const proposal = state.data[0];
        const rewards = state.data[2];
        const stakes = state.data[3];
        const votes = state.data[4];
        return <ConnectedProposalContainer
          currentAccount={state.data[1]}
          proposal={proposal}
          dao={props.dao}
          daoEthBalance={state.data[5]}
          rewardsForCurrentUser={rewards}
          stakesOfCurrentUser={stakes}
          votesOfCurrentUser={votes}
          />;
      }
    }
  }</Subscribe>;
};
