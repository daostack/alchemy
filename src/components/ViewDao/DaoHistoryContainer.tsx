/* tslint:disable:max-classes-per-file */

import { Address, IDAOState, IProposalStage, Proposal } from "@daostack/client";
import { getArc } from "arc";
import Loading from "components/Shared/Loading";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as InfiniteScroll from "react-infinite-scroll-component";
import { RouteComponentProps } from "react-router-dom";
import * as Sticky from "react-stickynode";
import { combineLatest } from "rxjs";
import ProposalHistoryRow from "../Proposal/ProposalHistoryRow";
import * as css from "./ViewDao.scss";

interface IProps {
  proposals: Proposal[];
  dao: IDAOState;
  currentAccountAddress: Address;
  fetchMore: () => void;
  hasMoreProposalsToLoad: boolean;
}

class DaoHistoryContainer extends React.Component<IProps, null> {

  public render() {
    const { currentAccountAddress, dao, fetchMore, hasMoreProposalsToLoad, proposals } = this.props;

    const proposalsHTML = proposals.map((proposal: Proposal) => {
      return (<ProposalHistoryRow key={"proposal_" + proposal.id} proposal={proposal} daoState={dao} currentAccountAddress={currentAccountAddress}/>);
    });

    return(
      <div>
        <BreadcrumbsItem to={"/dao/" + dao.address + "/history"}>History</BreadcrumbsItem>

        <Sticky enabled top={50} innerZ={10000}>
          <div className={css.daoHistoryHeader}>
            History
          </div>
        </Sticky>

        <div>
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
          <div className={css.proposalHistory}>
            <InfiniteScroll
              dataLength={proposals.length} //This is important field to render the next data
              next={fetchMore}
              hasMore={hasMoreProposalsToLoad}
              loader={<h4>Loading...</h4>}
              style={{overflow: "visible"}}
              endMessage={
                <p style={{textAlign: "center"}}>
                  <b>&mdash;</b>
                </p>
              }
            >
              {proposalsHTML}
            </InfiniteScroll>
          </div>
        </div>
      </div>
    );
  }
}

interface IExternalProps {
  currentAccountAddress: Address;
}

interface IState {
  hasMoreProposalsToLoad: boolean;
}

export default class DaoHistory extends React.Component<IExternalProps & RouteComponentProps<any>, IState> {

  constructor(props: IExternalProps & RouteComponentProps<any>) {
    super(props);

    this.state = {
      hasMoreProposalsToLoad: true,
    };
  }

  public render() {
    const arc = getArc();
    const daoAvatarAddress = this.props.match.params.daoAvatarAddress;
    const dao = arc.dao(daoAvatarAddress);
    const currentAccountAddress = this.props.currentAccountAddress;

    const PAGE_SIZE = 100;

    const observable = combineLatest(
      dao.proposals({
        where: {
          // eslint-disable-next-line @typescript-eslint/camelcase
          stage_in: [IProposalStage.ExpiredInQueue, IProposalStage.Executed, IProposalStage.Queued],
          // eslint-disable-next-line @typescript-eslint/camelcase
          closingAt_lte: Math.floor(new Date().getTime() / 1000),
        },
        orderBy: "closingAt",
        orderDirection: "desc",
        first: PAGE_SIZE,
        skip: 0,
      }),
      dao.state()
    );

    const setState = this.setState.bind(this);
    const parentState = this.state;

    return <Subscribe observable={observable}>{
      (state: IObservableState<[Proposal[], IDAOState]>): any => {
        if (state.isLoading) {
          return (<div className={css.loading}><Loading/></div>);
        } else if (state.error) {
          return <div>{ state.error.message }</div>;
        } else  {
          return <DaoHistoryContainer
            currentAccountAddress={currentAccountAddress}
            dao={state.data[1]}
            hasMoreProposalsToLoad={parentState.hasMoreProposalsToLoad}
            proposals={state.data[0]}
            fetchMore={() => {
              state.fetchMore({
                observable: dao.proposals({
                  where: {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    stage_in: [IProposalStage.ExpiredInQueue, IProposalStage.Executed, IProposalStage.Queued],
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    closingAt_lte: Math.floor(new Date().getTime() / 1000),
                  },
                  orderBy: "closingAt",
                  orderDirection: "desc",
                  first: PAGE_SIZE,
                  skip: state.data[0].length,
                }),
                combine: (prevState: [Proposal[], IDAOState], newData: Proposal[]) => {
                  if (newData.length < PAGE_SIZE) {
                    setState({ hasMoreProposalsToLoad: false});
                  }
                  return [prevState[0].concat(newData), prevState[1]];
                },
              });
            }}
          />;
        }
      }}
    </Subscribe>;
  }
}
