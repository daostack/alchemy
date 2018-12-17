import { denormalize } from "normalizr";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDaoState } from "reducers/arcReducer";

import * as schemas from "schemas";

import * as css from "./DaoList.scss";
import DaoContainer from "./DaoContainer"

interface IStateProps {
  daos: { [key: string]: IDaoState };
  daosLoaded: boolean;
}

const mapStateToProps = (state: IRootState, ownProps: any) => ({
  // TODO: only get the addresses here..
  daos: denormalize(state.arc.daos, schemas.daoList, state.arc),
  daosLoaded: state.arc.daosLoaded,
});

interface IDispatchProps {
  getDAOs: typeof arcActions.getDAOs;
}

const mapDispatchToProps = {
  getDAOs: arcActions.getDAOs,
};

type IProps = IStateProps & IDispatchProps;

class DaoListContainer extends React.Component<IProps, null> {

  public daoSubscription: any

  public async componentWillMount() {
    this.daoSubscription = this.props.getDAOs();
  }

  public async componentWillUnmount() {
    if (this.daoSubscription) {
      this.daoSubscription.unsubscribe();
    }
  }

  public render() {
    const { daos, daosLoaded } = this.props;

    const daoNodes = Object.keys(daos).map((key: string) => {
      const dao = daos[key];
      return <DaoContainer key={dao.address}  daoAddress={dao.address}/>
    })

    return (
      daosLoaded ? (
        <div className={css.wrapper}>
          <div className={css.daoListHeader + " " + css.clearfix}>
            <h2 data-test-id="header-all-daos">All DAOs</h2>
          </div>
          {daoNodes ? daoNodes : "None"}
        </div>)
      : (
        <div className={css.wrapper}>
          <div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/>
          </div>
        </div>)
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DaoListContainer);
