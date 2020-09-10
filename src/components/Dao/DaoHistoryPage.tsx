import { Address, IDAOState, Proposal, Vote, Scheme, Stake, DAO } from "@daostack/arc.js";
import { getArc } from "arc";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import gql from "graphql-tag";
import Analytics from "lib/analytics";
import { Page } from "pages";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import InfiniteScroll from "react-infinite-scroll-component";
import { Link, RouteComponentProps } from "react-router-dom";
import { first } from "rxjs/operators";
import ProposalHistoryRow from "../Proposal/ProposalHistoryRow";
import * as css from "./DaoHistoryPage.scss";
import { Observable } from "rxjs";

const PAGE_SIZE = 50;

interface IExternalProps extends RouteComponentProps<any> {
  currentAccountAddress: Address;
  daoState: IDAOState;
}

interface IState {
  filteredProposalSet: Array<Proposal>;
  filtering: boolean;
}

type SubscriptionData = Array<Proposal>;
type IProps = IExternalProps & IState & ISubscriptionProps<SubscriptionData>;

const ProposalsHTML = (props:
{
  proposals: Array<Proposal>;
  history: any;
  daoState: IDAOState;
  currentAccountAddress: Address;
}): React.ReactElement => {
  return <> {
    props.proposals.map((proposal: Proposal) => {
      return (<ProposalHistoryRow key={"proposal_" + proposal.id} history={props.history} proposal={proposal} daoState={props.daoState} currentAccountAddress={props.currentAccountAddress} />);
    })
  }
  </>;
};

const proposalsQuery = (dao: DAO, skip: number, titleSearch?: string): Observable<Array<Proposal>> => {
  const filter: any = {
  };

  if (titleSearch?.trim()) {
    filter["title_contains"] = titleSearch;
  }

  return dao.proposals({
    where: filter,
    orderBy: "closingAt",
    orderDirection: "desc",
    first: PAGE_SIZE,
    skip,
  }, { fetchAllData: true });
};

class DaoHistoryPage extends React.Component<IProps, IState> {

  private filterString = "";

  constructor(props: IProps) {
    super(props);

    this.state = {
      filteredProposalSet: null,
      filtering: false,
    };
  }

  public componentDidMount() {
    Analytics.track("Page View", {
      "Page Name": Page.DAOHistory,
      "DAO Address": this.props.daoState.address,
      "DAO Name": this.props.daoState.name,
    });
  }

  onSearchChange = async (e: any) => {
    this.filterString = e.target.value;
  }

  onSearchExecute = async (e: any) => {
    let foundProposals: Array<Proposal>;
    if ((e.type === "blur") || (e.key === "Enter")) {
      if (this.filterString?.length) {
        this.setState({filtering: true});
        foundProposals = await proposalsQuery(this.props.daoState.dao, 0, this.filterString).pipe(first()).toPromise();
      }
      else {
        foundProposals = null;
      }
      this.setState({ filteredProposalSet: foundProposals, filtering: false });
    }
  }

  public render(): RenderOutput {
    const { data, hasMoreToLoad, fetchMore, daoState, currentAccountAddress } = this.props;

    const proposals = this.state.filteredProposalSet ?? data;

    const result = (
      <div className={css.container}>
        <BreadcrumbsItem to={"/dao/" + daoState.address + "/history"}>History</BreadcrumbsItem>

        <div className={css.daoHistoryHeader}>History</div>

        <div className={css.searchBox.concat(`${this.state.filtering ? ` ${css.filtering}` : ""}`)}>
          <input type="text" name="search" placeholder="Type and press Enter or Tab to filter proposals by title"
            onKeyPress={this.onSearchExecute}
            onBlur ={this.onSearchExecute}
            onInput={this.onSearchChange}/>
        </div>

        <InfiniteScroll
          dataLength={proposals.length} //This is important field to render the next data
          next={fetchMore}
          hasMore={hasMoreToLoad}
          loader=""
          style={{overflow: "visible"}}
          endMessage={null}
        >
          {proposals.length === 0 ?
            this.state.filteredProposalSet ?
              <span>No proposals found whose title contains the given text.  Note the filter is case-sensitive.</span> :
              <span>{this.props.daoState.name} hasn&apos;t created any proposals yet. Go to the <Link to={"/dao/" + daoState.id + "/proposal/"}>DAO&apos;s installed plugins</Link> to create proposals.</span> :

            <table className={css.proposalHistoryTable}>
              <thead>
                <tr className={css.proposalHistoryTableHeader}>
                  <th>Proposed by</th>
                  <th>End date</th>
                  <th>Plugin</th>
                  <th>Title</th>
                  <th>Votes</th>
                  <th>Predictions</th>
                  <th>Status</th>
                  <th>My actions</th>
                </tr>
              </thead>
              <tbody>
                <ProposalsHTML
                  proposals={proposals}
                  history={this.props.history}
                  daoState={daoState}
                  currentAccountAddress={currentAccountAddress} />
              </tbody>
            </table>
          }
        </InfiniteScroll>

      </div>
    );

    return result;
  }
}

export default withSubscription({
  wrappedComponent: DaoHistoryPage,
  loadingComponent: <Loading />,
  errorComponent: (props) => <div>{props.error.message}</div>,

  checkForUpdate: [],

  createObservable: async (props: IExternalProps) => {
    const arc = getArc();
    const dao = props.daoState.dao;

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
      ${Scheme.fragments.SchemeFields}
    `;

    await arc.getObservable(prefetchQuery, { subscribe: true }).pipe(first()).toPromise();

    return proposalsQuery(dao, 0);
  },

  // used for hacky pagination tracking
  pageSize: PAGE_SIZE,

  getFetchMoreObservable: (props: IExternalProps, data: SubscriptionData) => {
    const dao = props.daoState.dao;
    return proposalsQuery(dao, data.length);
  },
});
