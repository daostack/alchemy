import { DAO, DAOFieldsFragment } from "@daostack/arc.js";
import { getArcs } from "arc";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import gql from "graphql-tag";
import Analytics from "lib/analytics";
import { createDaoStateFromQuery } from "lib/daoHelpers";
import { Page } from "pages";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import InfiniteScroll from "react-infinite-scroll-component";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { IRootState } from "reducers";
import { combineLatest, of } from "rxjs";
import { first } from "rxjs/operators";
import cn from "classnames";
import { showSimpleMessage, standardPolling, Networks, targetNetworks } from "lib/util";
import DaoCard from "./DaoCard";
import * as css from "./Daos.scss";
import BHubReg from "../Buidlhub/Registration";


type SubscriptionData = DAO[][];

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

const PAGE_SIZE = 100;

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

  private registerForMonitoring = () => {
    showSimpleMessage(
      {
        title: "BUIDLHub Proposal Monitoring",
        body: <BHubReg />,
        hideFooter: true,
      }
    );
  }

  onSearchChange = async (e: any) => {
    const searchString = e.target.value;

    this.setState({ search: searchString });

    // If search string greater than 2 search on server for any other DAOs not yet loaded that match this search
    if (searchString.length > 2) {
      const arcs = getArcs();
      const firstChar = searchString.charAt(0);

      const daosData = [];
      for (const network in arcs) {
        const arc = arcs[network];
        // eslint-disable-next-line @typescript-eslint/camelcase
        daosData.push(arc.daos({ orderBy: "name", orderDirection: "asc", where: { name_contains: searchString } }, { fetchAllData: true }));
        // If string is all lower case also search for string with first character uppercased so "gen" matches "Gen" too
        // eslint-disable-next-line @typescript-eslint/camelcase
        daosData.push(firstChar.toLowerCase() === firstChar? arc.daos({ orderBy: "name", orderDirection: "asc", where: { name_contains: firstChar.toUpperCase() + searchString.slice(1) } }, { fetchAllData: true }) : of([]));
      }

      let foundDaos = await combineLatest(daosData).pipe(first()).toPromise() as DAO[];
      // create flat array (combine all sub-arrays into one array)
      foundDaos = [].concat(...foundDaos);
      this.setState({ searchDaos: foundDaos as DAO[] });
    } else {
      this.setState({ searchDaos: [] });
    }
  }

  public render(): RenderOutput {
    const { data, fetchMore } = this.props;
    const search = this.state.search.length > 2 ? this.state.search.toLowerCase() : "";

    let yourDAOs = [] as DAO[];
    let otherDAOs = [] as DAO[];

    /**
     * data is an array that holds all DAOs from all networks in the following way:
     *  - arrays in indexes in a multiples of 3 contain all DAOs (e.g. data[0], data[3], data[6], ...)
     *  - arrays in other indexes (e.g. data[1], data[2], data[4], data[5], ...) contain all followingDAOs and memberDAOs.
     *  In the below loop we will combine all DAOs to *otherDAOs* and followingDAOs and memberDAOs to *yourDAOs*;
     */
    for (const [index, set] of data.entries()) {
      if (index % 3 === 0) {
        otherDAOs.push(set as any);
      }
      else yourDAOs.push(set as any);
    }

    // Combine all sub-arrays into one array.
    yourDAOs = [].concat(...yourDAOs);
    otherDAOs = [].concat(...otherDAOs);

    // Always show DAOs that the current user is a member of or follows first
    yourDAOs = yourDAOs.filter(d => d.staticState.name.toLowerCase().includes(search)).sort((a, b) => a.staticState.name.localeCompare(b.staticState.name));
    const tempMap: {[key in string]: boolean} = {};
    //exclude duplicates
    yourDAOs = yourDAOs.filter((dao) => {
      if (!tempMap[dao.id]) {
        tempMap[dao.id] = true;
        return true;
      }
      return false;
    });

    const yourDAOAddresses = yourDAOs.map(dao => dao.id);

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
      otherDAOs = otherDAOs.filter((d: DAO) => !yourDAOAddresses.includes(d.id) && d.staticState?.name.toLowerCase().includes(search));
    } else {
      // Otherwise show registered DAOs
      otherDAOs = otherDAOs.filter((d: DAO) => {
        return !yourDAOAddresses.includes(d.id) &&
          d.staticState.name.toLowerCase().includes(search) &&
          d.staticState.register === "registered";
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

        <div className={css.topRow}>
          <div className={css.searchBox}>
            <input type="text" name="search" placeholder="Search DAOs" onChange={this.onSearchChange} value={this.state.search} />
          </div>

          <div className={css.createDaoButton}>
            <Link to={"/daos/create"}>
              Create A DAO
            </Link>
          </div>
        </div>

        <div className={css.yourDaos}>
          {yourDAOs.length ? <React.Fragment>
            <div className={css.headerWrapper}>
              <div className={css.headerTitle}>
                <h2 data-test-id="header-all-daos">
                  Your DAOs
                  {targetNetworks().length > 1 ?
                    <i className={cn("fa fa-envelope", css.emailIcon)} onClick={this.registerForMonitoring} />
                    : ""}
                </h2>
              </div>
            </div>

            <div className={css.daoList}>
              {yourDaoNodes}
            </div>
          </React.Fragment>
            : ""
          }
        </div>

        <div className={css.otherDaos}>
          <div className={css.headerWrapper}>
            <div className={css.headerTitle}>
              <h2 data-test-id="header-all-daos">Other DAOs</h2>
            </div>
          </div>
          <div className={css.daoList}>
            {otherDaoNodes ?
              <InfiniteScroll
                dataLength={otherDaoNodes.length} // This is important field to render the next data
                next={fetchMore}
                hasMore
                loader=""
                endMessage={null}
              >
                {otherDaoNodes}
              </InfiniteScroll> : "None"}
          </div>
        </div>
      </div>
    );
  }
}

const createSubscriptionObservable = (props: IStateProps, data: SubscriptionData = null) => {
  const { currentAccountAddress, followingDAOs } = props;
  // TODO: right now we don't handle a user following or being a member of more than 100 DAOs
  //       it was too hard to figure out the UI with infinite scrolling in this case we would need a different UI

  // Get list of DAO addresses the current user is a member of,
  //   ignoring ones that they are following so we dont show those twice
  const memberDAOsquery = gql`
    query ReputationHolderSearch {
      reputationHolders(where: {
          address: "${currentAccountAddress?.toLowerCase()}"
          ${followingDAOs.length ? "dao_not_in: [" + followingDAOs.map(dao => "\"" + dao + "\"").join(",") + "]" : ""}
        },
      ) {
        dao {
          ...DAOFields
        }
      }
    }
    ${DAOFieldsFragment}
  `;



  const arcs = getArcs();
  const daosData = [];

  for (const network in arcs) {
    const arc = arcs[network];
    daosData.push(arc.daos({ orderBy: "name", orderDirection: "asc", first: PAGE_SIZE, skip: data ? data[0].length : 0 }, standardPolling(true)));
    // eslint-disable-next-line @typescript-eslint/camelcase
    daosData.push(followingDAOs.length? arc.daos({ where: { id_in: followingDAOs }, orderBy: "name", orderDirection: "asc" }, standardPolling(true)) : of([]));
    daosData.push(currentAccountAddress? arc.getObservableList(memberDAOsquery, (r: any) => createDaoStateFromQuery(r.dao, network as Networks).dao, standardPolling()) : of([]));
  }

  return combineLatest(daosData);
};

const SubscribedDaosPage = withSubscription({
  wrappedComponent: DaosPage,
  loadingComponent: <div className={css.wrapper}><Loading /></div>,
  errorComponent: (props) => <div>{props.error.message}</div>,

  // Don't ever update the subscription
  checkForUpdate: ["currentAccountAddress", "followingDAOs"],

  // used for hacky pagination tracking
  pageSize: PAGE_SIZE,

  createObservable: createSubscriptionObservable,

  getFetchMoreObservable: createSubscriptionObservable,

  fetchMoreCombine: (prevData: SubscriptionData, newData: SubscriptionData) => {
    const array = [] as any;
    for (const [index] of prevData.entries()) {
      if (index % 3 === 0){
        array[index] = prevData[index].concat(newData[index]);
      } else {
        array[index] = prevData[index];
      }
    }
    return array;
  },
});

export default connect(mapStateToProps)(SubscribedDaosPage);
