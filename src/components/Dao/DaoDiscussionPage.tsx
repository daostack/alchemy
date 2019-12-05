import { IDAOState } from "@daostack/client";
import { DiscussionEmbed } from "disqus-react";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as css from "./Dao.scss";

import moment = require("moment");

interface IProps {
  dao: IDAOState;
}

export default class DaoDiscussionPage extends React.Component<IProps, null> {

  public async componentDidMount() {
    localStorage.setItem(`daoWallEntryDate_${this.props.dao.address}`, moment().toISOString());
  }

  public render(): RenderOutput {
    const dao = this.props.dao;

    const disqusConfig = {
      url: process.env.BASE_URL + "/dao/" + dao.address + "/discussion",
      identifier: dao.address,
      title: "Discuss " + dao.name,
    };

    return(
      <div>
        <BreadcrumbsItem to={"/dao/" + dao.address + "/discussion"}>Discussion</BreadcrumbsItem>

        <div>
          <div className={css.daoHistoryHeader}>
            Discuss {dao.name}
          </div>
        </div>

        <div className={css.discussionContainer}>
          <DiscussionEmbed shortname={process.env.DISQUS_SITE} config={disqusConfig}/>
        </div>
      </div>
    );
  }
}
