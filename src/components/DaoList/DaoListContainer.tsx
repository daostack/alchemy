import { IDAOState } from "@daostack/client";
import { getArc } from "arc";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as React from "react";
import DaoContainer from "./DaoContainer";
import * as css from "./DaoList.scss";

interface IProps {
  daos: IDAOState[];
}

class DaoListContainer extends React.Component<IProps, null> {

  public render() {
    const { daos } = this.props;
    const daoNodes = daos.map((dao: IDAOState) => {
      return (
        <DaoContainer key={dao.address}  address={dao.address}/>
      );
    });
    return (
      <div className={css.wrapper}>
        <div className={css.daoListHeader + " " + css.clearfix}>
          <h2 data-test-id="header-all-daos">All DAOs</h2>
        </div>
        {daoNodes ? daoNodes : "None"}
      </div>
    );
      }
}

export default () => {
  const arc = getArc();
  return <Subscribe observable={arc.daos()}>{(state: IObservableState<IDAOState[]>) => {
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
