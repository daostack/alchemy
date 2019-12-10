import * as React from "react";
import * as Sticky from "react-stickynode";

import { IDAOState } from "@daostack/client";
import * as css from "./Dao.scss";

interface IProps {
  dao: IDAOState;
}

export default class DaoWiki extends React.Component<IProps, null> {
  public render(): RenderOutput {
    // const dao = this.props.dao;
    return (
      <Sticky enabled top={50} innerZ={10000}>
        <div className={css.daoHistoryHeader}>Wiki</div>
      </Sticky>
    );
  }
}
