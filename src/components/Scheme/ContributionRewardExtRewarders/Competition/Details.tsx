// import * as H from "history";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { IRootState } from "reducers";
import { IProfileState } from "reducers/profilesReducer";
import { IDAOState, IProposalState } from "@daostack/client";
import { schemeName, humanProposalTitle } from "lib/util";
import { connect } from "react-redux";

import moment = require("moment");
import Countdown from "components/Shared/Countdown";
import TagsSelector from "components/Proposal/Create/SchemeForms/TagsSelector";
import RewardsString from "components/Proposal/RewardsString";
import { Link } from "react-router-dom";
import classNames from "classnames";
import { showNotification } from "reducers/notifications";
import { enableWalletProvider } from "arc";
import CreateSuggestion, { ISubmitValues } from "components/Scheme/ContributionRewardExtRewarders/Competition/CreateSuggestion";
import { Modal } from "react-router-modal";
import SuggestionDetails from "components/Scheme/ContributionRewardExtRewarders/Competition/SuggestionDetails";
import * as css from "./Competitions.scss";

const ReactMarkdown = require("react-markdown");

interface IDispatchProps {
  showNotification: typeof showNotification;
}

interface IStateProps {
  creatorProfile: IProfileState;
  beneficiaryProfile: IProfileState;
  showingCreateSuggestion: boolean;
  showingSuggestionDetails: string;
}

interface IExternalProps /* extends RouteComponentProps<any> */ {
  daoState: IDAOState;
  proposalState: IProposalState;
  // history: H.History;
}

type IProps = IExternalProps & IDispatchProps & IStateProps;

const mapStateToProps = (state: IRootState & IStateProps, ownProps: IExternalProps): IExternalProps & IStateProps => {

  return {
    ...ownProps,
    creatorProfile: state.profiles[ownProps.proposalState.proposer],
    // FAKE:  should be proposalState.contributionRewardExt
    beneficiaryProfile: state.profiles[ownProps.proposalState.contributionReward.beneficiary],
    // currentAccountAddress: state.web3.currentAccountAddress,
    showingCreateSuggestion: state.showingCreateSuggestion,
    showingSuggestionDetails: state.showingSuggestionDetails,
  };
};

const mapDispatchToProps = {
  showNotification,
};

class CompetitionDetails extends React.Component<IProps, IStateProps> {

  constructor(props: IProps) {
    super(props);
    this.state = { 
      beneficiaryProfile: null,
      creatorProfile: null,
      showingCreateSuggestion: false,
      showingSuggestionDetails: null,
    };
  }

  private closingTime = (_proposal: IProposalState) => {
    return moment(new Date("2020-01-01").getTime());
  };

  private openNewSolutionModal = async (): Promise<void> => {
    
    const { showNotification } = this.props;

    if (!await enableWalletProvider({ showNotification })) { return; }

    this.setState({ showingCreateSuggestion: true });
  }

  private submitNewSolutionModal = async (_values: ISubmitValues): Promise<void> => {
    this.setState({ showingCreateSuggestion: true });
  }

  private cancelNewSolutionModal = async (): Promise<void> => {
    this.setState({ showingCreateSuggestion: false });
  }

  private openSuggestionDetailsModal = (suggestionId: string) => async (): Promise<void> => {

    this.setState({ showingSuggestionDetails: suggestionId });
  }

  private voteOnSuggestion = async (): Promise<void> => {
    const { showNotification } = this.props;

    if (!await enableWalletProvider({ showNotification })) { return; }
  }

  private closeSuggestionDetailsModal = async (): Promise<void> => {
    this.setState({ showingSuggestionDetails: null });
    return Promise.resolve(); // delete this when the actual vote is coded
  }

  public render(): RenderOutput {
    const { daoState, proposalState } = this.props;
    const tags = proposalState.tags;

    return <React.Fragment>
      <BreadcrumbsItem weight={1} to={`/dao/${daoState.address}/scheme/${proposalState.scheme.id}/crx`}>{schemeName(proposalState.scheme, proposalState.scheme.address)}</BreadcrumbsItem>
      <BreadcrumbsItem weight={2} to={`/dao/${daoState.address}/crx/proposal/${proposalState.id}`}>{humanProposalTitle(proposalState)}</BreadcrumbsItem>

      <div className={css.competitionDetailsContainer}>
      
        <div className={css.status}>Open for Suggestions</div>
        <div className={css.gotoProposal}><Link to={`/dao/${daoState.address}/proposal/${proposalState.id}`}>Go to Proposal&nbsp;&gt;</Link></div>
        <div className={css.newSolution}>
          <a className={css.blueButton}
            href="javascript:void(0)"
            onClick={this.openNewSolutionModal}
            data-test-id="createSuggestion"
          >+ New Solution</a>
        </div>
        <div className={css.name}>{humanProposalTitle(proposalState)}</div>
        <div className={css.countdown}>
          <div>Voting starts in:</div>
          <Countdown toDate={this.closingTime(proposalState)} />
        </div>

        <div className={css.middleSection}>
          <div className={css.leftSection}>
            { tags && tags.length ? <div className={css.tagsContainer}>
              <TagsSelector readOnly darkTheme tags={tags}></TagsSelector>
            </div> : "" }

            <div className={css.description}>
              <ReactMarkdown source={proposalState.description}
                renderers={{link: (props: { href: string; children: React.ReactNode }) => {
                  return <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a>;
                }}}
              />
            </div>
          </div>
          <div className={css.rightSection}>
            <div className={css.header}>
              <div className={css.isWinner}><img src="/assets/images/Icon/winner.svg"></img></div>
              <div className={css.results}>
                <RewardsString proposal={proposalState} dao={daoState} />
                <img className={css.transferIcon} src="/assets/images/Icon/Transfer.svg" />
                <div className={css.winners}>{1} Winner(s)</div>
              </div>
            </div>
            <div className={css.distribution}>
              <div className={css.winner}>
                <div className={css.position}>1st</div>
                <div className={css.proportion}>40%</div>
              </div>
              <div className={css.winner}>
                <div className={css.position}>2nd</div>
                <div className={css.proportion}>20%</div>
              </div>
              <div className={css.winner}>
                <div className={css.position}>3rd</div>
                <div className={css.proportion}>10%</div>
              </div>
              <div className={css.winner}>
                <div className={css.position}>4th</div>
                <div className={css.proportion}>10%</div>
              </div>
              <div className={css.winner}>
                <div className={css.position}>5th</div>
                <div className={css.proportion}>5%</div>
              </div>
              <div className={css.winner}>
                <div className={css.position}>6th</div>
                <div className={css.proportion}>5%</div>
              </div>
              <div className={css.winner}>
                <div className={css.position}>7th</div>
                <div className={css.proportion}>5%</div>
              </div>
              <div className={css.winner}>
                <div className={css.position}>8th</div>
                <div className={css.proportion}>5%</div>
              </div>
            </div>
            <div className={css.allowedVote}>Up to 3 votes allowed</div>
            <div className={css.periods}>
              <div className={css.period}>
                <div className={css.bullet}></div>
                <div className={css.label}>Competition start time:</div>
                <div className={css.datetime}>21 Dec 2019</div>
              </div>
              <div className={css.period}>
                <div className={css.bullet}></div>
                <div className={css.label}>Submission end time:</div>
                <div className={css.datetime}>30 Dec 2019</div>
              </div>
              <div className={css.period}>
                <div className={css.bullet}></div>
                <div className={css.label}>Voting start time:</div>
                <div className={css.datetime}>1 Jan 2020</div>
              </div>
              <div className={css.period}>
                <div className={css.bullet}></div>
                <div className={css.label}>Competition end time:</div>
                <div className={css.datetime}>20 Jan 2020</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={css.solutions}>
          <div className={css.heading}>2 Solutions</div>
          <div className={css.list}>
            { /* TODO:  gotta have a list of suggestionIds, and know whether the current account has voted for it */ } 
            <div className={css.row} onClick={this.openSuggestionDetailsModal("5678")}>
              <div className={css.innerContainer}>
                <div className={classNames({[css.winnerIcon]: true, [css.isWinner]: true })}>
                  <img src="/assets/images/Icon/winner.svg"></img>
                </div>
                <div className={css.description}>
                Genesis logo inspired by the sun - you have to take a look to understand (:
                </div>
                <div className={css.creator}>
                [Account Info]
                </div>
                <div className={css.votes}>
                16.5
                </div>
              </div>
            </div>
            <div className={css.row} onClick={this.openSuggestionDetailsModal("1234")}>
              <div className={css.innerContainer}>
                <div className={classNames({[css.winnerIcon]: true, [css.isWinner]: false })}>
                  <img src="/assets/images/Icon/winner.svg"></img>
                </div>
                <div className={css.description}>
                  DAOstack logo with a mechanical twist
                </div>
                <div className={css.creator}>
                  [Account Info]
                </div>
                <div className={css.votes}>
                  12.5<img src="/assets/images/Icon/vote/for-fill-green.svg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    
      {this.state.showingCreateSuggestion ?
        <Modal onBackdropClick={this.cancelNewSolutionModal}>
          <CreateSuggestion proposalState={proposalState} daoState={daoState} handleCancel={this.cancelNewSolutionModal} handleSubmit={this.submitNewSolutionModal}></CreateSuggestion>
        </Modal> : ""
      }

      {this.state.showingSuggestionDetails ?
        <Modal onBackdropClick={this.closeSuggestionDetailsModal}>
          <SuggestionDetails suggestionId={this.state.showingSuggestionDetails} proposalState={proposalState} daoState={daoState} handleClose={this.closeSuggestionDetailsModal} handleVote={this.voteOnSuggestion}></SuggestionDetails>
        </Modal> : ""
      }

    </React.Fragment>;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CompetitionDetails);
