import { Address, IDAOState, IProposalStage, Proposal } from "@daostack/client";
import { getArc } from "arc";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as InfiniteScroll from "react-infinite-scroll-component";
import { RouteComponentProps } from "react-router-dom";
import * as Sticky from "react-stickynode";
import { combineLatest } from "rxjs";
import ProposalHistoryRow from "../Proposal/ProposalHistoryRow";
import ProposalData from "../Proposal/ProposalData";
import * as css from "./Dao.scss";

const PAGE_SIZE = 100;

interface IExternalProps extends RouteComponentProps<any> {
  currentAccountAddress: Address;
}

type SubscriptionData = [Proposal[], IDAOState];
type IProps = IExternalProps & ISubscriptionProps<SubscriptionData>;


class DaoHistoryPage extends React.Component<IProps, null> {

  public render() {
    const { data, hasMoreToLoad, fetchMore } = this.props;

    const [proposals, dao] = data;
    const { currentAccountAddress } = this.props;

    const proposalsHTML = proposals.map((proposal: Proposal) => {
      return <ProposalData currentAccountAddress={currentAccountAddress} dao={dao} proposalId={proposal.id} key={proposal.id}>
        { props => {
          const {
            member,
            stakes,
            votes,
          } = props;
          return (<ProposalHistoryRow key={"proposal_" + proposal.id} proposal={proposal} dao={dao}
            currentAccountAddress={currentAccountAddress}
            currentAccountState={member}
            stakes={stakes}
            votes={votes}
            proposalState={props.proposal}
          />);
        }}</ProposalData>;
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
              hasMore={hasMoreToLoad}
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

export default withSubscription({
  wrappedComponent: DaoHistoryPage,
  loadingComponent: <div className={css.loading}><Loading/></div>,
  errorComponent: (props) => <div>{ props.error.message }</div>,

  checkForUpdate: (oldProps, newProps) => { return oldProps.match.params.daoAvatarAddress !== newProps.match.params.daoAvatarAddress; },

  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    const daoAvatarAddress = props.match.params.daoAvatarAddress;
    const dao = arc.dao(daoAvatarAddress);

    return combineLatest(
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

  },

  // used for hacky pagination tracking
  pageSize: PAGE_SIZE,

  getFetchMoreObservable: (props: IExternalProps, data: SubscriptionData) => {
    const arc = getArc();
    const daoAvatarAddress = props.match.params.daoAvatarAddress;
    const dao = arc.dao(daoAvatarAddress);

    return dao.proposals({
      where: {
        // eslint-disable-next-line @typescript-eslint/camelcase
        stage_in: [IProposalStage.ExpiredInQueue, IProposalStage.Executed, IProposalStage.Queued],
        // eslint-disable-next-line @typescript-eslint/camelcase
        closingAt_lte: Math.floor(new Date().getTime() / 1000),
      },
      orderBy: "closingAt",
      orderDirection: "desc",
      first: PAGE_SIZE,
      skip: data[0].length,
    });
  },

  fetchMoreCombine: (prevState: SubscriptionData, newData: Proposal[]) => {
    return [prevState[0].concat(newData), prevState[1]];
  },
});
