/* tslint:disable:max-classes-per-file */

import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Address, ISchemeState, IDAOState } from "@daostack/client";

interface IProps {
  daoState: IDAOState;
  scheme: ISchemeState;
  currentAccountAddress: Address;
}

export default class SchemeCompetitions extends React.Component<IProps, null> {


  public render(): RenderOutput {
    const { daoState, scheme } = this.props;
    const daoAvatarAddress = daoState.address;

    return <div>
      { 
      // FAKE -- "Competitions" should come from the crx json file 
      }
      <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/scheme/${scheme.id}/crx`}>Competitions</BreadcrumbsItem>
      <h3 style={{marginTop:60}}>grid of cards, one per approved competition, plus a new competition proposal card</h3>
    </div>;
  }
}
