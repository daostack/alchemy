import { IDAOState } from "@daostack/arc.js";
import * as React from "react";
import * as css from "./DaoLandingPage.scss";
import { Page } from "pages";
import Analytics from "lib/analytics";
import { Link } from "react-router-dom";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { DiscussionEmbed } from "disqus-react";
import { showSimpleMessage } from 'lib/util';

type IExternalProps = {
  daoState: IDAOState;
};

type IProps = IExternalProps;

export default class DaoLandingPage extends React.Component<IProps, null> {

  private disqusConfig: any;

  public componentDidMount() {
    this.disqusConfig = {
      url: process.env.BASE_URL + "/dao/" + this.props.daoState.address + "/discussion",
      identifier: this.props.daoState.address,
      title: "Discuss " + this.props.daoState.name,
    };

    Analytics.track("Page View", {
      "Page Name": Page.DAOLanding,
      "DAO Address": this.props.daoState.id,
      "DAO Name": this.props.daoState.name,
    });
  }

  private handleEditContent = () => {
    showSimpleMessage(
      {
        title: "Edit Home Page",
        body:
          <>
            <div>Editing the content on this DAO’s home page will soon be possible via proposal. Stay tuned!</div>
            <div>For now, if you need a change made to a DAO’s home page content, please contact us at <a href="https://support@daostack.zendesk.com" target="_blank" rel="noopener noreferrer">support@daostack.zendesk.com</a></div>
          </>
      }
    );
  }

  public render() {
    const daoState = this.props.daoState;

    return (
      <div className={css.landingPage}>

        <BreadcrumbsItem to={"/dao/" + daoState.address}>{daoState.name}</BreadcrumbsItem>

        <div className={css.infoContainer}>
          <div className={css.titleContainer}>
            <div className={css.row}>
              <div className={css.headerText}>{daoState.name}</div>
              <div className={css.editButton}>
                <button onClick={this.handleEditContent}>Edit Home Page</button>
              </div>
            </div>
          </div>

          <div className={css.welcome}>Welcome to {daoState.name}, a decentralized organization built on DAOstack.</div>

          <div className={css.visitProposals}>Visit the <Link to={`/dao/${daoState.id}/schemes/`}>Proposals page</Link> to
          make a proposal to the DAO or vote on existing proposals.</div>
        </div>

        <div className={css.wallContainer}>
          <div className={css.headerText}>Discuss {daoState.name}</div>
          <DiscussionEmbed shortname={process.env.DISQUS_SITE} config={this.disqusConfig} />
        </div>
      </div>
    );
  }
}
