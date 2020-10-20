import { Address, DAO, IDAOState, AnyProposal, Plugin, Stake, Vote, Proposals } from "@daostack/arc.js";
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
  filteredProposalSet: Array<AnyProposal>;
  filtering: boolean;
}

type SubscriptionData = AnyProposal[];
type IProps = IExternalProps & IState & ISubscriptionProps<SubscriptionData>;

const ProposalsHTML = (props: {
  proposals: Array<AnyProposal>;
  history: any;
  daoState: IDAOState;
  currentAccountAddress: Address;
}): React.ReactElement => {
  return <> {
    props.proposals.map((proposal: AnyProposal) => {
      return (<ProposalHistoryRow key={"proposal_" + proposal.id} history={props.history} proposal={proposal} daoState={props.daoState} currentAccountAddress={props.currentAccountAddress} />);
    })
  }
  </>;
};

const proposalsQuery = (daoState: IDAOState, skip: number, titleSearch?: string): Observable<SubscriptionData> => {

  const filter: any = {
  };

  if (titleSearch?.trim()) {
    filter["title_contains"] = titleSearch;
  }

  const arc = getArc();
  const dao = new DAO(arc, daoState);

  return dao.proposals({
    where: filter,
    orderBy: "closingAt",
    orderDirection: "desc",
    first: PAGE_SIZE,
    skip,
  },
  // get and subscribe to all data, so that subcomponents do nto have to send separate queries
  { fetchAllData: true });
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

  onSearchChange = (e: any) => {
    this.filterString = e.target.value;
  }

  onSearchExecute = async (e: any) => {
    let foundProposals: Array<AnyProposal>;
    if ((e.type === "blur") || (e.key === "Enter")) {
      if (this.filterString?.length) {
        this.setState({ filtering: true });
        foundProposals = await proposalsQuery(this.props.daoState, 0, this.filterString).pipe(first()).toPromise();
      }
      else {
        foundProposals = null;
      }
      this.setState({ filteredProposalSet: foundProposals, filtering: false });
    }
  }

  public render(): RenderOutput {
    const { data, hasMoreToLoad, fetchMore, currentAccountAddress, daoState } = this.props;

    const proposals = this.state.filteredProposalSet ?? data;

    const result = (
      <div className={css.container}>
        <BreadcrumbsItem to={"/dao/" + daoState.address + "/history"}>History</BreadcrumbsItem>

        <div className={css.paddingTop}>&nbsp;</div>

        <div className={css.topRow}>
          <div className={css.daoHistoryHeader}>History</div>

          <div className={css.searchBox.concat(`${this.state.filtering ? ` ${css.filtering}` : ""}`)}>
            <input type="text" name="search" placeholder="Type and press Enter or Tab to filter proposals by title"
              onKeyPress={this.onSearchExecute}
              onBlur={this.onSearchExecute}
              onInput={this.onSearchChange} />
          </div>
        </div>

        <InfiniteScroll
          dataLength={proposals.length} //This is important field to render the next data
          next={fetchMore}
          hasMore={hasMoreToLoad}
          loader=""
          style={{ overflow: "visible" }}
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
                  <th className={css.status}>Status</th>
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
    const dao = new DAO(arc, props.daoState);

    // this query will fetch al data we need before rendering the page, so we avoid hitting the server
    // with all separate queries for votes and stakes and stuff...
    let voterClause = "";
    let stakerClause = "";
    if (props.currentAccountAddress) {
      voterClause = `(where: { voter: "${props.currentAccountAddress}"})`;
      stakerClause = `(where: { staker: "${props.currentAccountAddress}"})`;
    }

    // NOTE: We cannot use the fragment to reduce the boilerplate here because
    // we're using nested where filters for voters & stakers. These fields are already
    // present in the fragment. See here for a solution: https://github.com/daostack/arc.js/issues/471
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
          id
          accountsWithUnclaimedRewards
          boostedAt
          closingAt
          confidenceThreshold
          createdAt
          dao {
            id
            schemes {
              id
              address
            }
          }
          description
          descriptionHash
          executedAt
          executionState
          expiresInQueueAt
          genesisProtocolParams {
            id
            activationTime
            boostedVotePeriodLimit
            daoBountyConst
            limitExponentValue
            minimumDaoBounty
            preBoostedVotePeriodLimit
            proposingRepReward
            queuedVotePeriodLimit
            queuedVoteRequiredPercentage
            quietEndingPeriod
            thresholdConst
            votersReputationLossRatio
          }
          gpRewards {
            id
          }
          scheme {
            ...PluginFields
          }
          gpQueue {
            id
            threshold
            votingMachine
          }
          organizationId
          preBoostedAt
          proposer
          quietEndingPeriodBeganAt
          stage
          stakesFor
          stakesAgainst
          tags {
            id
          }
          totalRepWhenCreated
          totalRepWhenExecuted
          title
          url
          votesAgainst
          votesFor
          votingMachine
          winningOutcome
          votes ${voterClause} {
            ...VoteFields
          }
          stakes ${stakerClause} {
            ...StakeFields
          }
          ${Object.values(Proposals)
    .filter((proposal) => proposal.fragment)
    .map((proposal) => "..." + proposal.fragment?.name)
    .join("\n")}
        }
      }
      ${Object.values(Proposals)
    .filter((proposal) => proposal.fragment)
    .map((proposal) => proposal.fragment?.fragment.loc?.source.body)
    .join("\n")}
      ${Vote.fragments.VoteFields}
      ${Stake.fragments.StakeFields}
      ${Plugin.baseFragment}
    `;
    await arc.getObservable(prefetchQuery, { polling: true }).pipe(first()).toPromise();
    return proposalsQuery(props.daoState, 0);
  },

  // used for hacky pagination tracking
  pageSize: PAGE_SIZE,

  getFetchMoreObservable: (props: IExternalProps, data: SubscriptionData) => {
    return proposalsQuery(props.daoState, data.length);
  },
});
