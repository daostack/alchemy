import { DAO } from "@daostack/client";
import { getArc } from "arc";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as React from "react";
import * as Sticky from "react-stickynode";
import { mergeMap } from "rxjs/operators";
import { Observable, combineLatest } from "rxjs";
import DaoCard, { IObservableProps } from "./DaoCard";
import * as css from "./Daos.scss";

type IProps = ISubscriptionProps<[IObservableProps[], IObservableProps[]]>;

class DaosPage extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const { data } = this.props;

    const daoInfos = [...data[0], ...data[1]];

    const daoNodes = daoInfos.map((daoInfo: IObservableProps) => {
      return (
        <DaoCard key={daoInfo[2].id} data={daoInfo}/>
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

    const toDaoCardObservables = (daos: DAO[]): Observable<IObservableProps[]> => {

      const cardObservables: Observable<IObservableProps>[] = [];

      daos.map((dao: DAO): void => {
        cardObservables.push(DaoCard.createObservable(dao));
      });

      return combineLatest(...cardObservables);
    };

    /**
     * So we don't start to render until all the DAO information has been fetched, otherwise each DAO will be
     * fetched independently, each in its own time, and thus we'll see them appearing initially in wrong sequences.
     */
    return combineLatest(
      arc.daos({ where: { name: "Genesis Alpha" }}, { fetchAllData: true, subscribe: true })
        .pipe(mergeMap(toDaoCardObservables)),
      // eslint-disable-next-line @typescript-eslint/camelcase
      arc.daos({ where: { name_not_contains: "Genesis Alpha", register: "registered" }, orderBy: "name", orderDirection: "asc"}, { fetchAllData: true, subscribe: true })
        .pipe(mergeMap(toDaoCardObservables)),
    );
  },
});
