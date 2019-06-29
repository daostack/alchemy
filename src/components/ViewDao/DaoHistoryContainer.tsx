import { Address, IDAOState, IProposalStage, IProposalType, Proposal } from "@daostack/client";
import { getArc } from "arc";
import Loading from "components/Shared/Loading";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { RouteComponentProps } from "react-router-dom";
import { combineLatest } from "rxjs";
import ProposalHistoryRow from "../Proposal/ProposalHistoryRow";
import * as css from "./ViewDao.scss";

interface IProps {
  proposals: Proposal[];
  dao: IDAOState;
  currentAccountAddress: Address;
}

class DaoHistoryContainer extends React.Component<IProps, null> {

  public render() {
    const { proposals, dao, currentAccountAddress } = this.props;

    const proposalsHTML = proposals.map((proposal: Proposal) => {
      return (<ProposalHistoryRow key={"proposal_" + proposal.id} proposal={proposal} daoState={dao} currentAccountAddress={currentAccountAddress}/>);
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
                <div className={css.scheme}>Scheme</div>
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
    dao.proposals({ stage_in: [IProposalStage.ExpiredInQueue, IProposalStage.Executed], type: IProposalType.GenericScheme }),
    dao.proposals({ stage: IProposalStage.Queued, expiresInQueueAt_lte: Math.floor(new Date().getTime() / 1000), type: IProposalType.GenericScheme }),
    dao.proposals({ stage_in: [IProposalStage.ExpiredInQueue, IProposalStage.Executed], type: IProposalType.SchemeRegistrarAdd }),
    dao.proposals({ stage: IProposalStage.Queued, expiresInQueueAt_lte: Math.floor(new Date().getTime() / 1000), type: IProposalType.SchemeRegistrarAdd }),
    dao.state()
  );
  return <Subscribe observable={observable}>{
    (state: IObservableState<[Proposal[], Proposal[], Proposal[], Proposal[], Proposal[], Proposal[], IDAOState]>): any => {
      if (state.isLoading) {
        return (<div className={css.loading}><Loading/></div>);
      } else if (state.error) {
        return <div>{ state.error.message }</div>;
      } else  {
        return <DaoHistoryContainer proposals={state.data[0].concat(state.data[1]).concat(state.data[2]).concat(state.data[3]).concat(state.data[4]).concat(state.data[5])} dao={state.data[6]} currentAccountAddress={currentAccountAddress}/>;
      }
    }
  }</Subscribe>;
};
