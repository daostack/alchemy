import { Address, IDAOState, IProposalStage, Vote } from "@daostack/client";
import { enableWalletProvider, getArc } from "arc";
import ThreeBoxComments from '3box-comments-react';
import { threeboxLogin } from "actions/profilesActions";
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
import { connect } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import { closingTime, proposalEnded } from "lib/proposalHelpers";
import TagsSelector from "components/Proposal/Create/SchemeForms/TagsSelector";
import { rewarderContractName } from "components/Scheme/ContributionRewardExtRewarders/rewardersProps";
import SocialShareModal from "../Shared/SocialShareModal";
import ActionButton from "./ActionButton";
import BoostAmount from "./Staking/BoostAmount";
import StakeButtons from "./Staking/StakeButtons";
import StakeGraph from "./Staking/StakeGraph";
import { default as ProposalData, IInjectedProposalProps} from "./ProposalData";
import ProposalStatus from "./ProposalStatus";
import ProposalSummary from "./ProposalSummary";
import VoteBreakdown from "./Voting/VoteBreakdown";
import VoteButtons from "./Voting/VoteButtons";
import VoteGraph from "./Voting/VoteGraph";
import VotersModal from "./Voting/VotersModal";
import * as css from "./ProposalDetails.scss";

const ReactMarkdown = require("react-markdown");

interface IExternalProps extends RouteComponentProps<any> {
  currentAccountAddress: Address;
  daoState: IDAOState;
  detailView?: boolean;
  proposalId: string;
}

interface IStateProps {
  currentAccountProfile: IProfileState;
  threeBox: any;
}

interface IDispatchProps {
  showNotification: typeof showNotification;
  threeboxLogin: typeof threeboxLogin;
}

const mapStateToProps = (state: IRootState, ownProps: IExternalProps & IInjectedProposalProps): IExternalProps & IInjectedProposalProps & IStateProps => {
  return {
    ...ownProps,
    currentAccountProfile: state.profiles[ownProps.currentAccountAddress],
    threeBox: state.profiles.threeBox,
  };
};

const mapDispatchToProps = {
  showNotification,
  threeboxLogin,
};

type IProps = IExternalProps & IInjectedProposalProps & IStateProps & IDispatchProps;

interface IState {
  showVotersModal: boolean;
  showShareModal: boolean;
}

class ProposalDetailsPage extends React.Component<IProps, IState> {

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
  }

  /**
   * Define these here rather than in `render` to minimize rerendering, particularly
   * of the disqus component
   **/
  private disqusConfig = { url: "", identifier: "", title: "" };
  private proposalClass = classNames({
    [css.proposal]: true,
    clearfix: true,
  });

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

  private handleThreeBoxLogin = async () => {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }
    await this.props.threeboxLogin(this.props.currentAccountAddress);
  }

  private parseYouTubeVideoIdFromUri = (url: string): string => {
    const match = url.match(/(\/|%3D|v=)([0-9A-z-_]{11})([%#?&]|$)/);
    if (match) {
      if (match.length >= 3) {
        return match[2];
      } else {
        // eslint-disable-next-line no-console
        console.error("The outube url is not valid.");
      }
    }
    return null;
  }

  private getVimeoIdFromUrl = (url: string): string => {
    const match = url.match(/^.*(?:vimeo.com)\/(?:channels\/|channels\/\w+\/|groups\/[^/]*\/videos\/|album\/\d+\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
    if (match) {
      if (match.length >= 3) {
        return match[1];
      } else {
      // eslint-disable-next-line no-console
        console.error("The vimeo url is not valid.");
      }
    }
    return null;
  }

  public render(): RenderOutput {
    const {
      beneficiaryProfile,
      creatorProfile,
      currentAccountAddress,
      currentAccountGenAllowance,
      currentAccountGenBalance,
      currentAccountProfile,
      daoEthBalance,
      daoState,
      expired,
      member,
      proposalId,
      proposal,
      rewards,
      stakes,
      threeBox,
      votes,
    } = this.props;

    this.disqusConfig.title = proposal.title;
    this.disqusConfig.url = process.env.BASE_URL + this.props.location.pathname;
    this.disqusConfig.identifier = proposalId;

    const tags = proposal.tags;
    let currentAccountVote = 0;

    // TODO: the next line, is a hotfix for a  which filters the votes, should not be necessary,
    // bc these should be filter in the `proposals.votes({where: {voter...}} query above)`
    // https://daostack.tpondemand.com/RestUI/Board.aspx#page=board/5209716961861964288&appConfig=eyJhY2lkIjoiQjgzMTMzNDczNzlCMUI5QUE0RUE1NUVEOUQyQzdFNkIifQ==&boardPopup=bug/1766
    const currentAccountVotes = votes.filter((v: Vote) => v.staticState.voter === currentAccountAddress);
    if (currentAccountVotes.length > 0) {
      const currentVote = currentAccountVotes[0];
      currentAccountVote = currentVote.staticState.outcome;
    }

    const url = ensureHttps(proposal.url);
    const crxContractName = rewarderContractName(proposal.scheme);

    const voteWrapperClass = classNames({
      [css.voteBox]: true,
      clearfix: true,
    });

    const arc = getArc();

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
                (crxContractName) ? <div className={css.gotoCompetition}>
                  {
                    <Link to={`/dao/${daoState.address}/crx/proposal/${proposal.id}`}>Go to {crxContractName}&nbsp;&gt;</Link>
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
              <ReactMarkdown source={proposal.description}
                renderers={{link: (props: { href: string; children: React.ReactNode }) => {
                  if (props.href) {
                    const url = new URL(props.href);
                    const videoId = this.parseYouTubeVideoIdFromUri(props.href);
                    if (videoId) {
                      const start = url.searchParams.get("t") || "0";

                      return <iframe className={css.embeddedVideo} frameBorder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                        src={`${url.protocol}//www.youtube-nocookie.com/embed/${videoId}?start=${start}`}>
                      </iframe>;
                    } else {
                      const videoId = this.getVimeoIdFromUrl(props.href);
                      if (videoId) {
                        return <iframe className={css.embeddedVideo} frameBorder="0" allow="autoplay; fullscreen" allowFullScreen
                          src={`${url.protocol}//player.vimeo.com/video/${videoId}`}>
                        </iframe>;
                      }
                    }
                  }
                  return <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a>;
                }}}
              />
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

            { tags && tags.length ? <div className={css.tagsContainer}>
              <TagsSelector readOnly darkTheme tags={tags}></TagsSelector>
            </div> : "" }

            <div className={css.buttonBar}>
              <div className={css.voteButtonsBottom}>
                <span className={css.voteLabel}>Vote:</span>
                <div className={css.altVoteButtons}>
                  <VoteButtons
                    altStyle
                    currentAccountAddress={currentAccountAddress}
                    currentVote={currentAccountVote}
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
            <div className={voteWrapperClass}>
              <div>
                <div className={css.statusTitle}>
                  <h3>Votes</h3>
                  <span onClick={this.showVotersModal(proposal.votesCount)} className={classNames({ [css.clickable]: proposal.votesCount > 0 })}>
                    {proposal.votesCount} Vote{proposal.votesCount === 1 ? "" : "s"} &gt;
                  </span>
                </div>

                <div className={css.voteButtons}>
                  <VoteButtons
                    currentAccountAddress={currentAccountAddress}
                    currentAccountState={member}
                    currentVote={currentAccountVote}
                    dao={daoState}
                    expired={expired}
                    proposal={proposal}
                    parentPage={Page.ProposalDetails}
                  />
                </div>
              </div>

              <div className={css.voteStatus + " clearfix"}>
                <div className={css.voteGraph}>
                  <VoteGraph size={90} proposal={proposal} />
                </div>

                <VoteBreakdown
                  currentAccountAddress={currentAccountAddress}
                  currentAccountState={member}
                  currentVote={currentAccountVote}
                  daoState={daoState}
                  detailView
                  proposal={proposal} />
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
                  currentAccountGens={currentAccountGenBalance}
                  currentAccountGenStakingAllowance={currentAccountGenAllowance}
                  dao={daoState}
                  parentPage={Page.ProposalDetails}
                  expired={expired}
                  proposal={proposal}
                  stakes={stakes}
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
        <p className={css.discussionWarning}>We are moving from Disqus to 3Box for commenting! Both are available here for a short time so important comments can be copied from Disqus to 3Box.</p>
        <div className={css.disqus}>
          <ThreeBoxComments
            // required
            spaceName="DAOstack"
            threadName={proposal.id}
            adminEthAddr={"0x0084FB1d84F2359Cafd00f92B901C121521d6809"}

            box={threeBox}

            // Required props for context A) & B)
            currentUserAddr={currentAccountAddress}

            // Required prop for context B)
            loginFunction={this.handleThreeBoxLogin}

            // Required prop for context C)
            ethereum={arc.web3 ? arc.web3.eth : null}

            showCommentCount={10}
            useHovers
            currentUser3BoxProfile={currentAccountProfile}
            userProfileURL={address => `${process.env.BASE_URL}/profile/${address}`}
          />

          <DiscussionEmbed shortname={process.env.DISQUS_SITE} config={this.disqusConfig}/>
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

//const ConnectedProposalData = connect(mapStateToProps, null)(ProposalData);

export default connect(mapStateToProps, mapDispatchToProps)((props: IExternalProps & IStateProps & IDispatchProps) => {
  const { currentAccountAddress, daoState, proposalId } = props;
  return <ProposalData currentAccountAddress={currentAccountAddress} daoState={daoState} proposalId={proposalId} subscribeToProposalDetails>
    { proposalData => <ProposalDetailsPage {...props} {...proposalData} /> }
  </ProposalData>;
});
