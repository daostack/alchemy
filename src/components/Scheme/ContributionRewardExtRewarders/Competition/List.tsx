/* tslint:disable:max-classes-per-file */

import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { ISchemeState, IDAOState, IProposalState, ICompetitionProposalState } from "@daostack/client";
import { CompetitionStatusEnum, CompetitionStatus } from "./utils";
import Card from "./Card";
import * as css from "./Competitions.scss";

interface ICompetitionProposalStateEx extends ICompetitionProposalState {
  __status: CompetitionStatus;
}

interface IProposalStateEx extends IProposalState {
  competition: ICompetitionProposalStateEx;
}

interface IExternalProps {
  daoState: IDAOState;
  scheme: ISchemeState;
  proposals: Array<IProposalStateEx>;
}

type IProps = IExternalProps;

export default class CompetitionsList extends React.Component<IProps, null> {

  private handleStatusChange = (alteredProposal: IProposalStateEx, status: CompetitionStatus) => {
    /**
     * the Cards compute the status for us and give it here.  Poke that status into the competition, then force a rerender
     */
    const foundProposals = this.props.proposals.filter((proposal) => proposal.id === alteredProposal.id);
    if (foundProposals[0]) {
      foundProposals[0].competition.__status = status;
      // force render
      this.setState({ state: this.state });
    }
  }

  public render(): RenderOutput {

    const { daoState, scheme, proposals} = this.props;
    const daoAvatarAddress = daoState.address;

    const compareCompetitions = (a: IProposalStateEx, b: IProposalStateEx): number => {

      if (!(a.competition.__status && b.competition.__status)) {
        return 0; // the data isn't ready, see componentDidMount
      }

      // sorts by the ordinal position of the CompetitionStatusEnum values
      const positionA = Object.values(CompetitionStatusEnum).indexOf(a.competition.__status.status);
      const positionB = Object.values(CompetitionStatusEnum).indexOf(b.competition.__status.status);

      if (positionA < positionB)
        return -1;
      else if (positionA > positionB)
        return 1;
      else return 0;
    };

    return <React.Fragment>
      <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/scheme/${scheme.id}/crx`}>Competitions</BreadcrumbsItem>
      <div className={css.competitionCards}>
        {
          proposals
            .sort(compareCompetitions)
            .map((proposal: IProposalState) => {
              return <Card key={proposal.id} proposalState={proposal} daoState={daoState} handleStatusChange={this.handleStatusChange}></Card>;
            })
        }
      </div>

    </React.Fragment>;
  }
}
