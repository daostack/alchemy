import * as React from "react";
import * as Sticky from "react-stickynode";

import { IDAOState } from "@daostack/client";
import { WikiContainer, actualHash } from "@dorgtech/daosmind";
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
  match: any;
}

export default class DaoWiki extends React.Component<IProps, null> {
  componentDidMount() {
    const { daoAvatarAddress, perspectiveId, pageId } = this.props.match.params
    actualHash['dao'] = daoAvatarAddress
    actualHash['wiki'] = perspectiveId
    actualHash['page'] = pageId
    return WikiContainer.getInstance({});
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
