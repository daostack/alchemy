import { Address, IDAOState, IProposalStage, IProposalState, Proposal } from "@daostack/client";
import { getArc } from "arc";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as React from "react";
import { Link, RouteComponentProps } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { combineLatest } from "rxjs";
import { humanProposalTitle } from "lib/util";
import ProposalContainer from "../Proposal/ProposalContainer";
import * as css from "./SchemeCard.scss";

interface IExternalProps {
  dao: IDAOState;
  schemeName: string;
}

interface IInternalProps {
  dao: IDAOState;
  proposals: IProposalState[];
  schemeName: string;
}

const SchemeCardContainer = (props: IInternalProps) => {

  const { dao, schemeName, proposals } = props;

  console.log("num proposals = ", proposals.length);

  const proposalsHTML = proposals.map((proposal: IProposalState) => (
    <div key={proposal.id}>
      {humanProposalTitle(proposal)}
    </div>
  ));

  return (
    <div className={css.wrapper}>
      <h2><Link to={`/dao/${dao.address}/proposals/${schemeName}`}>{schemeName}</Link></h2>
      <div>
        <Link to={`/dao/${dao.address}/proposals/create`}>Create a proposal</Link>
      </div>
      { proposals.length === 0
        ? <div>
            <img src="/assets/images/meditate.svg"/>
            <div>
              No upcoming proposals
            </div>
          </div>
        :
        <div>
          {proposalsHTML}
        </div>
      }
    </div>
  );
};

export default(props: IExternalProps) => {
  const arc = getArc();

  const observable = arc.dao(props.dao.address).proposals({ stage_in: [IProposalStage.Boosted, IProposalStage.QuietEndingPeriod, IProposalStage.PreBoosted, IProposalStage.Queued] });
  return <Subscribe observable={observable}>{
    (state: IObservableState<IProposalState[]>): any => {
      if (state.isLoading) {
        return  <div><img src="/assets/images/Icon/Loading-black.svg"/></div>;
      } else if (state.error) {
        throw state.error;
      } else {
        const data = state.data;
        return <SchemeCardContainer {...props} proposals={state.data} />;
      }
    }
  }</Subscribe>;
};
