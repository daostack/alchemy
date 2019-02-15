import { Address, IDAOState, IProposalState, ProposalStage } from "@daostack/client"
import { getArc } from "arc";
import Subscribe, { IObservableState } from "components/Shared/Subscribe"
import * as React from "react";
import { Link, RouteComponentProps } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { combineLatest } from "rxjs"
import ProposalContainer from "../Proposal/ProposalContainer";
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

const DAOProposalsContainer = (props: {
  currentAccountAddress: Address,
  dao: IDAOState,
  proposalsQueued: IProposalState[],
  proposalsPreBoosted: IProposalState[],
  proposalsBoosted: IProposalState[]
}) => {
  const { currentAccountAddress, dao, proposalsQueued, proposalsBoosted, proposalsPreBoosted } = props

  const boostedProposalsHTML = (
    <TransitionGroup className="boosted-proposals-list">
      { proposalsBoosted.map((proposal: IProposalState) => (
        <Fade key={"proposal_" + proposal.id}>
          <ProposalContainer proposalId={proposal.id} dao={dao} currentAccountAddress={currentAccountAddress} />
        </Fade>
      ))}
    </TransitionGroup>
  );

  const preBoostedProposalsHTML = (
    <TransitionGroup className="boosted-proposals-list">
      { proposalsPreBoosted.map((proposal: IProposalState) => (
        <Fade key={"proposal_" + proposal.id}>
          <ProposalContainer proposalId={proposal.id} dao={dao} currentAccountAddress={currentAccountAddress}/>
        </Fade>
      ))}
    </TransitionGroup>
  );

  const queuedProposalsHTML = (
    <TransitionGroup className="boosted-proposals-list">
      { proposalsQueued.map((proposal: IProposalState) => (
        <Fade key={"proposal_" + proposal.id}>
          <ProposalContainer proposalId={proposal.id} dao={dao} currentAccountAddress={currentAccountAddress}/>
        </Fade>
      ))}
    </TransitionGroup>
  );

  return (
    <div className={css.daoProposalsContainer}>
      <Link className={css.createProposal} to={`/dao/${dao.address}/proposals/create`} data-test-id="create-proposal">+ New proposal</Link>
      <h2 className={css.queueType}>Contribution Reward</h2>
      { proposalsQueued.length == 0 && proposalsPreBoosted.length == 0 && proposalsBoosted.length == 0
            ? <div className={css.noDecisions}>
                <img className={css.relax} src="/assets/images/meditate.svg"/>
                <div className={css.proposalsHeader}>
                  No upcoming proposals
                </div>
                <div className={css.cta}>
                  <Link to={`/dao/${dao.address}/proposals/create`} data-test-id="create-proposal">Create a proposal</Link>
                </div>
              </div>
            : ""
      }

      { proposalsBoosted.length > 0 ?
        <div className={css.boostedContainer}>
          <div className={css.proposalsHeader}>
            Boosted
          </div>
          <div className={css.proposalsContainer + " " + css.boostedProposalsContainer}>
            {boostedProposalsHTML}
          </div>
        </div>
        : ""
      }

      { proposalsPreBoosted.length > 0 ?
        <div className={css.regularContainer}>
          <div className={css.proposalsHeader}>
            Pending
          </div>
          <div className={css.proposalsContainer}>
            {preBoostedProposalsHTML}
          </div>
        </div>
        : ""
      }

      { proposalsQueued.length > 0 ?
        <div className={css.regularContainer}>
          <div className={css.proposalsHeader}>
            Regular
          </div>
          <div className={css.proposalsContainer}>
            {queuedProposalsHTML}
          </div>
        </div>
        : ""
      }

    </div>
  )
}

export default(props: {currentAccountAddress: Address } & RouteComponentProps<any>) => {
  const daoAvatarAddress = props.match.params.daoAvatarAddress
  const currentAccountAddress =  props.currentAccountAddress
  const arc = getArc()
  const observable = combineLatest(
    arc.dao(daoAvatarAddress).proposals({ stage: ProposalStage.Queued }), // the list of queued proposals
    arc.dao(daoAvatarAddress).proposals({ stage: ProposalStage.PreBoosted }), // the list of preboosted proposals
    arc.dao(daoAvatarAddress).proposals({ stage: ProposalStage.Boosted }), // the list of boosted proposals
    arc.dao(daoAvatarAddress).state
  )
  return <Subscribe observable={observable}>{
    (state: IObservableState<[IProposalState[], IProposalState[], IProposalState[], IDAOState]>): any => {
      if (state.isLoading) {
        return  <div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>
      } else if (state.error) {
        throw state.error
      } else {
        const data = state.data
        return <DAOProposalsContainer proposalsQueued={data[0]} proposalsPreBoosted={data[1]} proposalsBoosted={data[2]} dao={data[3]} currentAccountAddress={currentAccountAddress}/>
      }
    }
  }</Subscribe>
}
