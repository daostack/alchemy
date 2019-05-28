import { IDAOState, IProposalStage, IProposalState,  Proposal, Scheme } from "@daostack/client";
import { getArc } from "arc";
import VoteGraph from "components/Proposal/Voting/VoteGraph";
import Countdown from "components/Shared/Countdown";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { humanProposalTitle, isKnownScheme, linkToEtherScan } from "lib/util";
import * as React from "react";
import { Link } from "react-router-dom";
import { closingTime } from "reducers/arcReducer";
import { combineLatest, of } from "rxjs";
import * as css from "./SchemeCard.scss";

interface IExternalProps {
  dao: IDAOState;
  scheme: Scheme;
}

interface IInternalProps {
  dao: IDAOState;
  boostedProposals: Proposal[];
  preBoostedProposals: Proposal[];
  queuedProposals: Proposal[];
  scheme: Scheme;
}

const SchemeCardContainer = (props: IInternalProps) => {

  const { dao, scheme, boostedProposals, preBoostedProposals, queuedProposals } = props;

  const numProposals = boostedProposals.length + preBoostedProposals.length + queuedProposals.length;
  const proposals = boostedProposals.slice(0, 3);
  // const knownScheme = Object.keys(knownSchemes()).includes(scheme.address.toLowerCase());

  const proposalsHTML = proposals.map((proposal: Proposal) => (
    <Subscribe key={proposal.id} observable={proposal.state()}>{
      (state: IObservableState<IProposalState>): any => {
        if (state.isLoading) {
          return <div>Loading...</div>;
        } else if (state.error) {
          throw state.error;
        } else {
          const proposalState = state.data;
          return (
            <Link className={css.proposalTitle} to={"/dao/" + dao.address + "/proposal/" + proposal.id} data-test-id="proposal-title">
              <span>
                <em className={css.miniGraph}>
                  <VoteGraph size={20} dao={dao} proposal={proposalState} />
                </em>
                {humanProposalTitle(proposalState)}
              </span>
              <b>
                {/* TODO: Show if proposal is in overtime? Track when it expires and then hide it? */}
                <Countdown toDate={closingTime(proposalState)} detailView={false} schemeView={true}/>
              </b>
            </Link>
          );
        }
      }
    }</Subscribe>
  ));

  if (isKnownScheme(scheme.address)) {
    return (
      <div className={css.wrapper} data-test-id={`schemeCard-${scheme.name}`}>
        <Link className={css.headerLink} to={`/dao/${dao.address}/proposals/${scheme.name}`}>
          <h2>{scheme.name && scheme.name.replace(/([A-Z])/g, " $1") || "[unknown]"}</h2>
          <div>
            <b>{boostedProposals.length}</b> <span>Boosted</span> <b>{preBoostedProposals.length}</b> <span>Pending</span> <b>{queuedProposals.length}</b> <span>Regular</span>
          </div>
          {proposals.length === 0 ?
            <div className={css.loading}>
                <img src="/assets/images/meditate.svg"/>
                <div>
                  No upcoming proposals
                </div>
            </div>
            : " "
          }
        </Link>
        {proposals.length > 0 ?
          <div>
            {proposalsHTML}
            <div className={css.numProposals}>
              <Link to={`/dao/${dao.address}/proposals/${scheme.name}`}>View all {numProposals} &gt;</Link>
            </div>
          </div>
          : " "
        }
      </div>
    );
  } else {
    return (
      <div className={css.wrapper + " " + css.unsupportedScheme}>
        <h2>{scheme.name && scheme.name.replace(/([A-Z])/g, " $1") || ""}</h2>
      <div>Unsupported Scheme  at
      <a href={linkToEtherScan(scheme.address)}>{scheme.address}</a></div>
      </div>
    );
  }
};

export default(props: IExternalProps) => {
  const arc = getArc();

  const knownScheme = isKnownScheme(props.scheme.address);

  const dao = arc.dao(props.dao.address);
  const observable = combineLatest(
    knownScheme ? dao.proposals({
      scheme: props.scheme.address,
      stage: IProposalStage.Queued,
      expiresInQueueAt_gt: Math.floor(new Date().getTime() / 1000)
    }) : of([]), // the list of queued proposals
    knownScheme ? dao.proposals({
      scheme: props.scheme.address,
      stage: IProposalStage.PreBoosted
    }) : of([]), // the list of preboosted proposals
    knownScheme ? dao.proposals({
      scheme: props.scheme.address,
      stage_in: [IProposalStage.Boosted, IProposalStage.QuietEndingPeriod]
    }) : of([]) // the list of boosted proposals
  );

  return <Subscribe observable={observable}>{
    (state: IObservableState<[Proposal[], Proposal[], Proposal[]]>): any => {
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
