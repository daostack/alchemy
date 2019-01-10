import * as classNames from "classnames";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";

import { IRootState } from "reducers";
import { IWeb3State } from "reducers/web3Reducer";

// import { ConnectedProposalContainer as ProposalContainer } from "../Proposal/ProposalContainer";
import ProposalContainer from "../Proposal/ProposalContainer";
import Subscribe, { IObservableState } from "components/Shared/Subscribe"
import { arc } from "arc";
import * as css from "./ViewDao.scss";
import { combineLatest } from 'rxjs'
import { IProposalState, ProposalStage } from '@daostack/client'

interface IStateProps extends RouteComponentProps<any> {
  daoAvatarAddress: string;
  web3: IWeb3State;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    daoAvatarAddress: ownProps.match.params.daoAvatarAddress,
    // proposalsLoaded: state.arc.daos[ownProps.match.params.daoAvatarAddress] && state.arc.daos[ownProps.match.params.daoAvatarAddress].proposalsLoaded,
    // proposalsBoosted: selectors.createBoostedProposalsSelector()(state, ownProps),
    // proposalsPreBoosted: selectors.createPreBoostedProposalsSelector()(state, ownProps),
    web3: state.web3,
  };
};

interface IDispatchProps {}

const mapDispatchToProps = {};

type IProps = IStateProps & IDispatchProps;

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

class DaoProposalsContainer extends React.Component<IProps, null> {

  public render() {
    const { daoAvatarAddress } = this.props;

    const observable = combineLatest(
      // TODO: add queries here, like `proposals({boosted: true})` or whatever (TBD)
      arc.dao(daoAvatarAddress).proposals({ stage: ProposalStage.Boosted }), // the list of boosted proposals
      arc.dao(daoAvatarAddress).proposals({ stage: ProposalStage.Open }), // the list of pre-boosted proposals
    )
    return <Subscribe observable={observable}>{
      (state: IObservableState<[IProposalState[], IProposalState[]]>): any => {
        if (state.isLoading) {
          return  <div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>
        } else if (state.error){
          throw state.error
        } else {
          const data = state.data
          const proposalsBoosted = data[0]
          const proposalsPreBoosted = data[1]
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
                          <Link to={`/dao/${this.props.daoAvatarAddress}/proposals/create`} data-test-id="create-proposal">Create a proposal</Link>
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
      }
    }</Subscribe>
  }

}

export default connect(mapStateToProps, mapDispatchToProps)(DaoProposalsContainer);
