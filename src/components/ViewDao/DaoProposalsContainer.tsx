import * as React from "react";
import { Link, RouteComponentProps } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import ProposalContainer from "../Proposal/ProposalContainer";
import Subscribe, { IObservableState } from "components/Shared/Subscribe"
import { arc } from "arc";
import * as css from "./ViewDao.scss";
import { combineLatest } from 'rxjs'
import { Address, IProposalState, ProposalStage } from '@daostack/client'

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

const ProposalsContainer = (props: {
  proposalsBoosted: IProposalState[],
  proposalsPreBoosted: IProposalState[],
  daoAddress: Address
}) => {
  const proposalsBoosted = props.proposalsBoosted
  const proposalsPreBoosted = props.proposalsPreBoosted
  const boostedProposalsHTML = (
    <TransitionGroup className="boosted-proposals-list">
      { proposalsBoosted.map((proposal: IProposalState) => (
        <Fade key={"proposal_" + proposal.id}>
          <ProposalContainer proposalId={proposal.id} />
        </Fade>
      ))}
    </TransitionGroup>
  );

  const preBoostedProposalsHTML = (
    <TransitionGroup className="boosted-proposals-list">
      { proposalsPreBoosted.map((proposal: IProposalState) => (
        <Fade key={"proposal_" + proposal.id}>
          <ProposalContainer proposalId={proposal.id} />
        </Fade>
      ))}
    </TransitionGroup>
  );

  return (
    <div>
      { proposalsPreBoosted.length == 0 && proposalsBoosted.length == 0
            ? <div className={css.noDecisions}>
                <img className={css.relax} src="/assets/images/meditate.svg"/>
                <div className={css.proposalsHeader}>
                  No upcoming proposals
                </div>
                <div className={css.cta}>
                  <Link to={`/dao/${props.daoAddress}/proposals/create`} data-test-id="create-proposal">Create a proposal</Link>
                </div>
              </div>
            : ""
      }

      { proposalsBoosted.length > 0 ?
        <div className={css.boostedContainer}>
          <div className={css.proposalsHeader}>
            Boosted Proposals

           {/* <span>Available funds: <span>13,000 ETH - 327 KIN</span></span> */}

          </div>
          <div className={css.columnHeader + " " + css.clearfix}>
            <div className={css.votes}>
              VOTES
            </div>
            <div className={css.predictions}>
              PREDICTIONS
            </div>
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
            Regular Proposals
          </div>
          <div className={css.columnHeader + " " + css.clearfix}>
            <div className={css.votes}>
              VOTES
            </div>
            <div className={css.predictions}>
              PREDICTIONS
            </div>
          </div>
          <div className={css.proposalsContainer}>
            {preBoostedProposalsHTML}
          </div>
        </div>
        : ""
      }

    </div>
  )
}
export default(props: RouteComponentProps<any>) => {
  const daoAvatarAddress = props.match.params.daoAvatarAddress
  const observable = combineLatest(
    // TODO: add queries here, like `proposals({boosted: true})` or whatever
    arc.dao(daoAvatarAddress).proposals({ stage: ProposalStage.Boosted }), // the list of boosted proposals
    arc.dao(daoAvatarAddress).proposals({ stage: ProposalStage.Open }), // the list of pre-boosted proposals
  )
  return <Subscribe observable={observable}>{
    (state: IObservableState<[IProposalState[], IProposalState[]]>): any => {
      if (state.isLoading) {
        return  <div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>
      } else if (state.error) {
        throw state.error
      } else {
        const data = state.data
        return <ProposalsContainer proposalsBoosted={data[0]} proposalsPreBoosted={data[1]} daoAddress={daoAvatarAddress} />
      }
    }
  }</Subscribe>
}
