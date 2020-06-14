import { Arc, DAO } from "@dorgtech/arc.js";
import { getArc } from "arc";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import gql from "graphql-tag";
import Analytics from "lib/analytics";
import { createDaoStateFromQuery } from "lib/daoHelpers";
import { Page } from "pages";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as InfiniteScroll from "react-infinite-scroll-component";
import { connect } from "react-redux";
import * as Sticky from "react-stickynode";
import { Link } from "react-router-dom";
import { IRootState } from "reducers";
import { combineLatest, of } from "rxjs";
import { first } from "rxjs/operators";

import DaoCard from "./DaoCard";
import * as css from "./Daos.scss";

type SubscriptionData = [DAO[], DAO[], DAO[]];

interface IStateProps {
  currentAccountAddress: string;
  followingDAOs: string[];
}

const mapStateToProps = (state: IRootState): IStateProps => {
  return {
    currentAccountAddress: state.web3.currentAccountAddress,
    followingDAOs: state.profiles[state.web3.currentAccountAddress] ? state.profiles[state.web3.currentAccountAddress].follows.daos : [],
  };
};

type IProps = IStateProps & ISubscriptionProps<SubscriptionData>;

interface IState {
  isMobile: boolean;
  search: string;
  searchDaos: DAO[];
}

const PAGE_SIZE = 50;

class DaosPage extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      isMobile: window.innerWidth <= 550,
      search: "",
      searchDaos: [],
    };
  }

  public componentDidMount() {
    window.addEventListener("resize", this.updateWindowDimensions);

    Analytics.track("Page View", {
      "Page Name": Page.AllDAOs,
    });
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWindowDimensions);
  }

  private updateWindowDimensions = (_e: any) => {
    const nowMobile = window.innerWidth <= 550;
    if (nowMobile !== this.state.isMobile) {
      this.setState({ isMobile: nowMobile });
    }
  }

  onSearchChange = async (e: any) => {
    const searchString = e.target.value;

    this.setState({ search: searchString });

    // If search string greater than 2 search on server for any other DAOs not yet loaded that match this search
    if (searchString.length > 2) {
      const arc = getArc();
      const firstChar = searchString.charAt(0);
      const foundDaos = await combineLatest(
        // eslint-disable-next-line @typescript-eslint/camelcase
        arc.daos({ orderBy: "name", orderDirection: "asc", where: { name_contains: searchString } }, { fetchAllData: true }),
        // If string is all lower case also search for string with first character uppercased so "gen" matches "Gen" too
        // eslint-disable-next-line @typescript-eslint/camelcase
        firstChar.toLowerCase() === firstChar ? arc.daos({ orderBy: "name", orderDirection: "asc", where: { name_contains: firstChar.toUpperCase() + searchString.slice(1) } }, { fetchAllData: true }) : of([]),
        (data1, data2) => data1.concat(data2),
      ).pipe(first()).toPromise();
      this.setState({ searchDaos: foundDaos });
    } else {
      this.setState({ searchDaos: [] });
    }
  }

  public render(): RenderOutput {
    const { data, fetchMore } = this.props;
    const search = this.state.search.length > 2 ? this.state.search.toLowerCase() : "";

    // Always show DAOs that the current user is a member of or follows first
    const yourDAOs = data[1].concat(data[2]).filter(d => d.coreState.name.toLowerCase().includes(search)).sort((a, b) => a.coreState.name.localeCompare(b.coreState.name));
    const yourDAOAddresses = yourDAOs.map(dao => dao.id);

    // Then all the rest of the DAOs
    let otherDAOs = data[0];
    // Add any DAOs found from searching the server to the list
    if (this.state.searchDaos.length > 0) {
      // make sure we don't add duplicate DAOs to the list
      const extraFoundDaos = this.state.searchDaos.filter((dao) => {
        return !otherDAOs.find((d) => d.id === dao.id);
      });
      otherDAOs = otherDAOs.concat(extraFoundDaos);
    }

    // eslint-disable-next-line no-extra-boolean-cast
    if (process.env.SHOW_ALL_DAOS === "true") {
      // on staging we show all daos (registered or not)
      otherDAOs = otherDAOs.filter((d: DAO) => !yourDAOAddresses.includes(d.id) && d.coreState.name.toLowerCase().includes(search));
    } else {
      // Otherwise show registered DAOs
      otherDAOs = otherDAOs.filter((d: DAO) => {
        return !yourDAOAddresses.includes(d.id) &&
               d.coreState.name.toLowerCase().includes(search) &&
               d.coreState.register === "registered";
      });
    }

    const yourDaoNodes = yourDAOs.map((dao: DAO) => {
      return (
        <DaoCard
          key={dao.id}
          dao={dao}
        />
      );
    });

    const otherDaoNodes = otherDAOs.map((dao: DAO) => {
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

        <div className={css.searchBox}>
          <input type="text" name="search" placeholder="Search DAOs" onChange={this.onSearchChange} value={this.state.search} />
        </div>

        <Link to={"/daos/create"} className={css.createDaoButton}>
          Create A DAO
        </Link>

        {yourDAOs.length ? <React.Fragment>
          <Sticky enabled top={this.state.isMobile ? 75 : 50} innerZ={10000}>
            <div className={css.headerWrapper}>
              <div className={css.headerTitle + " clearfix"}>
                <h2 data-test-id="header-all-daos">Your DAOs</h2>
              </div>
            </div>
          </Sticky>

          <div className={css.daoList}>
            {yourDaoNodes}
          </div>
        </React.Fragment>
          : ""
        }

        <Sticky enabled top={this.state.isMobile ? 75 : 50} innerZ={10000}>
          <div className={css.headerWrapper}>
            <div className={css.headerTitle + " clearfix"}>
              <h2 data-test-id="header-all-daos">Other DAOs</h2>
            </div>
          </div>
        </Sticky>
        <div className={css.daoList}>
          {otherDaoNodes ?
            <InfiniteScroll
              dataLength={otherDaoNodes.length} // This is important field to render the next data
              next={fetchMore}
              hasMore
              loader=""
              endMessage={
                <p style={{textAlign: "center"}}>
                  <b>&mdash;</b>
                </p>
              }
            >
              {otherDaoNodes}
            </InfiniteScroll> : "None"}
        </div>
      </div>
    );
  }
}

const createSubscriptionObservable = (props: IStateProps, data: SubscriptionData = null) => {
  const arc = getArc();
  const { currentAccountAddress, followingDAOs } = props;

  // TODO: right now we don't handle a user following or being a member of more than 100 DAOs
  //       it was too hard to figure out the UI with infinite scrolling in this case we would need a different UI

  // Get list of DAO addresses the current user is a member of,
  //   ignoring ones that they are following so we dont show those twice
  const memberDAOsquery = gql`
    query ReputationHolderSearch {
      reputationHolders(where: {
          address: "${currentAccountAddress}"
          ${followingDAOs.length ? "dao_not_in: [" + followingDAOs.map(dao => "\"" + dao + "\"").join(",") + "]" : ""}
        },
      ) {
        dao {
          ...DAOFields
        }
      }
    }
    ${DAO.fragments.DAOFields}
  `;
  const memberOfDAOs = currentAccountAddress ? arc.getObservableList(
    arc,
    memberDAOsquery,
    (arc: Arc, r: any) => new DAO(arc, createDaoStateFromQuery(r.dao)),
    undefined,
    { subscribe: true }
  ) : of([]);
  // eslint-disable-next-line @typescript-eslint/camelcase
  const followDAOs = followingDAOs.length ? arc.daos({ where: { id_in: followingDAOs }, orderBy: "name", orderDirection: "asc"}, { fetchAllData: true, subscribe: true }) : of([]);

  return combineLatest(
    arc.daos({ orderBy: "name", orderDirection: "asc", first: PAGE_SIZE, skip: data ? data[0].length : 0}, { fetchAllData: true, subscribe: true }),
    followDAOs,
    memberOfDAOs
  );
};

const SubscribedDaosPage = withSubscription({
  wrappedComponent: DaosPage,
  loadingComponent: <div className={css.wrapper}><Loading/></div>,
  errorComponent: (props) => <div>{ props.error.message }</div>,

  // Don't ever update the subscription
  checkForUpdate: ["currentAccountAddress", "followingDAOs"],

  // used for hacky pagination tracking
  pageSize: PAGE_SIZE,

  createObservable: createSubscriptionObservable,

  getFetchMoreObservable: createSubscriptionObservable,

  fetchMoreCombine: (prevData: SubscriptionData, newData: SubscriptionData) => {
    return [prevData[0].concat(newData[0]), prevData[1], prevData[2]] as SubscriptionData;
  },
});

export default connect(mapStateToProps)(SubscribedDaosPage);
