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
import * as css from "./Competitions.scss";

const ReactMarkdown = require("react-markdown");

interface IStateProps {
  creatorProfile: IProfileState;
  beneficiaryProfile: IProfileState;
}

interface IExternalProps {
  daoState: IDAOState;
  proposalState: IProposalState;
}

type IProps = IExternalProps & IStateProps;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {

  return {
    ...ownProps,
    creatorProfile: state.profiles[ownProps.proposalState.proposer],
    // FAKE:  should be proposalState.contributionRewardExt
    beneficiaryProfile: state.profiles[ownProps.proposalState.contributionReward.beneficiary],
    // currentAccountAddress: state.web3.currentAccountAddress,
  };
};

class CompetitionDetails extends React.Component<IProps, null> {

  private closingTime = (_proposal: IProposalState) => {
    return moment(new Date("2020-01-01").getTime());
  };

  private handleNewSolution = () => {

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
            onClick={this.handleNewSolution}
            data-test-id="createSOlution"
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
            <img src="/assets/images/Icon/winner.svg"></img>
            <RewardsString proposal={proposalState} dao={daoState} />
            <img className={css.transferIcon} src="/assets/images/Icon/Transfer.svg" />
            <div className={css.winners}>{5} Winners</div>
          </div>
        </div>

        <div className={css.solutions}>
          <div className={css.heading}>7 Solutions</div>
          <div className={css.list}>
            <div className={css.row}>
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
                16.5<img src="/assets/images/Icon/vote/for-gray.svg" />
              </div>
            </div>
            <div className={css.row}>
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
                12.5<img src="/assets/images/Icon/vote/for-gray.svg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>;
  }
}

export default connect(mapStateToProps)(CompetitionDetails);
