import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { ISchemeState, IDAOState, IProposalState } from "@daostack/client";
import { SortService } from "lib/sortService";
import { CompetitionStatusEnum, CompetitionStatus } from "./utils";
import Card from "./Card";
import * as css from "./Competitions.scss";

interface IExternalProps {
  daoState: IDAOState;
  scheme: ISchemeState;
  proposals: Array<IProposalState>;
}

interface IStateProps {
  statusMap: Map<string, CompetitionStatus>;
}

type IProps = IExternalProps;

export default class CompetitionsList extends React.Component<IProps, IStateProps> {

  constructor(props: IProps) {
    super(props);
    this.state = { statusMap: new Map() };
  }

  private handleStatusChange = (proposalState: IProposalState, status: CompetitionStatus) => {
    /**
     * the Cards maintain, through countdowns, the Copetition status, and provide it here
     * where we save the status and force a rerender
     */
    this.state.statusMap.set(proposalState.id, status);
    // force render
    this.setState({ statusMap: this.state.statusMap });
  }

  private compareCompetitions = (a: IProposalState, b: IProposalState): number => {

    const statusA = this.state.statusMap.get(a.id);
    const statusB = this.state.statusMap.get(b.id);

    if (!(statusA && statusB)) {
      return 0;
    }

    const statusIndexA = Object.values(CompetitionStatusEnum).indexOf(statusA.status);
    const statusIndexB = Object.values(CompetitionStatusEnum).indexOf(statusB.status);
    /**
     * sort by the ordinal position of the CompetitionStatusEnum values
     */
    const retval = SortService.evaluateNumber(statusIndexA, statusIndexB);
    if (retval) {
      return retval;
    }
    else {
      const competitionA = a.competition;
      const competitionB = b.competition;
      /**
       * There is a tie in status.  Compare the dates of the next stage
       */
      switch(statusA.status) {
        case CompetitionStatusEnum.Voting:
        case CompetitionStatusEnum.EndingNoSubmissions:
        case CompetitionStatusEnum.Ended:
        case CompetitionStatusEnum.EndedNoWinners:
        case CompetitionStatusEnum.EndedNoSubmissions:
          return SortService.evaluateDateTime(competitionA.endTime, competitionB.endTime);
        case CompetitionStatusEnum.Paused:
          return SortService.evaluateDateTime(competitionA.votingStartTime, competitionB.votingStartTime);
        case CompetitionStatusEnum.OpenForSubmissions:
          return SortService.evaluateDateTime(competitionA.suggestionsEndTime, competitionB.suggestionsEndTime);
        case CompetitionStatusEnum.NotOpenYet:
          return SortService.evaluateDateTime(competitionA.startTime, competitionB.startTime);
      }
    }
  }


  public render(): RenderOutput {

    const { daoState, scheme, proposals} = this.props;
    const daoAvatarAddress = daoState.address;

    return <React.Fragment>
      <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/scheme/${scheme.id}/crx`}>Competitions</BreadcrumbsItem>
      <div className={css.competitionCards}>
        {
          proposals
            .sort(this.compareCompetitions)
            .map((proposal: IProposalState) => {
              return <Card key={proposal.id} proposalState={proposal} daoState={daoState} handleStatusChange={this.handleStatusChange}></Card>;
            })
        }
      </div>

    </React.Fragment>;
  }
}
