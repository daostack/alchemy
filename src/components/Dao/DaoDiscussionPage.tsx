import { IDAOState } from "@daostack/client";
import { DiscussionEmbed } from "disqus-react";
import * as React from "react";
import * as css from "./DaoLandingPage.scss";

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

    return (
      <div className={css.discussionContainer}>
        <DiscussionEmbed shortname={process.env.DISQUS_SITE} config={disqusConfig}/>
      </div>
    );
  }
}
