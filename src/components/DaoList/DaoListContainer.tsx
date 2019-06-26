import { DAO } from "@daostack/client";
import { getArc } from "arc";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import Analytics from "lib/analytics";
import * as React from "react";
import DaoContainer from "./DaoContainer";
import * as css from "./DaoList.scss";

interface IProps {
  daos: DAO[];
}

class DaoListContainer extends React.Component<IProps, null> {

  public componentDidMount() {
    Analytics.track("Page View", {
      "Page Name": "DAO List"
    });
  }

  public render() {
    const { daos } = this.props;
    const daoNodes = daos.map((dao: DAO) => {
      return (
        <DaoContainer key={dao.address}  dao={dao}/>
      );
    });
    return (
      <div className={css.wrapper}>
        <div className={css.daoListHeader + " clearfix"}>
          <h2 data-test-id="header-all-daos">All DAOs</h2>
        </div>
        {daoNodes ? daoNodes : "None"}
      </div>
    );
      }
}

export default () => {
  const arc = getArc();
  const observable = arc.daos();
  return <Subscribe observable={observable}>{(state: IObservableState<DAO[]>) => {
      if (state.isLoading) {
        return (
          <div className={css.wrapper}>
            <div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/>
            </div>
          </div>
        );
      } else if (state.error) {
        throw state.error;
      } else {
        return <DaoListContainer daos={state.data} />;
      }
    }

  }</Subscribe>;
};
