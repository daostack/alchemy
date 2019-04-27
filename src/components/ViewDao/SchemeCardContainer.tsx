import { IDAOState, IProposalStage, IProposalState } from "@daostack/client";
import { getArc } from "arc";
import Countdown from "components/Shared/Countdown";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as React from "react";
import { Link } from "react-router-dom";
import { closingTime } from "reducers/arcReducer";
import { combineLatest } from "rxjs";
import { humanProposalTitle } from "lib/util";
import * as css from "./SchemeCard.scss";

interface IExternalProps {
  dao: IDAOState;
  schemeName: string;
}

interface IInternalProps {
  dao: IDAOState;
  boostedProposals: IProposalState[];
  preBoostedProposals: IProposalState[];
  queuedProposals: IProposalState[];
  schemeName: string;
}

const SchemeCardContainer = (props: IInternalProps) => {

  const { dao, schemeName, boostedProposals, preBoostedProposals, queuedProposals } = props;

  const numProposals = boostedProposals.length + preBoostedProposals.length + queuedProposals.length;
  const proposals = boostedProposals.concat(preBoostedProposals).concat(queuedProposals).slice(0, 3);

  const proposalsHTML = proposals.map((proposal: IProposalState) => (
    <a key={proposal.id} className={css.proposalTitle} href="#">
      <span>
        <em className={css.miniGraph}></em>
        {humanProposalTitle(proposal)}
      </span>
      <b>
        {/* TODO: Show if proposal is in overtime? Track when it expires and then hide it? */}
        <Countdown toDate={closingTime(proposal)} detailView={false} /> :
      </b>
    </a>
  ));

  return (
    <div className={css.wrapper}>
      <Link className={css.headerLink} to={`/dao/${dao.address}/proposals/${schemeName}`}>
        <h2>{schemeName.replace(/([A-Z])/g, " $1")}</h2>
        <div>
          <b>{boostedProposals.length}</b> <span>Boosted</span> <b>{preBoostedProposals.length}</b> <span>Pending</span> <b>{queuedProposals.length}</b> <span>Regular</span>
        </div>
      </Link>
      <Link className={css.createProposalLink} to={`/dao/${dao.address}/proposals/${schemeName}/create`}>
        <div>
          <span>&#43;</span>
          <strong>Create a proposal</strong>
        </div>
      </Link>
      { proposals.length === 0
        ? <div className={css.loading}>
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

  // const observable = arc.dao(props.dao.address).proposals({ type: props.schemeName, stage: IProposalStage.Boosted })
  // , IProposalStage.QuietEndingPeriod, IProposalStage.PreBoosted, IProposalStage.Queued] });

  const dao = arc.dao(props.dao.address);
  const observable = combineLatest(
    dao.proposals({ type: props.schemeName, stage: IProposalStage.Queued, expiresInQueueAt_gt: Math.floor(new Date().getTime() / 1000) }), // the list of queued proposals
    dao.proposals({ type: props.schemeName, stage: IProposalStage.PreBoosted }), // the list of preboosted proposals
    dao.proposals({ type: props.schemeName, stage_in: [IProposalStage.Boosted, IProposalStage.QuietEndingPeriod] }) // the list of boosted proposals
  );
  return <Subscribe observable={observable}>{
    (state: IObservableState<[IProposalState[], IProposalState[], IProposalState[]]>): any => {
      if (state.isLoading) {
        return  <div><img src="/assets/images/Icon/Loading-black.svg"/></div>;
      } else if (state.error) {
        throw state.error;
      } else {
        return <SchemeCardContainer {...props} boostedProposals={state.data[2]} preBoostedProposals={state.data[1]} queuedProposals={state.data[0]} />;
      }
    }
  }</Subscribe>;
};
