import { Arc, DAO } from "@daostack/arc.js";
import { getArc } from "arc";
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
import { showSimpleMessage } from "lib/util";
import { SortService } from "lib/sortService";
import DaoCard from "./DaoCard";
import * as css from "./Daos.scss";
import BHubReg from "../Buidlhub/Registration";
import i18next from "i18next";
import classNames from "classnames";
import axios from "axios";
import { getNetworkName, isEmptyObject } from "lib/util";

type SubscriptionData = [DAO[], DAO[], DAO[]];

interface IStateProps {
  currentAccountAddress: string;
  followingDAOs: string[];
}

interface IDAOsBalances {
  [address: string]: { balance: string, formattedBalance: string };
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
  sortBy: string;
  sortOrder: number;
  daosBalances: IDAOsBalances
}

const PAGE_SIZE = 50;

class DaosPage extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      isMobile: window.innerWidth <= 550,
      search: "",
      searchDaos: [],
      sortBy: "name",
      sortOrder: 1,
      daosBalances: {},
    };
  }

  public async componentDidMount() {
    window.addEventListener("resize", this.updateWindowDimensions);
    await this.getDaosBalances();

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

  /**
   * Fetches the DAOs total holdings from the DAOs Balances Service
   */
  getDaosBalances = async () => {
    const network = (await getNetworkName()).toLowerCase();
    const url = `https://daos-balances-service.herokuapp.com/daosBalance/getDaosBalances/?version=v2&network=http_${network}`;
    const dataArray = await axios ({ url: url, method: "GET" }).then(res => { return res.data; });
    const data:IDAOsBalances = {};
    for (const dao of dataArray){
      const { address="", ...balanceData } = { ...dao };
      data[address] = { ...balanceData };
    }
    this.setState({ daosBalances: data });
  }

  onSearchChange = async (e: any) => {
    const searchString = e.target.value;

    this.setState({ search: searchString });

    // If search string greater than 2 search on server for any other DAOs not yet loaded that match this search
    if (searchString.length > 2) {
      const arc = getArc();
      const firstChar = searchString.charAt(0);
      const foundDaos = await combineLatest(
        // eslint-disable-next-line @typescript-eslint/naming-convention
        arc.daos({ orderBy: "name", orderDirection: "asc", where: { name_contains: searchString } }, { fetchAllData: true }),
        // If string is all lower case also search for string with first character uppercased so "gen" matches "Gen" too
        // eslint-disable-next-line @typescript-eslint/naming-convention
        firstChar.toLowerCase() === firstChar ? arc.daos({ orderBy: "name", orderDirection: "asc", where: { name_contains: firstChar.toUpperCase() + searchString.slice(1) } }, { fetchAllData: true }) : of([]),
        (data1, data2) => data1.concat(data2),
      ).pipe(first()).toPromise();
      this.setState({ searchDaos: foundDaos });
    } else {
      this.setState({ searchDaos: [] });
    }
  }

  sortDaos = (daos: DAO[]) => {
    const sortBy = this.state.sortBy;
    switch (sortBy) {
      case "name":
        daos.sort((a, b) => SortService.evaluateString(a.coreState[sortBy], b.coreState[sortBy], this.state.sortOrder ));
        break;
      case "memberCount":
        daos.sort((a, b) => SortService.evaluateNumber(a.coreState[sortBy] as number, b.coreState[sortBy] as number, this.state.sortOrder ));
        break;
      case "totalHoldings":
        daos.sort((a, b) => SortService.evaluateString(this.state.daosBalances[a.coreState.address]?.balance, this.state.daosBalances[b.coreState.address]?.balance, this.state.sortOrder ));
        break;
    }
  }

  onSortChange = (e: any) => {
    this.setState({ sortBy: e.target.value });
  }

  onSortOrderChange = () => {
    let sortOrder = this.state.sortOrder;
    this.setState({ sortOrder: sortOrder *= -1});
  }

  public render(): RenderOutput {
    const { data, fetchMore } = this.props;
    const search = this.state.search.length > 2 ? this.state.search.toLowerCase() : "";
    const daosBalances = this.state.daosBalances;

    // Always show DAOs that the current user is a member of or follows first
    const yourDAOs = data[1].concat(data[2]).filter(d => d.coreState.name.toLowerCase().includes(search));
    const yourDAOAddresses = yourDAOs.map(dao => dao.id);

    this.sortDaos(yourDAOs);

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

    this.sortDaos(otherDAOs);

    const yourDaoNodes = yourDAOs.map((dao: DAO) => {
      return (
        <DaoCard
          key={dao.id}
          dao={dao}
          totalHoldings={isEmptyObject(daosBalances) ? "N/A" : daosBalances[dao.id]?.formattedBalance}
        />
      );
    });

    const otherDaoNodes = otherDAOs.map((dao: DAO) => {
      return (
        <DaoCard
          key={dao.id}
          dao={dao}
          totalHoldings={isEmptyObject(daosBalances) ? "N/A" : daosBalances[dao.id]?.formattedBalance}
        />
      );
    });

    const sortOrderClass = classNames({
      [css.sortOrder]: true,
      [css.sortOrderDescending]: this.state.sortOrder === -1,
    });

    return (
      <div className={css.wrapper}>
        <BreadcrumbsItem to="/daos/">{i18next.t("All DAOs")}</BreadcrumbsItem>

        <div className={css.paddingTop}>&nbsp;</div>

        <div className={css.topRow}>
          <div className={css.searchBox}>
            <input type="text" name="search" placeholder="Search DAOs" onChange={this.onSearchChange} value={this.state.search} />
          </div>

          <div className={css.sortWrapper}>
            <div className={sortOrderClass} onClick={this.onSortOrderChange} />
            {i18next.t("Sort by")}
            <select className={css.sortSelect} onChange={this.onSortChange}>
              <option value="name">{i18next.t("Name")}</option>
              <option value="memberCount">{i18next.t("Members")}</option>
              <option value="totalHoldings">{i18next.t("Total Holdings")}</option>
            </select>
          </div>

          <div className={css.createDaoButton}>
            <Link to={"/daos/create"}>
              {i18next.t("Create A DAO")}
            </Link>
          </div>
        </div>

        <div className={css.yourDaos}>
          {yourDAOs.length ? <React.Fragment>
            <div className={css.headerWrapper}>
              <div className={css.headerTitle}>
                <h2 data-test-id="header-all-daos">
                  {i18next.t("Your DAOs")}
                </h2>
                <div className={css.emailAlertsWrapper} onClick={this.registerForMonitoring} >
                  <div className={cn("fa fa-envelope", css.emailIcon)} />
                  {i18next.t("Email Alerts")}
                </div>
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
              <h2 data-test-id="header-all-daos">{i18next.t("Other DAOs")}</h2>
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
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const followDAOs = followingDAOs.length ? arc.daos({ where: { id_in: followingDAOs }, orderBy: "name", orderDirection: "asc" }, { fetchAllData: true, subscribe: true }) : of([]);

  return combineLatest(
    arc.daos({ orderBy: "name", orderDirection: "asc", first: PAGE_SIZE, skip: data ? data[0].length : 0 }, { fetchAllData: true, subscribe: true }),
    followDAOs,
    memberOfDAOs
  );
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
    return [prevData[0].concat(newData[0]), prevData[1], prevData[2]] as SubscriptionData;
  },
});

export default connect(mapStateToProps)(SubscribedDaosPage);
