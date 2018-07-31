import * as classNames from "classnames";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IProposalState } from "reducers/arcReducer";
import { IWeb3State } from "reducers/web3Reducer";
import * as selectors from "selectors/daoSelectors";
import * as schemas from "schemas";

import ProposalContainer from "../Proposal/ProposalContainer";
import DaoHeader from "./DaoHeader";
import DaoNav from "./DaoNav";

import * as css from "./ViewDao.scss";

interface IStateProps extends RouteComponentProps<any> {
  daoAvatarAddress: string;
  proposalsLoaded: boolean;
  proposalsBoosted: IProposalState[];
  proposalsPreBoosted: IProposalState[];
  web3: IWeb3State;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    daoAvatarAddress: ownProps.match.params.daoAvatarAddress,
    proposalsLoaded: state.arc.daos[ownProps.match.params.daoAvatarAddress].proposalsLoaded,
    proposalsBoosted: selectors.createBoostedProposalsSelector()(state, ownProps),
    proposalsPreBoosted: selectors.createPreBoostedProposalsSelector()(state, ownProps),
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
    const { proposalsLoaded, proposalsBoosted, proposalsPreBoosted } = this.props;

    const boostedProposalsHTML = (
      <TransitionGroup className="boosted-proposals-list">
        { proposalsBoosted.map((proposal: IProposalState) => (
          <Fade key={"proposal_" + proposal.proposalId}>
            <ProposalContainer proposalId={proposal.proposalId} />
          </Fade>
        ))}
      </TransitionGroup>
    );

    const preBoostedProposalsHTML = (
      <TransitionGroup className="boosted-proposals-list">
        { proposalsPreBoosted.map((proposal: IProposalState) => (
          <Fade key={"proposal_" + proposal.proposalId}>
            <ProposalContainer proposalId={proposal.proposalId} />
          </Fade>
        ))}
      </TransitionGroup>
    );

    return(
      <div>
        { !proposalsLoaded
            ? <div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>
            : proposalsPreBoosted.length == 0 && proposalsBoosted.length == 0
              ? <div className={css.noDecisions}>
                  <img className={css.relax} src="/assets/images/meditate.svg"/>
                  <div className={css.proposalsHeader}>
                    No upcoming proposals
                  </div>
                  <div className={css.cta}>
                    <Link to={`/dao/${this.props.daoAvatarAddress}/proposals/create`}>Create a proposal</Link>
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
    );
  }

}

export default connect(mapStateToProps, mapDispatchToProps)(DaoProposalsContainer);
