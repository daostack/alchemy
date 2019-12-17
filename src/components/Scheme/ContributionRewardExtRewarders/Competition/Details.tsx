import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { IRootState } from "reducers";
import { IProfileState } from "reducers/profilesReducer";
import { IDAOState, IProposalState } from "@daostack/client";
import { schemeName, humanProposalTitle } from "lib/util";
import { connect } from "react-redux";

import moment = require("moment");
import Countdown from "components/Shared/Countdown";
import TagsSelector from 'components/Proposal/Create/SchemeForms/TagsSelector';
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

  private closingTime = (proposal: IProposalState) => {
    return moment(new Date("2020-01-01").getTime());
  };

  public render(): RenderOutput {
    const { daoState, proposalState } = this.props;
    const tags = proposalState.tags;

    return <React.Fragment>
      <BreadcrumbsItem weight={1} to={`/dao/${daoState.address}/scheme/${proposalState.scheme.id}/crx`}>{schemeName(proposalState.scheme, proposalState.scheme.address)}</BreadcrumbsItem>
      <BreadcrumbsItem weight={2} to={`/dao/${daoState.address}/crx/proposal/${proposalState.id}`}>{humanProposalTitle(proposalState)}</BreadcrumbsItem>

      <div className={css.competitionDetailsContainer}>
        <div className={css.status}>Open for Suggestions</div>
        <div className={css.gotoProposal}>Go to Proposal</div>
        <div className={css.newSolution}>+ New Solution</div>
        <div className={css.name}>{humanProposalTitle(proposalState)}</div>
        <div className={css.countdown}>
          <div>Voting starts in:</div>
          <Countdown toDate={this.closingTime(proposalState)} />
        </div>

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
    </React.Fragment>;
  }
}

export default connect(mapStateToProps)(CompetitionDetails);
