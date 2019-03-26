import { IDAOState } from "@daostack/client";
import { getArc, getContractAddresses } from "arc";
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
    let daosToShow: IDAOState[] = [];
    // filter DAOs depending on environment
    // TODO: this is a temporary fix until https://github.com/daostack/subgraph/issues/152 is resolved
    if (process.env.NODE_ENV === "staging") {
      const deployedDAO =  getContractAddresses("rinkeby").dao.Avatar.toLowerCase();
      daosToShow = daos.filter((dao) => dao.address === deployedDAO);
    } else {
      daosToShow = daos;
    }
    const daoNodes = daosToShow.map((dao: IDAOState) => {
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
