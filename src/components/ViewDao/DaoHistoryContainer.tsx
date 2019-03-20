import { Address, IDAOState, IProposalStage, IProposalState } from "@daostack/client";
import { getArc } from "arc";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { RouteComponentProps } from "react-router-dom";
import { combineLatest } from "rxjs";
import ClosedProposalContainer from "../Proposal/ClosedProposalContainer";
import * as css from "./ViewDao.scss";

interface IProps {
  proposals: IProposalState[];
  dao: IDAOState;
  currentAccountAddress: Address;
}

class DaoHistoryContainer extends React.Component<IProps, null> {

  public render() {
    const { proposals, dao, currentAccountAddress } = this.props;

    const proposalsHTML = proposals.map((proposal: IProposalState) => {
      return (<ClosedProposalContainer key={"proposal_" + proposal.id} proposalId={proposal.id} dao={dao} currentAccountAddress={currentAccountAddress}/>);
    });

    return(
        <div>
          <BreadcrumbsItem to={"/dao/" + dao.address + "/history"}>History</BreadcrumbsItem>

          <div className={css.daoHistoryHeader}>
            History
          </div>
          <div className={css.proposalsContainer}>
            <div className={css.closedProposalsHeader}>
                <div className={css.proposalCreator}>Proposed by</div>
                <div className={css.endDate}>End date</div>
                <div className={css.title}>Title</div>
                <div className={css.votes}>Votes</div>
                <div className={css.predictions}>Predictions</div>
                <div className={css.closeReason}>Status</div>
                <div className={css.myActions}>My actions</div>
            </div>
            <div className={css.proposalsContainer + " " + css.proposalHistory}>
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
  const dao = arc.dao(daoAvatarAddress);
  const currentAccountAddress = props.currentAccountAddress;
  const observable = combineLatest(
    dao.proposals({ stage_in: [IProposalStage.ExpiredInQueue, IProposalStage.Executed] }),
    dao.proposals({ stage: IProposalStage.Queued, expiresInQueueAt_lte: Math.floor(new Date().getTime() / 1000) }),
    dao.state()
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
