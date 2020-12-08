import * as React from "react";
import * as css from "./DaoProposalsPage.scss";
import { Address, IDAOState, Proposal } from "@daostack/arc.js";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import Loading from "components/Shared/Loading";
import InfiniteScroll from "react-infinite-scroll-component";
import { Observable } from "rxjs";
import ProposalRow from "components/Proposal/ProposalRow";
import { RouteComponentProps } from "react-router-dom";
import { first } from "rxjs/operators";
import { isAddress } from "lib/util";
import moment from "moment-timezone";

const PAGE_SIZE = 50;

type SubscriptionData = Array<Proposal>;
type IProps = IExternalProps & ISubscriptionProps<SubscriptionData>;
type IExternalProps = {
  daoState: IDAOState;
  currentAccountAddress: Address;
} & RouteComponentProps<any>;

type OrderDirection = "asc" | "desc";


const proposalsQuery = (dao: IDAOState, skip: number, titleSearch?: string): Observable<Array<Proposal>> => {
  const filter: any = {
  };

  let orderDirection: OrderDirection = "asc";

  if (!titleSearch) {
    if (skip % PAGE_SIZE === 0) {
      filter["closingAt_gt"] = moment().unix();
    } else {
      skip -= dao.numberOfQueuedProposals + dao.numberOfPreBoostedProposals + dao.numberOfBoostedProposals;
      filter["closingAt_lt"] = moment().unix();
    }
  }

  if (titleSearch?.trim()) {
    orderDirection = "desc";
    if (isAddress(titleSearch)) {
      filter["proposer"] = titleSearch;
    } else {
      filter["title_contains"] = titleSearch;
    }
  }

  return dao.dao.proposals({
    where: filter,
    orderBy: "closingAt",
    orderDirection: orderDirection,
    first: titleSearch ? undefined : PAGE_SIZE, // TEMPORARY UNTIL WE PASS "titleSearch" in line 143
    skip,
  }, { fetchAllData: true });
};

const DaoProposalsPage = (props: IProps) => {
  const { data, hasMoreToLoad, fetchMore, daoState } = props;
  const [filtering, setFiltering] = React.useState(false);
  const [filterString, setFilterString] = React.useState("");
  const [filteredProposalSet, setFilteredProposalSet] = React.useState(null);

  const onSearchExecute = async (e: any) => {
    let foundProposals: Array<Proposal>;
    if ((e.type === "blur") || (e.key === "Enter")) {
      if (filterString?.length) {
        setFiltering(true);
        foundProposals = await proposalsQuery(props.daoState, 0, filterString).pipe(first()).toPromise();
      }
      else {
        foundProposals = null;
      }
      setFilteredProposalSet(foundProposals);
      setFiltering(false);
    }
  };



  const proposals = (filteredProposalSet ?? data).map((proposal: Proposal) => {
    return <ProposalRow key={proposal.id} data={proposal} history={props.history} />;
  });

  return (
    <div className={css.wrapper}>
      <BreadcrumbsItem to={`/dao/${daoState.address}`}>Proposals</BreadcrumbsItem>
      <div className={css.topBarWrapper}>
        <div className={css.top}>
          <h1 className={css.title}>Proposals</h1>
          <div
            // Temporary until https://github.com/daostack/alchemy/issues/2292 is ready.
            style={{ pointerEvents: "none", backgroundColor: "gray"}}
            className={css.createProposalButton}
            data-test-id="createProposal">
            + New Proposal (WIP)
          </div>
        </div>
        {data.length > 0 && <div className={css.searchBox.concat(`${filtering ? ` ${css.filtering}` : ""}`)}>
          <input type="text" name="search" placeholder="Type and press Enter or Tab to filter proposals by title or proposer address"
            onKeyPress={onSearchExecute}
            onBlur={onSearchExecute}
            onChange={(e) => setFilterString(e.target.value)} />
        </div>}
      </div>
      <InfiniteScroll
        dataLength={proposals.length}
        next={fetchMore}
        hasMore={hasMoreToLoad}
        loader=""
        style={{ overflow: "visible" }}
        endMessage={null}>
        <div className={css.tableContainer}>
          {
            data.length > 0 ?
              filteredProposalSet?.length === 0 ? <span>No proposals found whose title contains the given text or proposer address.  Note the filter is case-sensitive.</span> :
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th></th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposals}
                  </tbody>
                </table>
              : <span>{daoState.name} hasn&apos;t created any proposals yet.</span>
          }
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default withSubscription({
  wrappedComponent: DaoProposalsPage,
  loadingComponent: <Loading />,
  errorComponent: (props) => <div>{props.error.message}</div>,
  checkForUpdate: ["daoState"],
  createObservable: async (props: IProps) => {
    return proposalsQuery(props.daoState as IDAOState, 0);
  },
  pageSize: PAGE_SIZE,
  getFetchMoreObservable: (props: IProps, data: SubscriptionData) => {
    return proposalsQuery(props.daoState as IDAOState, data.length);
  },
});
