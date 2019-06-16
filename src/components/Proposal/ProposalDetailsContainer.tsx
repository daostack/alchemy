import { Address, IDAOState, IProposalStage, IProposalState, IVote, Proposal } from "@daostack/client";
import { getArc } from "arc";
import BN = require("bn.js");
import * as classNames from "classnames";
import AccountPopupContainer from "components/Account/AccountPopupContainer";
import AccountProfileName from "components/Account/AccountProfileName";
import Countdown from "components/Shared/Countdown";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { DiscussionEmbed } from "disqus-react";
import { humanProposalTitle } from "lib/util";
import * as moment from "moment";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { connect } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";
import { IRootState } from "reducers";
import { proposalEnded } from "reducers/arcReducer";
import { closingTime, VoteOptions } from "reducers/arcReducer";
import { IProfileState } from "reducers/profilesReducer";
import { combineLatest, concat, from, of } from "rxjs";
import { concatMap } from "rxjs/operators";
import { isVotePending } from "selectors/operations";
import ActionButton from "./ActionButton";
import BoostAmount from "./Predictions/BoostAmount";
import PredictionButtons from "./Predictions/PredictionButtons";
import PredictionGraph from "./Predictions/PredictionGraph";
import ProposalSummary from "./ProposalSummary";
import VoteBreakdown from "./Voting/VoteBreakdown";
import VoteButtons from "./Voting/VoteButtons";
import VoteGraph from "./Voting/VoteGraph";

import * as css from "./ProposalDetails.scss";

interface IStateProps {
  beneficiaryProfile?: IProfileState;
  creatorProfile?: IProfileState;
  isVotingYes: boolean;
  isVotingNo: boolean;
}

interface IContainerProps extends RouteComponentProps<any> {
  dao: IDAOState;
  currentAccountAddress: Address;
  daoEthBalance: BN;
  proposal: IProposalState;
  votesOfCurrentUser: IVote[];
}

type IProps = IStateProps & IContainerProps;

const mapStateToProps = (state: IRootState, ownProps: IContainerProps): IProps => {
  const proposal = ownProps.proposal;

  return {
    ...ownProps,
    beneficiaryProfile: proposal.contributionReward ? state.profiles[proposal.contributionReward.beneficiary] : null,
    creatorProfile: state.profiles[proposal.proposer],
    isVotingYes: isVotePending(proposal.id, VoteOptions.Yes)(state),
    isVotingNo: isVotePending(proposal.id, VoteOptions.No)(state)
  };
};

interface IState {
  expired: boolean;
}

class ProposalDetailsContainer extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    this.state = {
      expired: closingTime(props.proposal).isSameOrBefore(moment())
    };

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
      isVotingNo,
      isVotingYes,
      votesOfCurrentUser
    } = this.props;

    const expired = this.state.expired;

    const isVoting = isVotingNo || isVotingYes;

    const proposalClass = classNames({
      [css.proposal]: true,
      clearfix: true
    });

    let currentAccountVote = 0;

    let currentVote: IVote;
    if (votesOfCurrentUser.length > 0) {
      currentVote = votesOfCurrentUser[0];
      currentAccountVote = currentVote.outcome;
    }

    const url = proposal.url ? (/https?:\/\//.test(proposal.url) ? proposal.url : "//" + proposal.url) : null;

    const voteWrapperClass = classNames({
      [css.voteBox]: true,
      clearfix: true,
      [css.unconfirmedVote]: isVoting
    });

    const disqusConfig = {
      url: process.env.BASE_URL + this.props.location.pathname,
      identifier: proposal.id,
      title: proposal.title
    };

    return (
      <div className={css.wrapper}>
        { proposal.scheme.id }
        <BreadcrumbsItem to={`/dao/${dao.address}/proposals/${proposal.scheme.id}`}>{proposal.queue.name.replace(/([A-Z])/g, " $1")}</BreadcrumbsItem>
        <BreadcrumbsItem to={`/dao/${dao.address}/proposals/${proposal.scheme.id}/${proposal.id}`}>{humanProposalTitle(proposal)}</BreadcrumbsItem>

        <div className={proposalClass + " clearfix"} data-test-id={"proposal-" + proposal.id}>
          <div className={css.proposalInfo}>
            <div>
              <ActionButton
                currentAccountAddress={currentAccountAddress}
                dao={dao}
                daoEthBalance={daoEthBalance}
                detailView={true}
                proposalState={proposal}
              />
            </div>
            <h3 className={css.proposalTitleTop}>
              <Link to={"/dao/" + dao.address + "/proposal/" + proposal.id} data-test-id="proposal-title">{humanProposalTitle(proposal)}</Link>
            </h3>

            <div className={css.timer + " clearfix"}>
              {!proposalEnded(proposal) ?
                <span className={css.content}>
                  {!expired ?
                    <Countdown toDate={closingTime(proposal)} detailView={true} onEnd={this.countdownEnded.bind(this)} /> :
                    <span className={css.closedTime}>
                      {proposal.stage === IProposalStage.Queued ? "Expired" :
                        proposal.stage === IProposalStage.PreBoosted ? "Ready to Boost" : // TODO: handle case of below threshold
                          "Closed"}&nbsp;
                       {closingTime(proposal).format("MMM D, YYYY")}
                    </span>
                  }
                </span>
                : " "
              }
            </div>

            <div className={css.createdBy}>
              <AccountPopupContainer accountAddress={proposal.proposer} dao={dao} detailView={true} />
              <AccountProfileName accountAddress={proposal.proposer} accountProfile={creatorProfile} daoAvatarAddress={dao.address} detailView={true} />
            </div>

            <div className={css.description}>
              {proposal.description}
            </div>

            {url ?
              <a href={url} className={css.attachmentLink} target="_blank">
                <img src="/assets/images/Icon/Attachment.svg" />
                Attachment &gt;
              </a>
              : " "
            }

            <ProposalSummary proposal={proposal} dao={dao} beneficiaryProfile={beneficiaryProfile} detailView={true} />

            <div className={css.voteButtonsBottom}>
              <span className={css.voteLabel}>Vote:</span>
              <VoteButtons
                altStyle={true}
                currentAccountAddress={currentAccountAddress}
                currentVote={currentAccountVote}
                dao={dao}
                detailView={true}
                expired={expired}
                isVotingNo={isVotingNo}
                isVotingYes={isVotingYes}
                proposal={proposal}
              />
            </div>
          </div>

          <div className={css.proposalActions + " clearfix"}>
            <div className={voteWrapperClass}>
              <div>
                <div className={css.statusTitle}>
                  <h3>Votes</h3>
                  <span>{proposal.votesCount} Vote{proposal.votesCount === 1 ? "" : "s"}</span>
                </div>

                <div className={css.voteButtons}>
                  <VoteButtons currentAccountAddress={currentAccountAddress} currentVote={currentAccountVote} dao={dao} detailView={true} expired={expired} isVotingNo={isVotingNo} isVotingYes={isVotingYes} proposal={proposal} />
                </div>
              </div>

              <div className={css.voteStatus + " clearfix"}>
                <div className={css.voteGraph}>
                  <VoteGraph size={90} dao={dao} proposal={proposal} />
                </div>

                <VoteBreakdown currentAccountAddress={currentAccountAddress} currentVote={currentAccountVote} dao={dao} isVotingNo={isVotingNo} isVotingYes={isVotingYes} proposal={proposal} detailView={true} />
              </div>
            </div>

            <div className={css.predictions}>
              <div className={css.statusTitle}>
                <h3>Predictions</h3>
              </div>

              <div className={css.stakeButtons}>
                <PredictionButtons
                  beneficiaryProfile={beneficiaryProfile}
                  currentAccountAddress={currentAccountAddress}
                  dao={dao}
                  expired={expired}
                  proposal={proposal}
                  detailView={true}
                />
              </div>

              <div className={css.predictionStatus}>
                <PredictionGraph
                  proposal={proposal}
                  detailView={true}
                />
                <BoostAmount detailView={true} expired={expired} proposal={proposal} />
              </div>
            </div>

          </div>
        </div>

        <h3 className={css.discussionTitle}>Discussion</h3>
        <DiscussionEmbed shortname={process.env.DISQUS_SITE} config={disqusConfig} />
      </div>
    );
  }
}

export const ConnectedProposalDetailsContainer = connect<IStateProps, IContainerProps>(mapStateToProps)(ProposalDetailsContainer);

export default (props: { proposalId: string, dao: IDAOState, currentAccountAddress: Address, detailView?: boolean } & RouteComponentProps<any>) => {

  const arc = getArc();
  const dao = arc.dao(props.dao.address);
  const proposalId = props.match.params.proposalId;

  const observable = from(dao.proposal(proposalId)).pipe(concatMap((proposal: Proposal) => combineLatest(
    proposal.state(), // state of the current proposal
    props.currentAccountAddress ? proposal.votes({ voter: props.currentAccountAddress }) : of([]), //3
    concat(of(new BN("0")), dao.ethBalance())
  ))
  );
  return <Subscribe observable={observable}>{
    (state: IObservableState<[IProposalState, IVote[], BN]>): any => {
      if (state.isLoading) {
        return <div className={css.loading}>Loading proposal {props.proposalId.substr(0, 6)} ...</div>;
      } else if (state.error) {
        return <div>{state.error.message}</div>;
      } else {
        const [proposal, votes, daoEthBalance] = state.data;
        return <ConnectedProposalDetailsContainer
          {...props}
          daoEthBalance={daoEthBalance}
          proposal={proposal}
          dao={props.dao}
          votesOfCurrentUser={votes}
        />;
      }
    }
  }</Subscribe>;
};
