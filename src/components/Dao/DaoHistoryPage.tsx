import { Address, IDAOState, IProposalStage, Proposal, Vote, Stake } from "@daostack/client";
import { getArc } from "arc";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import gql from "graphql-tag";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as InfiniteScroll from "react-infinite-scroll-component";
import { RouteComponentProps } from "react-router-dom";
import * as Sticky from "react-stickynode";
import { combineLatest } from "rxjs";
import { first } from "rxjs/operators";
import ProposalHistoryRow from "../Proposal/ProposalHistoryRow";
import * as css from "./Dao.scss";

const PAGE_SIZE = 100;

interface IExternalProps extends RouteComponentProps<any> {
  currentAccountAddress: Address;
}

type SubscriptionData = [Proposal[], IDAOState];
type IProps = IExternalProps & ISubscriptionProps<SubscriptionData>;

class DaoHistoryPage extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const { data, hasMoreToLoad, fetchMore } = this.props;

    const [proposals, dao] = data;
    const { currentAccountAddress } = this.props;

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

        <InfiniteScroll
          dataLength={proposals.length} //This is important field to render the next data
          next={fetchMore}
          hasMore={hasMoreToLoad}
          loader=""
          style={{overflow: "visible"}}
          endMessage={
            <p style={{textAlign: "center"}}>
              <b>&mdash;</b>
            </p>
          }
        >
          { proposals.length === 0 ? "There has been no activity to date" :
            <table className={css.proposalHistoryTable}>
              <thead>
                <tr className={css.proposalHistoryTableHeader}>
                  <th>Proposed by</th>
                  <th>End date</th>
                  <th>Scheme</th>
                  <th>Title</th>
                  <th>Votes</th>
                  <th>Predictions</th>
                  <th>Status</th>
                  <th>My actions</th>
                </tr>
              </thead>
              <tbody>
                {proposalsHTML}
              </tbody>
            </table>
          }
        </InfiniteScroll>

      </div>
    );
  }
}

export default withSubscription({
  wrappedComponent: DaoHistoryPage,
  loadingComponent: <div className={css.loading}><Loading/></div>,
  errorComponent: (props) => <div>{ props.error.message }</div>,

  checkForUpdate: (oldProps, newProps) => { return oldProps.match.params.daoAvatarAddress !== newProps.match.params.daoAvatarAddress; },

  createObservable: async (props: IExternalProps) => {
    const arc = getArc();
    const daoAvatarAddress = props.match.params.daoAvatarAddress;
    const dao = arc.dao(daoAvatarAddress);

    // this query will fetch al data we need before rendering the page, so we avoid hitting the server
    // with all separate queries for votes and stakes and stuff...
    let voterClause = "";
    let stakerClause = "";
    if (props.currentAccountAddress) {
      voterClause = `(where: { voter: "${props.currentAccountAddress}"})`;
      stakerClause = `(where: { staker: "${props.currentAccountAddress}"})`;

    }
    const prefetchQuery = gql`
      query prefetchProposalDataForDAOHistory {
        proposals (
          first: ${PAGE_SIZE}
          skip: 0
          orderBy: "closingAt"
          orderDirection: "desc"
          where: {
            dao: "${dao.id}"
            stage_in: [
              "${IProposalStage[IProposalStage.ExpiredInQueue]}",
              "${IProposalStage[IProposalStage.Executed]}",
              "${IProposalStage[IProposalStage.Queued]}"
            ]
            closingAt_lte: "${Math.floor(new Date().getTime() / 1000)}"
          }
        ){
          ...ProposalFields
          votes ${voterClause} {
            ...VoteFields
          }
          stakes ${stakerClause} {
            ...StakeFields
          }
        }
      }
      ${Proposal.fragments.ProposalFields}
      ${Vote.fragments.VoteFields}
      ${Stake.fragments.StakeFields}
    `;
    await arc.getObservable(prefetchQuery, { subscribe: true }).pipe(first()).toPromise();
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
      },
      { fetchAllData: true } // get and subscribe to all data, so that subcomponents do nto have to send separate queries
      ),
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
    },
    { fetchAllData: true } // get and subscribe to all data, so that subcomponents do nto have to send separate queries
    );
  },

  fetchMoreCombine: (prevState: SubscriptionData, newData: Proposal[]) => {
    return [prevState[0].concat(newData), prevState[1]];
  },
});
