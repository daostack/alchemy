import * as React from "react";
import * as Sticky from "react-stickynode";
import * as css from "./Dao.scss";
import { WikiContainer } from "@dorgtech/daoswiki";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "module-container": any;
      "simple-wiki": any;
    }
  }
}

interface IProps {
  dao: any;
}
export default class DaoWiki extends React.Component<IProps> {
  constructor(props: IProps) {
    super(props);
    new WikiContainer();
  }
  public render(): RenderOutput {
    return (
      <module-container>
        <Sticky enabled top={50} innerZ={10000}>
          <div className={css.daoHistoryHeader}>Wiki</div>
        </Sticky>
        <simple-wiki />
      </module-container>
    );
  }
}
