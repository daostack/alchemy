import * as React from "react";
import * as Sticky from "react-stickynode";

import { IDAOState } from "@daostack/client";
// import { WikiContainer } from "@dorgtech/daosmind";
import * as css from "./Dao.scss";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "module-container": any;
      "simple-wiki": any;
    }
  }
}

interface IProps {
  dao: IDAOState;
}

export default class DaoWiki extends React.Component<IProps, null> {
  componentDidMount() {
    // return WikiContainer.Instance;
  }

  public render(): RenderOutput {
    return (
      <div>
        <Sticky enabled top={50} innerZ={10000}>
          <div className={css.daoHistoryHeader}>Wiki</div>
        </Sticky>
        <module-container>
          <simple-wiki />
        </module-container>
      </div>
    );
  }
}
