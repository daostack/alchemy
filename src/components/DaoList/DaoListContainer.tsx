import * as React from "react";
import { Link } from "react-router-dom";
import { arc } from "arc"
import Subscribe, { IObservableState } from "components/Shared/Subscribe"

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDaoState } from "reducers/arcReducer";
import { IDAOState } from "@daostack/client";

import * as schemas from "schemas";

import * as css from "./DaoList.scss";
import DaoContainer from "./DaoContainer"

interface IProps {
  state: IObservableState<IDAOState[]>
}

class DaoListContainer extends React.Component<IProps, null> {

  public render() {
    const { data } = this.props.state;
    const daos = data
    if (daos) {
      const daoNodes = daos.map((dao: IDAOState) => {
        return (
          <DaoContainer key={dao.address}  address={dao.address}/>
        )
      })
      return (
        <div className={css.wrapper}>
          <div className={css.daoListHeader + " " + css.clearfix}>
            <h2 data-test-id="header-all-daos">All DAOs</h2>
          </div>
          {daoNodes ? daoNodes : "None"}
        </div>
      )
    } else {
      return (
        <div className={css.wrapper}>
          <div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/>
          </div>
        </div>
      )
    }
  }
}

export default (props: { address: string}) =>
  <Subscribe observable={arc.daos()}>{(state: IObservableState<IDAOState[]>) =>
    <DaoListContainer state={state} />
  }</Subscribe>
