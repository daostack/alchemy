import { IDAOState, IProposalState, Address, Reward, IRewardState, CompetitionVote } from "@daostack/client";
import * as React from "react";

import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";

import { formatTokens, ensureHttps, hasGpRewards, hasCrRewards } from "lib/util";
import { competitionStatus, getProposalSubmission, getSubmissionVoterHasVoted, ICompetitionSubmissionFake, getCompetitionVotes } from "components/Scheme/ContributionRewardExtRewarders/Competition/utils";
import { IRootState } from "reducers";
import { connect } from "react-redux";
import classNames from "classnames";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import { IProfilesState } from "reducers/profilesReducer";
import { combineLatest, of, Observable } from "rxjs";
import Tooltip from "rc-tooltip";
import TagsSelector from "components/Proposal/Create/SchemeForms/TagsSelector";
import { map, mergeMap } from "rxjs/operators";
import * as css from "./Competitions.scss";

const ReactMarkdown = require("react-markdown");

type ISubscriptionState = [ICompetitionSubmissionFake, boolean, Array<CompetitionVote>, IRewardState];

interface IStateProps {
  profiles: IProfilesState;
}

interface IExternalProps {
  currentAccountAddress: Address;
  daoState: IDAOState;
  proposalState: IProposalState;
  suggestionId: string; // this is the real id (not the counter)
  handleClose: () => any;
  handleVote: () => any;
  handleRedeem: () => any;
}

type IProps = IExternalProps & IStateProps & ISubscriptionProps<ISubscriptionState>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ...ownProps,
    profiles: state.profiles,
  };
};

class SubmissionDetails extends React.Component<IProps, null> {

  private handleVote = (): void => {
    this.props.handleVote();
  }

  private handleRedeem = (): void => {
    this.props.handleRedeem();
  }


  public render(): RenderOutput {

    const competition = this.props.proposalState.competition;
    const submission = this.props.data[0];
    const currentAccountVotedForIt = this.props.data[1];
    const currentAccountVotes = this.props.data[2];
    const gpRewards = this.props.data[3];
    const hasRedeemedProposal = !hasGpRewards(gpRewards) && !hasCrRewards(this.props.proposalState.contributionReward);

    const status = competitionStatus(competition, [submission]);
    const maxNumVotesReached = currentAccountVotes.length === competition.numberOfVotesPerVoter;
    const canVote = status.voting && !currentAccountVotedForIt && !maxNumVotesReached;
    const isWinner = submission.isWinner;
    const isRedeemed = !!submission.redeemedAt;
    const canRedeem = isWinner && status.complete && !isRedeemed && (submission.suggester === this.props.currentAccountAddress);
    const tags = submission.tags;

    return (
      <div className={css.submissionDetails}>
        <div className={css.header}>
          <div className={css.closeButton}><img onClick={this.props.handleClose} src="/assets/images/Icon/x-grey.svg"/></div>
          <div className={css.reputationVoted}>
            <img src="/assets/images/Icon/vote/for-gray.svg"/>
            {formatTokens(submission.totalVotes)}
          </div>
          { (canRedeem || !status.complete) ?
            <div className={css.actions}>
              { 
                canRedeem ? 
                  <Tooltip overlay={!hasRedeemedProposal ? "Proposal has not yet been redeemed" : "Redeem for your winning submission"}>
                    <a className={classNames({[css.blueButton]: true, [css.redeemButton]: true, [css.disabled]: !hasRedeemedProposal})}
                      href="javascript:void(0)"
                      onClick={hasRedeemedProposal ? this.handleRedeem : undefined}
                      data-test-id="redeemSuggestion"
                    ><img src="/assets/images/Icon/redeem.svg"/>Redeem</a>
                  </Tooltip> : !status.complete ?
                    <Tooltip overlay={!status.voting ? "Voting has not yet begun" : currentAccountVotedForIt ? "You have already voted" : maxNumVotesReached ? "You have already voted the maximum number of times" : "Vote for this submission"}>
                      <a className={classNames({[css.blueButton]: true, [css.voteButton]: true, [css.disabled]: !canVote})}
                        href="javascript:void(0)"
                        onClick={canVote ? this.handleVote : undefined}
                        data-test-id="voteSuggestion"
                      >Vote<img src="/assets/images/Icon/vote/for-btn-selected-w.svg"/></a>
                    </Tooltip> : ""
              }
            </div> : ""
          } 
          
          {(status.complete && isWinner) ? <div className={css.winnerIcon} ><img src="/assets/images/Icon/winner.svg"></img></div> : ""}
        </div>

        <div className={css.title}>{submission.title}</div>

        <div className={css.proposer}>
          <AccountPopup accountAddress={submission.suggester} daoState={this.props.daoState}/>
          <AccountProfileName accountAddress={submission.suggester} accountProfile={this.props.profiles[submission.suggester]} daoAvatarAddress={this.props.daoState.address} detailView={false} />
        </div>


        { tags && tags.length ?
          <div className={css.tagsContainer}>
            <TagsSelector readOnly tags={tags}></TagsSelector>
          </div> : "" }

        { submission.description ?
          <div className={css.description}>
            <ReactMarkdown source={submission.description}
              renderers={{link: (props: { href: string; children: React.ReactNode }) => {
                return <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a>;
              }}}
            />
          </div>
          : "" }

        {submission.url ?
          <a href={ensureHttps(submission.url)} className={css.attachmentLink} target="_blank" rel="noopener noreferrer">
            <img src="/assets/images/Icon/Attachment.svg" />
            Attachment&nbsp;&gt;
          </a>
          : ""
        }
      </div>
    );
  }
}

const SubmissionDetailsSubscription = withSubscription({
  wrappedComponent: SubmissionDetails,
  loadingComponent: null,
  errorComponent: (props) => <div>{ props.error.message }</div>,
  checkForUpdate: ["currentAccountAddress"],
  createObservable: async (props: IExternalProps) => {
    return combineLatest(
      // this query is assumed to already be in the cache and well-subscribed
      getProposalSubmission(props.proposalState.id, props.suggestionId, true),
      getSubmissionVoterHasVoted(props.suggestionId, props.currentAccountAddress, true),
      getCompetitionVotes(props.proposalState.id, props.currentAccountAddress, true),
      props.proposalState.proposal.rewards({ where: { beneficiary: props.currentAccountAddress, subscribe: true }})
        .pipe(map((rewards: Reward[]): Reward => rewards.length === 1 && rewards[0] || null))
        .pipe(mergeMap(((reward: Reward): Observable<IRewardState> => reward ? reward.state() : of(null)))),
    );
  },
});

export default connect(mapStateToProps)(SubmissionDetailsSubscription);
