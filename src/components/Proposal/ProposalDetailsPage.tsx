import { Address, IDAOState, IProposalStage, IProposalState, Vote } from "@daostack/client";
import { getArc } from "arc";
import * as classNames from "classnames";
import AccountPopup from "components/Account/AccountPopup";
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
import { closingTime } from "reducers/arcReducer";
import { IProfileState } from "reducers/profilesReducer";
import { combineLatest, concat, of } from "rxjs";
import SocialShareModal from "../Shared/SocialShareModal";
import ActionButton from "./ActionButton";
import BoostAmount from "./Staking/BoostAmount";
import StakeButtons from "./Staking/StakeButtons";
import StakeGraph from "./Staking/StakeGraph";
import ProposalStatus from "./ProposalStatus";
import ProposalSummary from "./ProposalSummary";
import VoteBreakdown from "./Voting/VoteBreakdown";
import VoteButtons from "./Voting/VoteButtons";
import VoteGraph from "./Voting/VoteGraph";
import VotersModal from "./Voting/VotersModal";
import * as css from "./ProposalDetails.scss";

import BN = require("bn.js");

const ReactMarkdown = require("react-markdown");

interface IStateProps {
  beneficiaryProfile?: IProfileState;
  creatorProfile?: IProfileState;
}

interface IContainerProps extends RouteComponentProps<any> {
  dao: IDAOState;
  currentAccountAddress: Address;
  daoEthBalance: BN;
  proposal: IProposalState;
  votesOfCurrentUser: Vote[];
}

type IProps = IStateProps & IContainerProps;

const mapStateToProps = (state: IRootState, ownProps: IContainerProps): IProps => {
  const proposal = ownProps.proposal;

  return {
    ...ownProps,
    beneficiaryProfile: proposal.contributionReward ? state.profiles[proposal.contributionReward.beneficiary] : null,
    creatorProfile: state.profiles[proposal.proposer],
  };
};

interface IState {
  expired: boolean;
  showVotersModal: boolean;
  showShareModal: boolean;
}

class ProposalDetailsPage extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      expired: closingTime(props.proposal).isSameOrBefore(moment()),
      showShareModal: false,
      showVotersModal: false,
    };

    this.showShareModal = this.showShareModal.bind(this);
    this.closeShareModal = this.closeShareModal.bind(this);
    this.showVotersModal = this.showVotersModal.bind(this);
    this.closeVotersModal = this.closeVotersModal.bind(this);
    this.countdownEnded = this.countdownEnded.bind(this);
  }

  private showShareModal(_event: any): void {
    this.setState({ showShareModal: true });
  }

  private closeShareModal(_event: any): void {
    this.setState({ showShareModal: false });
  }

  private showVotersModal(_event: any): void {
    if (this.props.proposal.votesCount > 0) {
      this.setState({ showVotersModal: true });
    }
  }

  private closeVotersModal(_event: any): void {
    this.setState({ showVotersModal: false });
  }

  private countdownEnded(): void {
    this.setState({ expired: true });
  }

  public render(): any {
    const {
      beneficiaryProfile,
      creatorProfile,
      currentAccountAddress,
      dao,
      daoEthBalance,
      proposal,
      votesOfCurrentUser,
    } = this.props;

    const expired = this.state.expired;

    const proposalClass = classNames({
      [css.proposal]: true,
      clearfix: true,
    });

    let currentAccountVote = 0;

    let currentVote: Vote;
    if (votesOfCurrentUser.length > 0) {
      currentVote = votesOfCurrentUser[0];
      currentAccountVote = currentVote.staticState.outcome;
    }

    const url = proposal.url ? (/https?:\/\//.test(proposal.url) ? proposal.url : "//" + proposal.url) : null;

    const voteWrapperClass = classNames({
      [css.voteBox]: true,
      clearfix: true,
    });

    const disqusConfig = {
      url: process.env.BASE_URL + this.props.location.pathname,
      identifier: proposal.id,
      title: proposal.title,
    };

    return (
      <div className={css.wrapper}>
        <BreadcrumbsItem weight={1} to={`/dao/${dao.address}/scheme/${proposal.scheme.id}`}>{proposal.queue.name.replace(/([A-Z])/g, " $1")}</BreadcrumbsItem>
        <BreadcrumbsItem weight={2} to={`/dao/${dao.address}/proposal/${proposal.id}`}>{humanProposalTitle(proposal)}</BreadcrumbsItem>
        <div className={proposalClass + " clearfix"} data-test-id={"proposal-" + proposal.id}>
          <div className={css.proposalInfo}>
            <div>
              <div className={css.statusContainer}>
                <ProposalStatus proposalState={proposal} />
              </div>
              <ActionButton
                currentAccountAddress={currentAccountAddress}
                dao={dao}
                daoEthBalance={daoEthBalance}
                detailView
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
                    <Countdown toDate={closingTime(proposal)} detailView onEnd={this.countdownEnded} /> :
                    <span className={css.closedTime}>
                      {proposal.stage === IProposalStage.Queued ? "Expired" :
                        proposal.stage === IProposalStage.PreBoosted ? "Ready to Boost" :
                          "Closed"}&nbsp;
                      {closingTime(proposal).format("MMM D, YYYY")}
                    </span>
                  }
                </span>
                : " "
              }
            </div>

            <div className={css.createdBy}>
              <AccountPopup accountAddress={proposal.proposer} dao={dao} detailView />
              <AccountProfileName accountAddress={proposal.proposer} accountProfile={creatorProfile} daoAvatarAddress={dao.address} detailView />
            </div>

            <div className={css.description}>
              <ReactMarkdown source={proposal.description} />
            </div>

            {url ?
              <a href={url} className={css.attachmentLink} target="_blank" rel="noopener noreferrer">
                <img src="/assets/images/Icon/Attachment.svg" />
                Attachment &gt;
              </a>
              : " "
            }

            <ProposalSummary proposal={proposal} dao={dao} beneficiaryProfile={beneficiaryProfile} detailView />

            <div className={css.voteButtonsBottom}>
              <span className={css.voteLabel}>Vote:</span>
              <div className={css.altVoteButtons}>
                <VoteButtons
                  altStyle
                  currentAccountAddress={currentAccountAddress}
                  currentVote={currentAccountVote}
                  dao={dao}
                  detailView
                  expired={expired}
                  proposal={proposal}
                />
              </div>
              <button onClick={this.showShareModal} className={css.shareButton} data-test-id="share">
                <img src={"/assets/images/Icon/vote/for-btn-selected-w.svg"} />
                <span>Share</span>
              </button>
            </div>
          </div>

          <div className={css.proposalActions + " clearfix"}>
            <div className={voteWrapperClass}>
              <div>
                <div className={css.statusTitle}>
                  <h3>Votes</h3>
                  <span onClick={this.showVotersModal} className={classNames({ [css.clickable]: proposal.votesCount > 0 })}>
                    {proposal.votesCount} Vote{proposal.votesCount === 1 ? "" : "s"} &gt;
                  </span>
                </div>

                <div className={css.voteButtons}>
                  <VoteButtons currentAccountAddress={currentAccountAddress} currentVote={currentAccountVote} dao={dao} detailView expired={expired} proposal={proposal} />
                </div>
              </div>

              <div className={css.voteStatus + " clearfix"}>
                <div className={css.voteGraph}>
                  <VoteGraph size={90} proposal={proposal} />
                </div>

                <VoteBreakdown currentAccountAddress={currentAccountAddress} currentVote={currentAccountVote} dao={dao} proposal={proposal} detailView />
              </div>
            </div>

            <div className={css.predictions}>
              <div className={css.statusTitle}>
                <h3>Predictions</h3>
              </div>

              <div className={css.stakeButtons}>
                <StakeButtons
                  beneficiaryProfile={beneficiaryProfile}
                  currentAccountAddress={currentAccountAddress}
                  dao={dao}
                  expired={expired}
                  proposal={proposal}
                  detailView
                />
              </div>

              <div className={css.predictionStatus}>
                <StakeGraph
                  proposal={proposal}
                  detailView
                />
                <BoostAmount detailView expired={expired} proposal={proposal} />
              </div>
            </div>

          </div>
        </div>

        <h3 className={css.discussionTitle}>Discussion</h3>
        <div className={css.disqus}>
          <DiscussionEmbed shortname={process.env.DISQUS_SITE} config={disqusConfig}/>
        </div>

        {this.state.showVotersModal ?
          <VotersModal
            closeAction={this.closeVotersModal}
            currentAccountAddress={this.props.currentAccountAddress}
            dao={dao}
            proposal={proposal}
          /> : ""
        }

        {this.state.showShareModal ?
          <SocialShareModal
            closeHandler={this.closeShareModal}
            url={`https://alchemy.daostack.io/dao/${dao.address}/proposal/${proposal.id}`}
          /> : ""
        }
      </div>
    );
  }
}

const ConnectedProposalDetailsPage = connect<IStateProps, IContainerProps>(mapStateToProps)(ProposalDetailsPage);

export default (props: { proposalId: string; dao: IDAOState; currentAccountAddress: Address; detailView?: boolean } & RouteComponentProps<any>) => {

  const arc = getArc();
  const dao = arc.dao(props.dao.address);
  const proposalId = props.match.params.proposalId;
  const proposal = dao.proposal(proposalId);
  const observable = combineLatest(
    proposal.state(), // state of the current proposal
    props.currentAccountAddress ? proposal.votes({where: { voter: props.currentAccountAddress }}) : of([]), //3
    concat(of(new BN("0")), dao.ethBalance())
  );
  return <Subscribe observable={observable}>{
    (state: IObservableState<[IProposalState, Vote[], BN]>): any => {
      if (state.isLoading) {
        return <div className={css.loading}>Loading proposal {props.proposalId.substr(0, 6)} ...</div>;
      } else if (state.error) {
        return <div>{state.error.message}</div>;
      } else {
        const [proposal, votes, daoEthBalance] = state.data;
        return <ConnectedProposalDetailsPage
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
