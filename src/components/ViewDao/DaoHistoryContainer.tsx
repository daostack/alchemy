import * as React from "react";
import { RouteComponentProps } from "react-router-dom";

import { combineLatest } from 'rxjs'

import ProposalContainer from "../Proposal/ProposalContainer";

import * as css from "./ViewDao.scss";
import { arc } from 'arc'
import { Address, IDAOState, IProposalState, ProposalStage } from '@daostack/client'
import Subscribe, { IObservableState } from "components/Shared/Subscribe"

interface IProps {
  proposals: IProposalState[]
  dao: IDAOState
  currentAccountAddress: Address
}

class DaoHistoryContainer extends React.Component<IProps, null> {

  public render() {
    const { proposals, dao, currentAccountAddress } = this.props;

    const proposalsHTML = proposals.map((proposal: IProposalState) => {
      return (<ProposalContainer key={"proposal_" + proposal.id} proposalId={proposal.id} dao={dao} currentAccountAddress={currentAccountAddress}/>);
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

export default (props: {currentAccountAddress: Address} & RouteComponentProps<any>) => {
  const daoAvatarAddress = props.match.params.daoAvatarAddress
  const currentAccountAddress = props.currentAccountAddress
  const observable = combineLatest(
    // TODO: add queries here, like `proposals({boosted: true})` or whatever
    arc.dao(daoAvatarAddress).proposals({ stage: ProposalStage.Resolved }), // the list of pre-boosted proposals
    arc.dao(daoAvatarAddress).state
  )
  return <Subscribe observable={observable}>{
    (state: IObservableState<[IProposalState[], IDAOState]>): any => {
      if (state.isLoading) {
        return (<div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>);
      } else if (state.error) {
        return <div>{ state.error.message }</div>
      } else  {
        return <DaoHistoryContainer proposals={state.data[0]} dao={state.data[1]} currentAccountAddress={currentAccountAddress}/>
      }
    }
  }</Subscribe>
}
