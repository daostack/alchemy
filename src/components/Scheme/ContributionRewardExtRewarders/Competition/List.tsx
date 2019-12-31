/* tslint:disable:max-classes-per-file */

import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { ISchemeState, IDAOState, IProposalState } from "@daostack/client";
import Card from "components/Scheme/ContributionRewardExtRewarders/Competition/Card";
import * as css from "./Competitions.scss";

interface IExternalProps {
  daoState: IDAOState;
  scheme: ISchemeState;
  proposals: Array<IProposalState>;
}

export default class CompetitionsList extends React.Component<IExternalProps, null> {

  public render(): RenderOutput {
    const { daoState, scheme, proposals} = this.props;
    const daoAvatarAddress = daoState.address;

    return <React.Fragment>
      <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/scheme/${scheme.id}/crx`}>Competitions</BreadcrumbsItem>
      <div className={css.competitionCards}>
        {
          proposals.map((proposal: IProposalState) => {
            return <Card key={proposal.id} proposalState={proposal} daoState={daoState}></Card>;
          })
        }
      </div>

    </React.Fragment>;
  }
}

// export default withSubscription({
//   wrappedComponent: CompetitionsList,
//   loadingComponent: null,
//   errorComponent: (props) => <div>{ props.error.message }</div>,
//   checkForUpdate: [],
//   createObservable: async (props: IExternalProps) => {
//     // per dao, subscribe and prime the cache for Competitions, Subscriptions and Votes
//     const competitions = Competition.search(getArc(),{ where: { dao: props.daoState.address } }, { subscribe: true, fetchAllData: true } );

//     competitions.pipe(
//       mergeMap(async (competitions: Array<Competition>) => {
//         competitions.map((competition: Competition) => getProposalSubmissions(competition.id, true )
//           .pipe(
//             mergeMap(async (submissions: Array<ICompetitionSuggestion>) => {
//               submissions.map((submission: ICompetitionSuggestion) => getSubmissionVotes(submission.id, undefined, true));
//             })
//           )
//         );
//       })
//     );
//   },
// });
