/* tslint:disable:max-classes-per-file */

import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { ISchemeState, IDAOState, IProposalState, ICompetitionProposalState, ICompetitionSuggestionState } from "@daostack/client";
import { toArray, concatMap, first } from "rxjs/operators";
import { of } from "rxjs";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { CompetitionStatusEnum, CompetitionStatus, getProposalSubmissions, competitionStatus } from "./utils";
import Card from "./Card";
import * as css from "./Competitions.scss";

interface ICompetitionProposalStateEx extends ICompetitionProposalState {
  __status: CompetitionStatus;
}

interface IProposalStateEx extends IProposalState {
  competition: ICompetitionProposalStateEx;
}

type ISubscriptionState = Array<Array<ICompetitionSuggestionState>>;

interface IExternalProps {
  daoState: IDAOState;
  scheme: ISchemeState;
  proposals: Array<IProposalStateEx>;
}

type IProps = IExternalProps & ISubscriptionProps<ISubscriptionState>;

class CompetitionsList extends React.Component<IProps, null> {

  private handleStatusChange = (alteredProposal: IProposalStateEx, newStatus: CompetitionStatus) => {
    /**
     * poke the new status into the competition, then force a rerender
     */
    const foundProposals = this.props.proposals.filter((proposal) => proposal.id === alteredProposal.id);
    if (foundProposals[0]) {
      foundProposals[0].competition.__status = newStatus;
      // force render
      this.setState({ state: this.state });
    }
  }

  public componentDidMount() {
    const proposalSubmissions = this.props.data;
    this.props.proposals.forEach((proposalState: IProposalStateEx, index: number) => {
      proposalState.competition.__status = competitionStatus(proposalState.competition, proposalSubmissions[index]);
    });
  }

  public render(): RenderOutput {

    const { daoState, scheme, proposals} = this.props;
    const daoAvatarAddress = daoState.address;

    const compareCompetitions = (a: IProposalStateEx, b: IProposalStateEx): number => {

      if (!(a.competition.__status && a.competition.__status)) {
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

export default withSubscription({
  wrappedComponent: CompetitionsList,
  loadingComponent: null,
  errorComponent: (props) => <div>{ props.error.message }</div>,
  checkForUpdate: [],
  createObservable: (props: IExternalProps) => {

    return of(props.proposals).pipe(
      concatMap((proposals) => of(proposals).pipe(
        // spreads the array
        concatMap(proposals => proposals),
        // gets the submissions for the proposal
        concatMap(proposalState => getProposalSubmissions(proposalState.id, true).pipe(first())),
        toArray())
      )
    );
  },
});
