import { denormalize } from "normalizr";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link } from "react-router-dom";

import DaoList from "components/DaoList/DaoList";
import { IRootState } from "reducers";
import { IDaoState } from "reducers/arcReducer";

import * as arcActions from "actions/arcActions";
import * as schemas from "../../schemas";

import * as css from "./Home.scss";

interface IStateProps {
  daos: { [key: string]: IDaoState };
  daosLoaded: boolean;
}

const mapStateToProps = (state: IRootState, ownProps: any) => ({
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

class HomeContainer extends React.Component<IProps, null> {

  public render() {
    const { daos, daosLoaded, getDAOs } = this.props;

    return (
      <div className={css.homeWrapper}>
        <DaoList daos={daos} daosLoaded={daosLoaded} getDAOs={getDAOs} />
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HomeContainer);
