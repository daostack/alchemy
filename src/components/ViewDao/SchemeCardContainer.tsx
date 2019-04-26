import { IDAOState, IProposalStage, IProposalState } from "@daostack/client";
import { getArc } from "arc";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as React from "react";
import { Link } from "react-router-dom";
import { humanProposalTitle } from "lib/util";
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

  const numProposals = proposals.length;

  const proposalsHTML = proposals.map((proposal: IProposalState) => (
    <a key={proposal.id} className={css.proposalTitle} href="#">
      <span>
        <em className={css.miniGraph}></em>
        {humanProposalTitle(proposal)}
      </span>
      <b>
        4h : 34m
      </b>
    </a>
  ));

  return (
    <div className={css.wrapper}>
      <Link className={css.headerLink} to={`/dao/${dao.address}/proposals/${schemeName}`}>
        <h2>{schemeName}</h2>
        <div>
          <b>21</b> <span>Boosted</span> <b>21</b> <span>Pending</span> <b>21</b> <span>Regular</span> 
        </div>
      </Link>
      <Link className={css.createProposalLink} to={`/dao/${dao.address}/proposals/create`}>
        <div>
          <span>&#43;</span>
          <strong>Create a proposal</strong>
        </div>
      </Link>
      { proposals.length === 0
        ? <div >
            <img src="/assets/images/meditate.svg"/>
            <div>
              No upcoming proposals
            </div>
          </div>
        :
        <div>
          {proposalsHTML}
          <div className={css.numProposals}>
            <Link to={`/dao/${dao.address}/proposals/${schemeName}`}>View all {numProposals} &gt;</Link>
          </div>
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
        return <SchemeCardContainer {...props} proposals={state.data} />;
      }
    }
  }</Subscribe>;
};
