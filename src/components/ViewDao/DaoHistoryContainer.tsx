import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { RouteComponentProps } from "react-router-dom";

import { combineLatest } from "rxjs";

import ProposalContainer from "../Proposal/ProposalContainer";

import * as css from "./ViewDao.scss";
import { getArc } from "arc";
import { Address, IDAOState, IProposalState, IProposalStage } from "@daostack/client";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";

interface IProps {
  proposals: IProposalState[];
  dao: IDAOState;
  currentAccountAddress: Address;
}

class DaoHistoryContainer extends React.Component<IProps, null> {

  public render() {
    const { proposals, dao, currentAccountAddress } = this.props;

    const proposalsHTML = proposals.map((proposal: IProposalState) => {
      return (<ProposalContainer key={"proposal_" + proposal.id} proposalId={proposal.id} dao={dao} currentAccountAddress={currentAccountAddress}/>);
    });

    return(
        <div>
          <BreadcrumbsItem to={"/dao/" + dao.address + "/history"}>History</BreadcrumbsItem>

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
  const arc = getArc();
  const daoAvatarAddress = props.match.params.daoAvatarAddress;
  const currentAccountAddress = props.currentAccountAddress;
  const observable = combineLatest(
    arc.dao(daoAvatarAddress).proposals({ stage: IProposalStage.ExpiredInQueue }),
    arc.dao(daoAvatarAddress).proposals({ stage: IProposalStage.Executed }),
    arc.dao(daoAvatarAddress).state()
  );
  return <Subscribe observable={observable}>{
    (state: IObservableState<[IProposalState[], IProposalState[], IDAOState]>): any => {
      if (state.isLoading) {
        return (<div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>);
      } else if (state.error) {
        return <div>{ state.error.message }</div>;
      } else  {
        return <DaoHistoryContainer proposals={state.data[0].concat(state.data[1])} dao={state.data[2]} currentAccountAddress={currentAccountAddress}/>;
      }
    }
  }</Subscribe>;
};
