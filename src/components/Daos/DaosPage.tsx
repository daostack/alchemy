import { DAO } from "@daostack/client";
import { getArc } from "arc";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as React from "react";
import * as Sticky from "react-stickynode";
import { combineLatest} from "rxjs";
import DaoCard from "./DaoCard";
import * as css from "./Daos.scss";

type SubscriptionData = [DAO[], DAO[]];

type IProps = ISubscriptionProps<SubscriptionData>;

class DaosPage extends React.Component<IProps, null> {

  public render() {
    const { data } = this.props;

    const daos = data[1];
    if (data[0].length > 0) {
      daos.unshift(data[0][0]);
    }

    const daoNodes = daos.map((dao: DAO) => {
      return (
        <DaoCard key={dao.id}  dao={dao}/>
      );
    });
    return (
      <div className={css.wrapper}>
        <Sticky enabled top={50} innerZ={10000}>
          <div className={css.daoListHeader + " clearfix"}>
            <h2 data-test-id="header-all-daos">All DAOs</h2>
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
    return combineLatest(
      arc.daos({ where: { name: "Genesis Alpha" }}),
      // eslint-disable-next-line
      arc.daos({ where: { name_not_contains: "Genesis Alpha", register: "registered" }, orderBy: "name", orderDirection: "asc"}),
    );
  },
});
