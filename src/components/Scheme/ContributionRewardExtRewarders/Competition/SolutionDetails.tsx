import { IDAOState, IProposalState, Address, Competition, CompetitionSuggestion, ICompetitionSuggestion } from "@daostack/client";
import * as React from "react";
import TrainingTooltip from "components/Shared/TrainingTooltip";

// import UserSearchField from "components/Shared/UserSearchField";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";

import { formatTokens } from "lib/util";
import { getArc } from "arc";
import { map, filter, first } from "rxjs/operators";
import { from } from "rxjs";
import { competitionStatus } from "components/Scheme/ContributionRewardExtRewarders/Competition/utils";
import { IRootState } from "reducers";
import { connect } from "react-redux";
import classNames from "classnames";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import { IProfileState } from "reducers/profilesReducer";
import * as css from "./Competitions.scss";

interface IStateProps {
  currentAccountAddress: Address;
  currentAccountProfile: IProfileState;
}

interface IExternalProps {
  daoState: IDAOState;
  proposalState: IProposalState;
  suggestionId: string; // this is the real id (not the counter)
  handleClose: () => any;
  handleVote: () => any;
  handleRedeem: () => any;
}

type IProps = IExternalProps & IStateProps & ISubscriptionProps<ICompetitionSuggestion>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ...ownProps,
    currentAccountAddress: state.web3.currentAccountAddress,
    currentAccountProfile: state.profiles[state.web3.currentAccountAddress],
  };
};

class SolutionDetails extends React.Component<IProps, null> {

  public handleVote = (): void => {
    this.props.handleVote();
  }

  public render(): RenderOutput {

    const competition = this.props.proposalState.competition;
    const submission = this.props.data;

    const status = competitionStatus(competition);
    const canVote = status.voting;
    // FAKE -- until can know whether this is a winning submission
    const isWinner = true;
    const canRedeem = isWinner && status.complete && !submission.redeemedAt && (submission.suggester === this.props.currentAccountAddress);
    // FAKE -- until we can know whether the current account has voted for it
    const currentAccountVotedForIt = false;

    return (
      <div className={css.solutionDetails}>
        <div className={css.header}>
          <div className={css.closeButton}><img onClick={this.props.handleClose} src="/assets/images/Icon/x-grey.svg"/></div>
          <div className={css.reputationVoted}>
            <img src="/assets/images/Icon/vote/for-gray.svg"/>
            {formatTokens(submission.totalVotes)}
          </div>
          <div className={css.actions}>
            { (canVote && !currentAccountVotedForIt) ?

              <TrainingTooltip overlay="Vote for this submission">
                <a className={classNames({[css.blueButton]: true, [css.voteButton]: true})}
                  href="javascript:void(0)"
                  onClick={this.props.handleVote}
                  data-test-id="voteSuggestion"
                >Vote<img src="/assets/images/Icon/vote/for-btn-selected-w.svg"/></a>
              </TrainingTooltip> :

              canRedeem ? 
              
                <TrainingTooltip overlay="Redeem for your winning submission">
                  <a className={classNames({[css.blueButton]: true, [css.redeemButton]: true})}
                    href="javascript:void(0)"
                    onClick={this.props.handleRedeem}
                    data-test-id="redeemSuggestion"
                  ><img src="/assets/images/Icon/vote/redeem.svg"/>Redeem</a>
                </TrainingTooltip> :

                isWinner ? 
                  <img src="/assets/images/Icon/winner.svg"></img> : ""
            }
          </div>
        </div>
        
        <div className={css.proposer}>
          <AccountPopup accountAddress={submission.suggester} daoState={this.props.daoState}/>
          <AccountProfileName accountAddress={submission.suggester} accountProfile={this.props.currentAccountProfile} daoAvatarAddress={this.props.daoState.address} detailView={false} />
        </div>
        <div className={css.description}>{submission.title}</div>
        <div className={css.description}>{submission.description}</div>
      </div>
    );
  }
}

const SolutionDetailsSubscription = withSubscription({
  wrappedComponent: SolutionDetails,
  loadingComponent: null,
  errorComponent: (props) => <div>{ props.error.message }</div>,
  checkForUpdate: [],
  createObservable: async (props: IExternalProps) => {

    // FAKE -- until we can ask the client lib for a specific suggestion id
    const competition = new Competition(props.proposalState.id, getArc());
    // no need to subscribe here as Details will already have done it
    // TODO: can there please be a simpler way to do this???
    return from((await competition.suggestions({ where: { proposal: props.proposalState.id }})
      .pipe(first()).toPromise()))
      .pipe(
        filter((suggestion: CompetitionSuggestion) => suggestion.id === props.suggestionId),
        map((suggestion: CompetitionSuggestion) => suggestion.staticState)
      );
  },
});

export default connect(mapStateToProps)(SolutionDetailsSubscription);
