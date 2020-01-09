import { IDAOState, IProposalState, Address, ICompetitionSuggestion, Reward, IRewardState } from "@daostack/client";
import * as React from "react";

// import UserSearchField from "components/Shared/UserSearchField";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";

import { formatTokens, ensureHttps, hasGpRewards } from "lib/util";
import { competitionStatus, getProposalSubmission, getSubmissionVoterHasVoted } from "components/Scheme/ContributionRewardExtRewarders/Competition/utils";
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

type IProps = IExternalProps & IStateProps & ISubscriptionProps<[ICompetitionSuggestion, boolean, IRewardState]>;

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
    const gpRewards = this.props.data[2];
    const hasRedeemedProposal = !hasGpRewards(gpRewards);

    const status = competitionStatus(competition, [submission]);
    // FAKE -- until can know how many votes per account per Competition
    const maxNumVotesReached = false;
    const canVote = status.voting && !currentAccountVotedForIt && !maxNumVotesReached;
    // FAKE -- until can know whether this is a winning submission
    const isWinner = false;
    const isRedeemed = !!submission.redeemedAt;
    const canRedeem = isWinner && status.complete && !isRedeemed && (submission.suggester === this.props.currentAccountAddress);
    // FAKE -- until client can supply tags
    const tags: any = null; // submission.tags;
    //const tags = submission.tags;

    return (
      <div className={css.submissionDetails}>
        <div className={css.header}>
          <div className={css.closeButton}><img onClick={this.props.handleClose} src="/assets/images/Icon/x-grey.svg"/></div>
          <div className={css.reputationVoted}>
            <img src="/assets/images/Icon/vote/for-gray.svg"/>
            {formatTokens(submission.totalVotes)}
          </div>
          <div className={css.actions}>
            { 
              (isWinner && (!status.complete || isRedeemed)) ? 
                <img src="/assets/images/Icon/winner.svg"></img> :
                canRedeem ? 
                  <Tooltip overlay={!hasRedeemedProposal ? "Proposal has not yet been redeemed" : "Redeem for your winning submission"}>
                    <a className={classNames({[css.blueButton]: true, [css.redeemButton]: true, [css.disabled]: !hasRedeemedProposal})}
                      href="javascript:void(0)"
                      onClick={hasRedeemedProposal ? this.handleRedeem : undefined}
                      data-test-id="redeemSuggestion"
                    ><img src="/assets/images/Icon/redeem.svg"/>Redeem</a>
                  </Tooltip> :
                  <Tooltip overlay={!status.voting ? "Voting has not yet begun" : currentAccountVotedForIt ? "You have already voted" : maxNumVotesReached ? "You have already voted the maximum number of times" : "Vote for this submission"}>
                    <a className={classNames({[css.blueButton]: true, [css.voteButton]: true, [css.disabled]: !canVote})}
                      href="javascript:void(0)"
                      onClick={canVote ? this.handleVote : undefined}
                      data-test-id="voteSuggestion"
                    >Vote<img src="/assets/images/Icon/vote/for-btn-selected-w.svg"/></a>
                  </Tooltip>
            }
          </div>
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
  checkForUpdate: [],
  createObservable: async (props: IExternalProps) => {
    /**
      * no subscriptions because assuming we'll get them from Details
      **/ 
    return combineLatest(
      getProposalSubmission(props.proposalState.id, props.suggestionId),
      getSubmissionVoterHasVoted(props.suggestionId, props.currentAccountAddress, false),
      props.proposalState.proposal.rewards({ where: { beneficiary: props.currentAccountAddress }})
        .pipe(map((rewards: Reward[]): Reward => rewards.length === 1 && rewards[0] || null))
        .pipe(mergeMap(((reward: Reward): Observable<IRewardState> => reward ? reward.state() : of(null)))),
    );
  },
});

export default connect(mapStateToProps)(SubmissionDetailsSubscription);
