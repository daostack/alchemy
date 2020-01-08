import { IDAOState, IProposalState, Address, ICompetitionSuggestion } from "@daostack/client";
import * as React from "react";

// import UserSearchField from "components/Shared/UserSearchField";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";

import { formatTokens, ensureHttps } from "lib/util";
import { competitionStatus, getProposalSubmission, getSubmissionVoterHasVoted } from "components/Scheme/ContributionRewardExtRewarders/Competition/utils";
import { IRootState } from "reducers";
import { connect } from "react-redux";
import classNames from "classnames";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import { IProfilesState } from "reducers/profilesReducer";
import { combineLatest } from "rxjs";
import Tooltip from "rc-tooltip";
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

type IProps = IExternalProps & IStateProps & ISubscriptionProps<[ICompetitionSuggestion, boolean]>;

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

    const status = competitionStatus(competition, [submission]);
    const currentAccountVotedForIt = this.props.data[1];
    // FAKE -- until can know how many votes per account per Competition
    const maxNumVotesReached = false;
    const canVote = status.voting && !currentAccountVotedForIt && !maxNumVotesReached;
    // FAKE -- until can know whether this is a winning submission
    const isWinner = false;
    // FAKE -- until can know whether this is a winning submission. allso need submission.redeemedAt to be undefined when not redeemed
    const canRedeem = isWinner && status.complete && !submission.redeemedAt && (submission.suggester === this.props.currentAccountAddress);

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
              isWinner ? 
                <img src="/assets/images/Icon/winner.svg"></img> :
                canRedeem ? 
                  <Tooltip overlay="Redeem for your winning submission">
                    <a className={classNames({[css.blueButton]: true, [css.redeemButton]: true})}
                      href="javascript:void(0)"
                      onClick={this.handleRedeem}
                      data-test-id="redeemSuggestion"
                    ><img src="/assets/images/Icon/vote/redeem.svg"/>Redeem</a>
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

        {submission.url ?
          <a href={ensureHttps(submission.url)} className={css.attachmentLink} target="_blank" rel="noopener noreferrer">
            <img src="/assets/images/Icon/Attachment.svg" />
            Attachment&nbsp;&gt;
          </a>
          : " "
        }

        { submission.description ?
          <div className={css.description}>
            <ReactMarkdown source={submission.description}
              renderers={{link: (props: { href: string; children: React.ReactNode }) => {
                return <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a>;
              }}}
            />
          </div>
          : "" }
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
    );
  },
});

export default connect(mapStateToProps)(SubmissionDetailsSubscription);
