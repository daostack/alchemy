/* tslint:disable:max-classes-per-file */

import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Address, ISchemeState, IDAOState, IProposalState } from "@daostack/client";
import { Link } from "react-router-dom";
import { humanProposalTitle } from "lib/util";

interface IProps {
  daoState: IDAOState;
  scheme: ISchemeState;
  proposals: Array<IProposalState>;
  currentAccountAddress: Address;
}

export default class SchemeCompetitions extends React.Component<IProps, null> {


  public render(): RenderOutput {
    const { daoState, scheme, proposals } = this.props;
    const daoAvatarAddress = daoState.address;

    return <div>
      { 
      // FAKE -- "Competitions" should come from the crx json file 
      }
      <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/scheme/${scheme.id}/crx`}>Competitions</BreadcrumbsItem>
      <h3 style={{marginTop:60}}>grid of cards, one per approved competition, plus a &quot;New Competition Proposal&quot; card</h3>
      {
        proposals.map((proposal: IProposalState) => {
          return (<Link key={proposal.id} to={`/dao/${daoState.address}/proposal/${proposal.id}`}>{humanProposalTitle(proposal)}</Link>);
        })
      }
    </div>;
  }
}
