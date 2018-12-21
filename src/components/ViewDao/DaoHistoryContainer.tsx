import * as React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";

import { IRootState } from "reducers";
import { IWeb3State } from "reducers/web3Reducer";

import ProposalContainer from "../Proposal/ProposalContainer";

import * as css from "./ViewDao.scss";
import { arc } from 'arc'
import { Subscription, Observable } from 'rxjs'
import { Address, DAO, IDAOState, IProposalState, ProposalStage } from '@daostack/client'
import Subscribe, { IObservableState } from "components/Shared/Subscribe"

interface IProps {
  proposals: IProposalState[];
}

class DaoHistoryContainer extends React.Component<IProps, null> {

  public render() {
    const { proposals } = this.props;

    const proposalsHTML = proposals.map((proposal: IProposalState) => {
      return (<ProposalContainer key={"proposal_" + proposal.id} proposalId={proposal.id} />);
    });

    return(
        <div>
          <div className={css.proposalsHeader}>
            Executed Proposals
          </div>
          <div className={css.proposalsContainer}>
            <div className={css.proposalsContainer}>
              {proposalsHTML}
            </div>
          </div>
        </div>
    );
  }

}

export default (props: RouteComponentProps<any>) => {
  const daoAddress = props.match.params.daoAvatarAddress
  if (daoAddress) {
      const dao = new DAO(daoAddress, arc)
      // TODO: get only executed proposals, cf.  proposalsExecuted: selectors.createHistoryProposalsSelector()(state, ownProps),
      return <Subscribe observable={dao.proposals({ stage: ProposalStage.Resolved })}>{(state: IObservableState<IProposalState[]>) => {
          if (state.error) {
            return <div>{ state.error.message }</div>
          } else if (state.data) {
            return <DaoHistoryContainer proposals={state.data} />
          } else {
            return (<div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>);
          }
        }
      }</Subscribe>
  } else {
    throw Error(`no dao! `)
  }
}
