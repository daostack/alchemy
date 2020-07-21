import { Address, IDAOState, IProposalStage, Vote } from "@daostack/arc.js";
import classNames from "classnames";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import ProposalCountdown from "components/Shared/ProposalCountdown";
import FollowButton from "components/Shared/FollowButton";
import { DiscussionEmbed } from "disqus-react";
import { humanProposalTitle, ensureHttps } from "lib/util";
import { schemeName } from "lib/schemeUtils";
import Analytics from "lib/analytics";
import { Page } from "pages";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";

import { Link, RouteComponentProps } from "react-router-dom";
import { closingTime, proposalEnded } from "lib/proposalHelpers";
import TagsSelector from "components/Proposal/Create/SchemeForms/TagsSelector";
import { rewarderContractName } from "components/Scheme/ContributionRewardExtRewarders/rewardersProps";
import SocialShareModal from "../Shared/SocialShareModal";
import ActionButton from "./ActionButton";
import BoostAmount from "./Staking/BoostAmount";
import StakeButtons from "./Staking/StakeButtons";
import StakeGraph from "./Staking/StakeGraph";
import { default as ProposalData, IInjectedProposalProps } from "./ProposalData";
import ProposalStatus from "./ProposalStatus";
import ProposalSummary from "./ProposalSummary";
import VoteBreakdown from "./Voting/VoteBreakdown";
import VoteButtons from "./Voting/VoteButtons";
import VoteGraph from "./Voting/VoteGraph";
import VotersModal from "./Voting/VotersModal";
import * as css from "./ProposalDetails.scss";
import ProposalDescription from "components/Shared/ProposalDescription";

interface IExternalProps extends RouteComponentProps<any> {
  currentAccountAddress: Address;
  daoState: IDAOState;
  detailView?: boolean;
  proposalId: string;
}

type IProps = IExternalProps & IInjectedProposalProps;

interface IState {
  showVotersModal: boolean;
  showShareModal: boolean;
}

class ProposalDetailsPage extends React.Component<IProps, IState> {
  /**
   * Define these here rather than in `render` to minimize rerendering, particularly
   * of the disqus component
   **/
  private currentAccountVote = 0;
  private crxContractName: string;
  private disqusConfig = { url: "", identifier: "", title: "" };
  private proposalClass = classNames({
    [css.proposal]: true,
    clearfix: true,
  });

  constructor(props: IProps) {
    super(props);

    this.state = {
      showShareModal: false,
      showVotersModal: false,
    };
  }

  public componentDidMount() {
    Analytics.track("Page View", {
      "Page Name": Page.ProposalDetails,
      "DAO Address": this.props.daoState.address,
      "DAO Name": this.props.daoState.name,
      "Proposal Hash": this.props.proposal.id,
      "Proposal Title": this.props.proposal.title,
      "Scheme Address": this.props.proposal.scheme.id,
      "Scheme Name": this.props.proposal.scheme.name,
    });

    // TODO: the next line, is a hotfix for a  which filters the votes, should not be necessary,
    // bc these should be filter in the `proposals.votes({where: {voter...}} query above)`
    // https://daostack.tpondemand.com/RestUI/Board.aspx#page=board/5209716961861964288&appConfig=eyJhY2lkIjoiQjgzMTMzNDczNzlCMUI5QUE0RUE1NUVEOUQyQzdFNkIifQ==&boardPopup=bug/1766
    const currentAccountVotes = this.props.votes.filter((v: Vote) => v.staticState.voter === this.props.currentAccountAddress);
    if (currentAccountVotes.length > 0) {
      const currentVote = currentAccountVotes[0];
      this.currentAccountVote = currentVote.staticState.outcome;
    }

    this.crxContractName = rewarderContractName(this.props.proposal.scheme);
  }

  private showShareModal = (_event: any): void => {
    this.setState({ showShareModal: true });
  }

  private closeShareModal = (_event: any): void => {
    this.setState({ showShareModal: false });
  }

  private showVotersModal = (votesCount: number) => (_event: any): void => {
    if (votesCount > 0) {
      this.setState({ showVotersModal: true });
    }
  }

  private closeVotersModal = (_event: any): void => {
    this.setState({ showVotersModal: false });
  }

  public render(): RenderOutput {
    const {
      beneficiaryProfile,
      creatorProfile,
      currentAccountAddress,
      currentAccountGenAllowance,
      currentAccountGenBalance,
      daoEthBalance,
      daoState,
      expired,
      member,
      proposal,
      rewards,
      stakes,
    } = this.props;

    if (daoState.id !== proposal.dao.id) {
      return <div>`The given proposal does not belong to ${daoState.name}. Please check the browser url.`</div>;
    }

    const tags = proposal.tags;

    const url = ensureHttps(proposal.url);

    this.disqusConfig.title = this.props.proposal.title;
    this.disqusConfig.url = process.env.BASE_URL + this.props.location.pathname;
    this.disqusConfig.identifier = this.props.proposalId;

    return (
      <div className={css.wrapper}>
        <BreadcrumbsItem weight={1} to={`/dao/${daoState.address}/scheme/${proposal.scheme.id}`}>{schemeName(proposal.scheme, proposal.scheme.address)}</BreadcrumbsItem>
        <BreadcrumbsItem weight={2} to={`/dao/${daoState.address}/proposal/${proposal.id}`}>{humanProposalTitle(proposal, 40)}</BreadcrumbsItem>
        <div className={this.proposalClass} data-test-id={"proposal-" + proposal.id}>
          <div className={css.proposalInfo}>
            <div>
              <div className={css.statusContainer}>
                <ProposalStatus proposalState={proposal} />
              </div>

              <div className={css.actionButtonContainer}>
                <ActionButton
                  currentAccountAddress={currentAccountAddress}
                  daoState={daoState}
                  daoEthBalance={daoEthBalance}
                  detailView
                  parentPage={Page.ProposalDetails}
                  proposalState={proposal}
                  rewards={rewards}
                  expired={expired}
                />
              </div>
              {
                (this.crxContractName) ? <div className={css.gotoCompetition}>
                  {
                    <Link to={`/dao/${daoState.address}/crx/proposal/${proposal.id}`}>Go to {this.crxContractName}&nbsp;&gt;</Link>
                  }
                </div> : ""
              }
            </div>
            <h3 className={css.proposalTitleTop}>
              <Link to={"/dao/" + daoState.address + "/proposal/" + proposal.id} data-test-id="proposal-title">{humanProposalTitle(proposal)}</Link>
            </h3>

            <div className={css.timer + " clearfix"}>
              {!proposalEnded(proposal) ?
                <span className={css.content}>
                  {!expired ?
                    <ProposalCountdown proposal={proposal} detailView /> :
                    <span className={css.closedTime}>
                      {proposal.stage === IProposalStage.Queued ? "Expired" :
                        proposal.stage === IProposalStage.PreBoosted ? "Ready to Boost" :
                          "Closed"}&nbsp;
                      {closingTime(proposal).format("MMM D, YYYY")}
                    </span>
                  }
                </span>
                : " "}
            </div>

            <div className={css.createdBy}>
              <AccountPopup accountAddress={proposal.proposer} daoState={daoState} width={35} />
              <AccountProfileName accountAddress={proposal.proposer} accountProfile={creatorProfile} daoAvatarAddress={daoState.address} detailView />
            </div>

            <div className={css.description}>
              <ProposalDescription description={proposal.description} />
            </div>

            {url ?
              <a href={url} className={css.attachmentLink} target="_blank" rel="noopener noreferrer">
                <img src="/assets/images/Icon/Attachment.svg" />
            Attachment &gt;
              </a>
              : " "
            }

            <div className={classNames({
              [css.proposalSummaryContainer]: true,
              [css.hasTags]: tags && tags.length,
            })}>
              <ProposalSummary proposal={proposal} dao={daoState} beneficiaryProfile={beneficiaryProfile} detailView />
            </div>

            {tags && tags.length ? <div className={css.tagsContainer}>
              <TagsSelector readOnly darkTheme tags={tags}></TagsSelector>
            </div> : ""}

            <div className={css.buttonBar}>
              <div className={css.voteButtonsBottom}>
                <span className={css.voteLabel}>Vote:</span>
                <div className={css.altVoteButtons}>
                  <VoteButtons
                    altStyle
                    currentAccountAddress={currentAccountAddress}
                    currentVote={this.currentAccountVote}
                    dao={daoState}
                    expired={expired}
                    currentAccountState={member}
                    proposal={proposal}
                    parentPage={Page.ProposalDetails}
                  />
                </div>
              </div>

              <button onClick={this.showShareModal} className={css.shareButton} data-test-id="share">
                <img src={"/assets/images/Icon/share-white.svg"} />
                <span>Share</span>
              </button>

              <div className={css.followButton}><FollowButton type="proposals" id={proposal.id} style="bigButton" /></div>
            </div>
          </div>

          <div className={css.proposalActions + " clearfix"}>
            <div className={css.votes}>
              <div className={css.header}>
                <div className={css.title}>Votes</div>
                <div onClick={this.showVotersModal(proposal.votesCount)} className={classNames({ [css.voters]: true, [css.clickable]: proposal.votesCount > 0 })}>
                  {proposal.votesCount} Vote{proposal.votesCount === 1 ? "" : "s"} &gt;
                </div>

                <div className={css.voteButtons}>
                  <VoteButtons
                    currentAccountAddress={currentAccountAddress}
                    currentAccountState={member}
                    currentVote={this.currentAccountVote}
                    dao={daoState}
                    expired={expired}
                    proposal={proposal}
                    parentPage={Page.ProposalDetails}
                  />
                </div>
              </div>

              <div className={css.voteStatus}>
                <div className={css.voteGraph}>
                  <VoteGraph size={90} proposal={proposal} />
                </div>

                <VoteBreakdown
                  currentAccountAddress={currentAccountAddress}
                  currentAccountState={member}
                  currentVote={this.currentAccountVote}
                  daoState={daoState}
                  detailView
                  proposal={proposal} />
              </div>
            </div>

            <div className={css.predictions}>
              <div className={css.header}>
                <div className={css.title}>Predictions</div>

                <div className={css.stakeButtons}>
                  <StakeButtons
                    beneficiaryProfile={beneficiaryProfile}
                    currentAccountAddress={currentAccountAddress}
                    currentAccountGens={currentAccountGenBalance}
                    currentAccountGenStakingAllowance={currentAccountGenAllowance}
                    dao={daoState}
                    parentPage={Page.ProposalDetails}
                    expired={expired}
                    proposal={proposal}
                    stakes={stakes}
                  />
                </div>
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
          <DiscussionEmbed shortname={process.env.DISQUS_SITE} config={this.disqusConfig} />
        </div>

        {this.state.showVotersModal ?
          <VotersModal
            closeAction={this.closeVotersModal}
            currentAccountAddress={this.props.currentAccountAddress}
            dao={daoState}
            proposal={proposal}
            accountProfile={creatorProfile}
          /> : ""
        }

        {this.state.showShareModal ?
          <SocialShareModal
            closeHandler={this.closeShareModal}
            url={`https://alchemy.daostack.io/dao/${daoState.address}/proposal/${proposal.id}`}
          /> : ""
        }
      </div>
    );
  }
}

export default function ProposalDetailsPageData(props: IExternalProps) {
  const { currentAccountAddress, daoState, proposalId } = props;
  return <ProposalData currentAccountAddress={currentAccountAddress} daoState={daoState} proposalId={proposalId} subscribeToProposalDetails>
    {proposalData => <ProposalDetailsPage {...props} {...proposalData} />}
  </ProposalData>;
}
