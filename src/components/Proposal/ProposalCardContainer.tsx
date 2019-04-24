import { Address, IDAOState, IProposalStage, IProposalState, IRewardState, IVote } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import { checkNetworkAndWarn, getArc } from "arc";
import BN = require("bn.js");
import * as classNames from "classnames";
import AccountPopupContainer from "components/Account/AccountPopupContainer";
import AccountProfileName from "components/Account/AccountProfileName";
import Countdown from "components/Shared/Countdown";
import { ActionTypes, default as PreTransactionModal } from "components/Shared/PreTransactionModal";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { humanProposalTitle } from "lib/util";
import * as moment from "moment";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { IRootState } from "reducers";
import { closingTime, VoteOptions } from "reducers/arcReducer";
import { proposalEnded, proposalFailed, proposalPassed } from "reducers/arcReducer";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import { combineLatest, concat, of } from "rxjs";
import { isRedeemPending, isVotePending } from "selectors/operations";
import BoostAmount from "./Predictions/BoostAmount";
import PredictionButtons from "./Predictions/PredictionButtons";
import PredictionGraph from "./Predictions/PredictionGraph";
import RedeemButton from "./RedeemButton";
import RedemptionsString from "./RedemptionsString";
import RedemptionsTip from "./RedemptionsTip";
import TransferDetails from "./TransferDetails";
import VoteButtons from "./Voting/VoteButtons";
import VoteGraph from "./Voting/VoteGraph";
import VoteBreakdown from "./Voting/VoteBreakdown";

import * as css from "./ProposalCard.scss";

interface IStateProps {
  beneficiaryProfile?: IProfileState;
  creatorProfile?: IProfileState;
  currentAccountAddress: Address;
  daoEthBalance: BN;
  rewardsForCurrentUser: IRewardState[];
  votesOfCurrentUser: IVote[];
  dao: IDAOState;
  proposal: IProposalState;
  isVotingYes: boolean;
  isVotingNo: boolean;
  isRedeemPending: boolean;
}

interface IContainerProps {
  dao: IDAOState;
  currentAccountAddress: Address;
  daoEthBalance: BN;
  proposal: IProposalState;
  rewardsForCurrentUser: IRewardState[];
  votesOfCurrentUser: IVote[];
}

const mapStateToProps = (state: IRootState, ownProps: IContainerProps): IStateProps => {
  const proposal = ownProps.proposal;
  const dao = ownProps.dao;

  return {
    beneficiaryProfile: state.profiles[proposal.beneficiary],
    creatorProfile: state.profiles[proposal.proposer],
    currentAccountAddress: ownProps.currentAccountAddress,
    dao,
    daoEthBalance: ownProps.daoEthBalance,
    isVotingYes: isVotePending(proposal.id, VoteOptions.Yes)(state),
    isVotingNo: isVotePending(proposal.id, VoteOptions.No)(state),
    isRedeemPending: ownProps.currentAccountAddress && isRedeemPending(proposal.id, ownProps.currentAccountAddress)(state),
    proposal,
    rewardsForCurrentUser: ownProps.rewardsForCurrentUser,
    votesOfCurrentUser: ownProps.votesOfCurrentUser
  };
};

interface IDispatchProps {
  executeProposal: typeof arcActions.executeProposal;
  redeemProposal: typeof arcActions.redeemProposal;
  showNotification: typeof showNotification;
  stakeProposal: typeof arcActions.stakeProposal;
}

const mapDispatchToProps = {
  redeemProposal: arcActions.redeemProposal,
  executeProposal: arcActions.executeProposal,
  showNotification,
  stakeProposal: arcActions.stakeProposal,
};

type IProps = IStateProps & IDispatchProps & IContainerProps;

interface IState {
  preRedeemModalOpen: boolean;
  expired: boolean;
}

class ProposalCardContainer extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    this.state = {
      preRedeemModalOpen: false,
      expired: closingTime(props.proposal).isSameOrBefore(moment())
    };

  }

  public async handleClickExecute(event: any) {
    if (!(await checkNetworkAndWarn(this.props.showNotification))) { return; }
    this.props.executeProposal(this.props.dao.address, this.props.proposal.id, this.props.currentAccountAddress);
  }

  public handleClickRedeem(event: any) {
    this.setState({ preRedeemModalOpen: true });
  }

  public closePreRedeemModal(event: any) {
    this.setState({ preRedeemModalOpen: false });
  }

  public countdownEnded() {
    this.setState({ expired: true });
  }

  public render() {
    const {
      beneficiaryProfile,
      creatorProfile,
      currentAccountAddress,
      dao,
      daoEthBalance,
      proposal,
      redeemProposal,
      executeProposal,
      isVotingNo,
      isVotingYes,
      isRedeemPending,
      rewardsForCurrentUser,
      votesOfCurrentUser
    } = this.props;

    const expired = this.state.expired;

    // TODO: should be the DAO balance of the proposal.externalToken
    const externalTokenBalance = dao.externalTokenBalance || new BN(0);

    const beneficiaryHasRewards = (
      !proposal.reputationReward.isZero() ||
      proposal.nativeTokenReward.gt(new BN(0)) ||
      (proposal.ethReward.gt(new BN(0)) && daoEthBalance.gte(proposal.ethReward)) ||
      (proposal.externalTokenReward.gt(new BN(0)) && externalTokenBalance.gte(proposal.externalTokenReward))
    ) as boolean;

    const accountHasRewards = rewardsForCurrentUser.length !== 0;
    const redeemable = proposal.executedAt && (accountHasRewards || beneficiaryHasRewards);
    const executable = proposalEnded(proposal) && !proposal.executedAt;
    const isVoting = isVotingNo || isVotingYes;

    const proposalClass = classNames({
        [css.proposal]: true,
        [css.failedProposal]: proposalFailed(proposal),
        [css.passedProposal]: proposalPassed(proposal)
      });

    const actionButtonClass = classNames({
        [css.invisible]: (!proposalEnded(proposal) && !this.state.expired) && !redeemable && !executable,
        [css.stateChange]: true
      });

    let currentAccountVote = 0;

    const redeemProps = {
        accountHasRewards,
        isRedeemPending,
        redeemable,
        executable,
        beneficiaryHasRewards,
        rewards: rewardsForCurrentUser,
        currentAccountAddress,
        dao,
        proposal
      };

    const redemptionsTip = RedemptionsTip(redeemProps);

    let currentVote: IVote;
    if (votesOfCurrentUser.length > 0) {
      currentVote = votesOfCurrentUser[0];
      currentAccountVote = currentVote.outcome;
    }

    const voteWrapperClass = classNames({
      [css.voteBox] : true,
      "clearfix" : true,
      [css.unconfirmedVote] : isVoting
    });

    const voteControls = classNames({
      [css.voteControls]: true
    });

    return (proposal.stage === IProposalStage.Queued && this.state.expired ? "" :
      <div className={proposalClass + " clearfix"} data-test-id={"proposal-" + proposal.id}>
        <div className={css.proposalInfo}>
          <div className={css.cardTop + " clearfix"}>
            <div className={css.timer}>
              {!proposalEnded(proposal) ?
                  !this.state.expired ?
                    <Countdown toDate={closingTime(proposal)} detailView={false} onEnd={this.countdownEnded.bind(this)} overTime={proposal.stage === IProposalStage.QuietEndingPeriod && !this.state.expired} /> :
                    <span className={css.closedTime}>
                      {proposal.stage === IProposalStage.Queued ? "Expired" :
                       proposal.stage === IProposalStage.PreBoosted ? "Ready to Boost" : // TODO: handle case of below threshold
                       "Closed"}&nbsp;
                       {closingTime(proposal).format("MMM D, YYYY")}
                    </span>
                  : " "
              }
            </div>

            <div className={actionButtonClass}>
              {proposal.stage === IProposalStage.PreBoosted ?
                <button className={css.boostProposal} onClick={this.handleClickExecute.bind(this)} data-test-id="buttonBoost">
                  <img src="/assets/images/Icon/boost.svg"/>
                  <span>Boost</span>
                </button>
                : (proposal.stage === IProposalStage.Boosted || proposal.stage === IProposalStage.QuietEndingPeriod) ?
                  <button className={css.executeProposal} onClick={this.handleClickExecute.bind(this)}>
                    {/* If proposal is boosted, even if it has rewards, make them execute it first */}
                    <img src="/assets/images/Icon/execute.svg"/>
                    <span> Execute</span>
                  </button>
                : redeemable ?
                  <div>
                    <RedemptionsString currentAccountAddress={currentAccountAddress} dao={dao} proposal={proposal} rewards={rewardsForCurrentUser} />
                    <RedeemButton handleClickRedeem={this.handleClickRedeem.bind(this)} {...redeemProps} />
                  </div>
                : ""
              }
            </div>
          </div>
          <div className={css.createdBy}>
            <AccountPopupContainer accountAddress={proposal.proposer} dao={dao} detailView={false}/>
            <AccountProfileName accountAddress={proposal.proposer} accountProfile={creatorProfile} daoAvatarAddress={dao.address} detailView={false}/>
          </div>
          <div className={css.description}>
            {proposal.description}
          </div>

          <h3>
            <Link className={css.detailLink} to={"/dao/" + dao.address + "/proposal/" + proposal.id} data-test-id="proposal-title">
              {humanProposalTitle(proposal)}
              <img src="/assets/images/Icon/Open.svg"/>
            </Link>
          </h3>
          <TransferDetails proposal={proposal} dao={dao} beneficiaryProfile={beneficiaryProfile} detailView={false}/>

        </div>

        <div className={css.proposalActions + " clearfix"}>
          <div className={voteWrapperClass}>
            <div className={voteControls + " clearfix"}>
              <div className={css.voteDivider}>
                <VoteGraph dao={dao} size={40} proposal={proposal} />
              </div>

              <VoteBreakdown currentAccountAddress={currentAccountAddress} currentVote={currentAccountVote} dao={dao} isVotingNo={isVotingNo} isVotingYes={isVotingYes} proposal={proposal} detailView={false} />
            </div>

            <div className={css.voteButtons}>
              <VoteButtons currentAccountAddress={currentAccountAddress} currentVote={currentAccountVote} dao={dao} expired={expired} isVotingNo={isVotingNo} isVotingYes={isVotingYes} proposal={proposal} />
            </div>
          </div>

          {proposalEnded(proposal) ?
            <div>
              {this.state.preRedeemModalOpen ?
                <PreTransactionModal
                  actionType={executable && !redeemable ? ActionTypes.Execute : ActionTypes.Redeem}
                  action={executable && !redeemable ? executeProposal.bind(null, dao.address, proposal.id) : redeemProposal.bind(null, dao.address, proposal.id, currentAccountAddress)}
                  beneficiaryProfile={beneficiaryProfile}
                  closeAction={this.closePreRedeemModal.bind(this)}
                  dao={dao}
                  effectText={redemptionsTip}
                  proposal={proposal}
                /> : ""
              }
            </div>
            : ""
          }

          <div className={css.predictions}>
             <PredictionGraph
              proposal={proposal}
            />
            <BoostAmount proposal={proposal} />

            <div className={css.predictionButtons}>
              <PredictionButtons
                beneficiaryProfile={beneficiaryProfile}
                currentAccountAddress={currentAccountAddress}
                dao={dao}
                expired={this.state.expired}
                proposal={proposal}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export const ConnectedProposalCardContainer = connect<IStateProps,   IDispatchProps, IContainerProps>(mapStateToProps, mapDispatchToProps)(ProposalCardContainer);

export default (props: { proposalId: string, dao: IDAOState, currentAccountAddress: Address }) => {

  const arc = getArc();
  const dao = arc.dao(props.dao.address);

  const observable = combineLatest(
    dao.proposal(props.proposalId).state(), // state of the current proposal
    props.currentAccountAddress ? dao.proposal(props.proposalId).rewards({ beneficiary: props.currentAccountAddress}) : of([]), //1
    props.currentAccountAddress ? dao.proposal(props.proposalId).votes({ voter: props.currentAccountAddress }) : of([]), //3
    concat(of(new BN("0")), dao.ethBalance())
  );
  return <Subscribe observable={observable}>{
    (state: IObservableState<[IProposalState, IRewardState[], IVote[], BN]>): any => {
      if (state.isLoading) {
        return <div>Loading proposal {props.proposalId.substr(0, 6)} ...</div>;
      } else if (state.error) {
        return <div>{ state.error.message }</div>;
      } else {
        const proposal = state.data[0];
        const rewards = state.data[1];
        const votes = state.data[2];
        const daoEthBalance = state.data[3];
        return <ConnectedProposalCardContainer
          currentAccountAddress={props.currentAccountAddress}
          daoEthBalance={daoEthBalance}
          proposal={proposal}
          dao={props.dao}
          rewardsForCurrentUser={rewards}
          votesOfCurrentUser={votes}
          />;
      }
    }
  }</Subscribe>;
};
