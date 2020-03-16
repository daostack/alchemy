import { DAO } from "@daostack/client";
import { getArc } from "arc";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import gql from "graphql-tag";
import Analytics from "lib/analytics";
import { Page } from "pages";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as InfiniteScroll from "react-infinite-scroll-component";
import { connect } from "react-redux";
import * as Sticky from "react-stickynode";
import { Link } from "react-router-dom";
import { IRootState } from "reducers";
import { IProfileState } from "reducers/profilesReducer";
import { combineLatest, of } from "rxjs";

import DaoCard from "./DaoCard";
import * as css from "./Daos.scss";

type SubscriptionData = [DAO[], string[]];

interface IStateProps {
  currentAccountAddress: string;
  currentAccountProfile: IProfileState;
}

const mapStateToProps = (state: IRootState): IStateProps => {
  return {
    currentAccountAddress: state.web3.currentAccountAddress,
    currentAccountProfile: state.profiles[state.web3.currentAccountAddress],
  };
};

type IProps = IStateProps & ISubscriptionProps<SubscriptionData>;

interface IState {
  search: string;
}

const PAGE_SIZE = 50;

class DaosPage extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      search: "",
    };
  }

  public componentDidMount() {
    Analytics.track("Page View", {
      "Page Name": Page.AllDAOs,
    });
  }

  onSearchChange = (e: any) => {
    this.setState({ search: e.target.value });
  }

  public render(): RenderOutput {
    const { currentAccountProfile, data, fetchMore } = this.props;
    const search = this.state.search.toLowerCase();

    const allDAOs = data[0];

    // Always show Genesis Alpha first
    let finalDAOList = allDAOs.filter((d: DAO) => d.staticState.name === "Genesis Alpha" && d.staticState.name.toLowerCase().includes(search));

    if (process.env.NODE_ENV === "staging") {
      // on staging we show all daos (registered or not)
      finalDAOList = finalDAOList.concat(allDAOs.filter((d: DAO) => d.staticState.name !== "Genesis Alpha" && d.staticState.name.toLowerCase().includes(search)));
    } else {
      // Otherwise show registered DAOs or DAOs that the person follows or is a member of
      const memberOfDAOs = data[1];
      finalDAOList = finalDAOList.concat(allDAOs.filter((d: DAO) => {
        return d.staticState.name !== "Genesis Alpha" &&
               d.staticState.name.toLowerCase().includes(search) &&
               (d.staticState.register === "registered" ||
                  (currentAccountProfile && currentAccountProfile.follows.daos.includes(d.staticState.address)) ||
                  memberOfDAOs.includes(d.staticState.address));
      }));
    }

    const daoNodes = finalDAOList.map((dao: DAO) => {
      return (
        <DaoCard
          key={dao.id}
          dao={dao}
        />
      );
    });

    return (
      <div className={css.wrapper}>
        <BreadcrumbsItem to="/daos/">All DAOs</BreadcrumbsItem>

        <Sticky enabled top={50} innerZ={10000}>
          <div className={css.headerWrapper}>
            <div className={css.headerTitle + " clearfix"}>
              <h2 data-test-id="header-all-daos">All DAOs</h2>
            </div>
            <div className={css.searchBox}>
              <span>Search:</span>
              <input type="text" name="search" placeholder="DAO Name" onChange={this.onSearchChange} value={this.state.search} />
            </div>
            <Link to={"/daos/create"} className={css.createDaoButton}>
              Create A DAO
            </Link>
          </div>
        </Sticky>
        <div className={css.daoList}>
          {daoNodes ?
            <InfiniteScroll
              dataLength={finalDAOList.length} // This is important field to render the next data
              next={fetchMore}
              hasMore
              loader=""
              endMessage={
                <p style={{textAlign: "center"}}>
                  <b>&mdash;</b>
                </p>
              }
            >
              {daoNodes}
            </InfiniteScroll> : "None"}
        </div>
      </div>
    );
  }
}

const SubscribedDaosPage = withSubscription({
  wrappedComponent: DaosPage,
  loadingComponent: <div className={css.wrapper}><Loading/></div>,
  errorComponent: (props) => <div>{ props.error.message }</div>,

  // Don't ever update the subscription
  checkForUpdate: ["currentAccountAddress"],

  // used for hacky pagination tracking
  pageSize: PAGE_SIZE,

  createObservable: (props: IStateProps) => {
    const arc = getArc();

    // Get list of DAO addresses the current user is a member of
    const memberDAOsquery = gql`
      query ReputationHolderSearch {
        reputationHolders(where: { address: "${props.currentAccountAddress}" }, first: ${PAGE_SIZE}, skip: 0) {
          dao {
            id
          }
        }
      }
    `;
    const memberOfDAOs = props.currentAccountAddress ? arc.getObservableList(memberDAOsquery, (r: any) => r.dao.id, { subscribe: true }) : of([]);

    return combineLatest(
      arc.daos({ orderBy: "name", orderDirection: "asc", first: PAGE_SIZE, skip: 0}, { fetchAllData: true, subscribe: true }),
      memberOfDAOs
    );
  },

  getFetchMoreObservable: (props: IStateProps, data: SubscriptionData) => {
    const arc = getArc();

    // Get list of DAO addresses the current user is a member of
    const memberDAOsquery = gql`
      query ReputationHolderSearch {
        reputationHolders(where: { address: "${props.currentAccountAddress}" }, first: ${PAGE_SIZE}, skip: ${data[1].length}) {
          dao {
            id
          }
        }
      }
    `;
    const memberOfDAOs = props.currentAccountAddress ? arc.getObservableList(memberDAOsquery, (r: any) => r.dao.id, { subscribe: true }) : of([]);

    return combineLatest(
      arc.daos({ orderBy: "name", orderDirection: "asc", first: PAGE_SIZE, skip: data[0].length}, { fetchAllData: true, subscribe: true }),
      memberOfDAOs
    );
  },

  fetchMoreCombine: (prevData: SubscriptionData, newData: SubscriptionData) => {
    return [prevData[0].concat(newData[0]), prevData[1].concat(newData[1])] as SubscriptionData;
  },
});

export default connect(mapStateToProps)(SubscribedDaosPage);

