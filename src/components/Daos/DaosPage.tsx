import { DAO } from "@daostack/client";
import { getArc } from "arc";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as React from "react";
import * as Sticky from "react-stickynode";
import { Link } from "react-router-dom";
import DaoCard from "./DaoCard";
import * as css from "./Daos.scss";

type SubscriptionData = DAO[];

type IProps = ISubscriptionProps<SubscriptionData>;

class DaosPage extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const { data } = this.props;

    let daos: DAO[];
    if (process.env.NODE_ENV === "staging") {
      // on staging we show all daos (registered or not)
      daos = data.filter((d: DAO) => d.staticState.name === "Genesis Alpha")
        .concat(data.filter((d: DAO) => d.staticState.name !== "Genesis Alpha"));
    } else {
      daos = data.filter((d: DAO) => d.staticState.name === "Genesis Alpha")
        .concat(data.filter((d: DAO) => d.staticState.name !== "Genesis Alpha" && d.staticState.register === "registered"));
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
          <div className={css.daoListHeader + " clearfix"}>
            <h2 data-test-id="header-all-daos">All DAOs</h2>
            <Link to={"/dao-creator"}>
              <div>Create A DAO</div>
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

export default withSubscription({
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
