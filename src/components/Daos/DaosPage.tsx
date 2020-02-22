import { DAO } from "@daostack/client";
import { getArc } from "arc";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import Analytics from "lib/analytics";
import { Page } from "pages";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as React from "react";
import { connect } from "react-redux";
import * as Sticky from "react-stickynode";
import { Link } from "react-router-dom";
import { IRootState } from "reducers";
import { IProfileState } from "reducers/profilesReducer";
import DaoCard from "./DaoCard";
import * as css from "./Daos.scss";

type SubscriptionData = DAO[];

interface IStateProps {
  currentAccountProfile: IProfileState;
}

const mapStateToProps = (state: IRootState): IStateProps => {
  return {
    currentAccountProfile: state.profiles[state.web3.currentAccountAddress],
  };
};

type IProps = IStateProps & ISubscriptionProps<SubscriptionData>;

interface IState {
  search: string;
}

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
    const { currentAccountProfile, data } = this.props;
    const search = this.state.search.toLowerCase();

    let daos: DAO[] = data.filter((d: DAO) => d.staticState.name === "Genesis Alpha" && d.staticState.name.toLowerCase().includes(search));

    if (process.env.NODE_ENV === "staging") {
      // on staging we show all daos (registered or not)
      daos = daos.concat(data.filter((d: DAO) => d.staticState.name !== "Genesis Alpha" && d.staticState.name.toLowerCase().includes(search)));
    } else {
      // Otherwise show registered DAOs or DAOs that the person follows or is a member of
      daos = daos.concat(data.filter((d: DAO) => {
        return d.staticState.name !== "Genesis Alpha" &&
               d.staticState.name.toLowerCase().includes(search) &&
               (d.staticState.register === "registered" ||
                  (currentAccountProfile && currentAccountProfile.follows.daos.includes(d.staticState.address)));
      }));
    }

    const daoNodes = daos.map((dao: DAO) => {
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
          {daoNodes ? daoNodes : "None"}
        </div>
      </div>
    );
  }
}

const SubscribedDaosPage = withSubscription({
  wrappedComponent: DaosPage,
  loadingComponent: <div className={css.wrapper}><div className={css.loading}><Loading/></div></div>,
  errorComponent: (props) => <div>{ props.error.message }</div>,

  // Don't ever update the subscription
  checkForUpdate: () => { return false; },

  createObservable: () => {
    const arc = getArc();
    return arc.daos({
      // where: { register: "registered" },
      orderBy: "name", orderDirection: "asc"}, { fetchAllData: true, subscribe: true });
  },
});

export default connect(mapStateToProps)(SubscribedDaosPage);

