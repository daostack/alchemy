import { Address, IDAOState, IProposalStage, Proposal, Scheme } from "@daostack/client";
import { getArc } from "arc";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { schemeName} from "lib/util";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Link, RouteComponentProps } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { combineLatest, from } from "rxjs";
import ProposalCardContainer from "../Proposal/ProposalCardContainer";
import * as css from "./ViewDao.scss";

const Fade = ({ children, ...props }: any) => (
  <CSSTransition
    {...props}
    timeout={1000}
    classNames={{
     enter: css.fadeEnter,
     enterActive: css.fadeEnterActive,
     exit: css.fadeExit,
     exitActive: css.fadeExitActive,
    }}
  >
    {children}
  </CSSTransition>
);

interface IProps {
  currentAccountAddress: Address;
  dao: IDAOState;
  proposalsBoosted: Proposal[];
  proposalsPreBoosted: Proposal[];
  proposalsQueued: Proposal[];
  scheme: Scheme;
}

const SchemeProposalsContainer = (props: IProps) => {

  const { currentAccountAddress, dao, proposalsQueued, proposalsBoosted, proposalsPreBoosted, scheme } = props;

  const queuedProposalsHTML = (
    <TransitionGroup className="queued-proposals-list">
      { proposalsQueued.map((proposal: Proposal) => (
        <Fade key={"proposal_" + proposal.id}>
          <ProposalCardContainer proposal={proposal} dao={dao} currentAccountAddress={currentAccountAddress} />
        </Fade>
      ))}
    </TransitionGroup>
  );

  const preBoostedProposalsHTML = (
    <TransitionGroup className="boosted-proposals-list">
      { proposalsPreBoosted.map((proposal: Proposal) => (
        <Fade key={"proposal_" + proposal.id}>
          <ProposalCardContainer proposal={proposal} dao={dao} currentAccountAddress={currentAccountAddress} />
        </Fade>
      ))}
    </TransitionGroup>
  );

  const boostedProposalsHTML = (
    <TransitionGroup className="boosted-proposals-list">
      { proposalsBoosted.map((proposal: Proposal) => (
        <Fade key={"proposal_" + proposal.id}>
          <ProposalCardContainer proposal={proposal} dao={dao} currentAccountAddress={currentAccountAddress} />
        </Fade>
      ))}
    </TransitionGroup>
  );

  return (
    <div className={css.daoProposalsContainer}>
      <BreadcrumbsItem to={`/dao/${dao.address}/proposals/${scheme.id}`}>{schemeName(scheme, scheme.address)}</BreadcrumbsItem>

      <Link className={css.createProposal} to={`/dao/${dao.address}/proposals/${scheme.id}/create/`} data-test-id="createProposal">
        + New proposal
      </Link>

      <h2 className={css.queueType}>{schemeName(scheme, scheme.address)}</h2>

      { proposalsQueued.length === 0 && proposalsPreBoosted.length === 0 && proposalsBoosted.length === 0
        ? <div className={css.noDecisions}>
            <img className={css.relax} src="/assets/images/yogaman.svg"/>
            <div className={css.proposalsHeader}>
              No upcoming proposals
            </div>
            <p>You can be the first one to create a {scheme.name && scheme.name.replace(/([A-Z])/g, " $1") || scheme.address} proposal today! (:</p>
            <div className={css.cta}>
              <Link to={"/dao/" + dao.address}>
                <img className={css.relax} src="/assets/images/lt.svg"/> Back to schemes
              </Link>
              <Link to={`/dao/${dao.address}/proposals/${scheme.id}/create/`} data-test-id="createProposal" className={css.blueButton}>+ New Proposal</Link>
            </div>
          </div>
        :
        <div>
          <div className={css.boostedContainer}>
            <div className={css.proposalsHeader}>
              Boosted Proposals ({proposalsBoosted.length})
              {proposalsBoosted.length === 0
                ?
                  <div>
                    <img src="/assets/images/yoga.svg"/>
                  </div>
                : " "
              }
            </div>
            <div className={css.proposalsContainer + " " + css.boostedProposalsContainer}>
              {boostedProposalsHTML}
            </div>
          </div>

          <div className={css.regularContainer}>
            <div className={css.proposalsHeader}>
              Pending Proposals ({proposalsPreBoosted.length})
              {proposalsPreBoosted.length === 0
                ?
                  <div>
                    <img src="/assets/images/yoga.svg"/>
                  </div>
                : " "
              }
            </div>
            <div className={css.proposalsContainer}>
              {preBoostedProposalsHTML}
            </div>
          </div>
          <div className={css.regularContainer}>
            <div className={css.proposalsHeader}>
              Regular Proposals ({proposalsQueued.length})
              {proposalsQueued.length === 0
                ?
                  <div>
                    <img src="/assets/images/yoga.svg"/>
                  </div>
                : " "
              }
            </div>
            <div className={css.proposalsContainer}>
              {queuedProposalsHTML}
            </div>
          </div>
        </div>
      }
    </div>
  );
};

interface IExternalProps {
  currentAccountAddress: Address;
}

export default(props: IExternalProps & RouteComponentProps<any>) => {
  const daoAvatarAddress = props.match.params.daoAvatarAddress;
  const schemeId = props.match.params.scheme;

  const arc = getArc();
  const observable = combineLatest(
    from(arc.scheme(schemeId)),
    arc.dao(daoAvatarAddress).proposals({ scheme:     schemeId, stage: IProposalStage.Queued, expiresInQueueAt_gt: Math.floor(new Date().getTime() / 1000) }), // the list of queued proposals
    arc.dao(daoAvatarAddress).proposals({ scheme:     schemeId, stage: IProposalStage.PreBoosted }), // the list of preboosted proposals
    arc.dao(daoAvatarAddress).proposals({ scheme:     schemeId, stage_in: [IProposalStage.Boosted, IProposalStage.QuietEndingPeriod] }), // the list of boosted proposals
    arc.dao(daoAvatarAddress).state() // DAO state
  );

  return <Subscribe observable={observable}>{
    (state: IObservableState<[Scheme, Proposal[], Proposal[], Proposal[], IDAOState]>): any => {
      if (state.isLoading) {
        return  <div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>;
      } else if (state.error) {
        throw state.error;
      } else {
        const data = state.data;
        return <SchemeProposalsContainer {...props}  scheme={data[0]} proposalsQueued={data[1]} proposalsPreBoosted={data[2]} proposalsBoosted={data[3]} dao={data[4]} />;
      }
    }
  }</Subscribe>;
};
