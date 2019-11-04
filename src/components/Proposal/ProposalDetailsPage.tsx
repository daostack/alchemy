import { Address, IDAOState, IProposalStage, Vote } from "@daostack/client";
import * as classNames from "classnames";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import Countdown from "components/Shared/Countdown";
import { DiscussionEmbed } from "disqus-react";
import { humanProposalTitle, schemeName } from "lib/util";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";

import { Link, RouteComponentProps } from "react-router-dom";
import { proposalEnded } from "reducers/arcReducer";
import { closingTime } from "reducers/arcReducer";
import TagsSelector from "components/Proposal/Create/SchemeForms/TagsSelector";
import SocialShareModal from "../Shared/SocialShareModal";
import ActionButton from "./ActionButton";
import BoostAmount from "./Staking/BoostAmount";
import StakeButtons from "./Staking/StakeButtons";
import StakeGraph from "./Staking/StakeGraph";
import ProposalData from "./ProposalData";
import ProposalStatus from "./ProposalStatus";
import ProposalSummary from "./ProposalSummary";
import VoteBreakdown from "./Voting/VoteBreakdown";
import VoteButtons from "./Voting/VoteButtons";
import VoteGraph from "./Voting/VoteGraph";
import VotersModal from "./Voting/VotersModal";
import * as css from "./ProposalDetails.scss";

const ReactMarkdown = require("react-markdown");

interface IProps extends RouteComponentProps<any> {
  currentAccountAddress: Address;
  daoState: IDAOState;
  detailView?: boolean;
  proposalId: string;
}

interface IState {
  showVotersModal: boolean;
  showShareModal: boolean;
}

export default class ProposalDetailsPage extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      showShareModal: false,
      showVotersModal: false,
    };
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
    const { currentAccountAddress, daoState, proposalId } = this.props;

    return <ProposalData currentAccountAddress={currentAccountAddress} dao={daoState} proposalId={proposalId}>
      { props => {
        const {
          beneficiaryProfile,
          creatorProfile,
          currentAccountGenAllowance,
          currentAccountGenBalance,
          daoEthBalance,
          expired,
          member,
          proposal,
          rewards,
          stakes,
          votes,
        } = props;

        const proposalClass = classNames({
          [css.proposal]: true,
          clearfix: true,
        });

        const tags = proposal.tags;

        let currentAccountVote = 0;

        let currentVote: Vote;

        // TODO: the next line, is a hotfix for a  which filters the votes, should not be necessary,
        // bc these should be filter in the `proposals.votes({where: {voter...}} query above)`
        // https://daostack.tpondemand.com/RestUI/Board.aspx#page=board/5209716961861964288&appConfig=eyJhY2lkIjoiQjgzMTMzNDczNzlCMUI5QUE0RUE1NUVEOUQyQzdFNkIifQ==&boardPopup=bug/1766
        const currentAccountVotes = votes.filter((v: Vote) => v.staticState.voter === currentAccountAddress);
        if (currentAccountVotes.length > 0) {
          currentVote = currentAccountVotes[0];
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
            <BreadcrumbsItem weight={1} to={`/dao/${daoState.address}/scheme/${proposal.scheme.id}`}>{schemeName(proposal.scheme, proposal.scheme.address)}</BreadcrumbsItem>
            <BreadcrumbsItem weight={2} to={`/dao/${daoState.address}/proposal/${proposal.id}`}>{humanProposalTitle(proposal)}</BreadcrumbsItem>
            <div className={proposalClass + " clearfix"} data-test-id={"proposal-" + proposal.id}>
              <div className={css.proposalInfo}>
                <div>
                  <div className={css.statusContainer}>
                    <ProposalStatus proposalState={proposal} />
                  </div>
                  <ActionButton
                    currentAccountAddress={currentAccountAddress}
                    daoState={daoState}
                    daoEthBalance={daoEthBalance}
                    detailView
                    proposalState={proposal}
                    rewards={rewards}
                    expired={expired}
                  />
                </div>
                <h3 className={css.proposalTitleTop}>
                  <Link to={"/dao/" + daoState.address + "/proposal/" + proposal.id} data-test-id="proposal-title">{humanProposalTitle(proposal)}</Link>
                </h3>

                <div className={css.timer + " clearfix"}>
                  {!proposalEnded(proposal) ?
                    <span className={css.content}>
                      {!expired ?
                        <Countdown toDate={closingTime(proposal)} detailView /> :
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
                  <AccountPopup accountAddress={proposal.proposer} daoState={daoState} detailView />
                  <AccountProfileName accountAddress={proposal.proposer} accountProfile={creatorProfile} daoAvatarAddress={daoState.address} detailView />
                </div>

                <div className={css.description}>
                  <ReactMarkdown source={proposal.description}
                    renderers={{link: (props: { href: string; children: React.ReactNode }) => {
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

                <div className={css.voteButtonsBottom}>
                  <span className={css.voteLabel}>Vote:</span>
                  <div className={css.altVoteButtons}>
                    <VoteButtons
                      altStyle
                      currentAccountAddress={currentAccountAddress}
                      currentVote={currentAccountVote}
                      dao={daoState}
                      detailView
                      expired={expired}
                      currentAccountState={member}
                      proposal={proposal}
                    />
                  </div>
                </div>

                <button onClick={this.showShareModal} className={css.shareButton} data-test-id="share">
                  <img src={"/assets/images/Icon/share-white.svg"} />
                  <span>Share</span>
                </button>

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
                        detailView
                        expired={expired}
                        proposal={proposal} />
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
                      detailView
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
            <div className={css.disqus}>
              <DiscussionEmbed shortname={process.env.DISQUS_SITE} config={disqusConfig}/>
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
      }}
    </ProposalData>;
  }
}
