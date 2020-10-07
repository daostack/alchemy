import { IDAOState, Address } from "@daostack/arc.js";
import * as React from "react";
import * as css from "./DaoLandingPage.scss";
import { Page } from "pages";
import Analytics from "lib/analytics";
import { Link } from "react-router-dom";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { showSimpleMessage, targetedNetwork } from "lib/util";
import customDaoInfo from "../../customDaoInfo";
import i18next from "i18next";
import ThreeBoxThreads from "components/Shared/ThreeBoxThreads";

type IExternalProps = {
  daoState: IDAOState;
  currentAccountAddress: Address;
};

type IProps = IExternalProps;

export default class DaoLandingPage extends React.Component<IProps> {

  constructor(props: IProps) {
    super(props);
  }

  public async componentDidMount(): Promise<void> {
    Analytics.track("Page View", {
      "Page Name": Page.DAOLanding,
      "DAO Address": this.props.daoState.id,
      "DAO Name": this.props.daoState.name,
    });
  }

  private handleEditContent = () => {
    showSimpleMessage(
      {
        title: i18next.t("Edit Home Page"),
        body:
          <>
            <div>Editing the content on this DAO’s home page will soon be possible via proposal. Stay tuned!</div>
            <div>For now, if you need a change made to a DAO’s home page content, please contact us at <a href="https://support@daostack.zendesk.com" target="_blank" rel="noopener noreferrer">support@daostack.zendesk.com</a></div>
          </>,
      }
    );
  }

  public render(): JSX.Element {
    const daoState = this.props.daoState;
    const customData = customDaoInfo[targetedNetwork()]?.[daoState.id.toLowerCase()];

    return (
      <div className={css.landingPage}>

        <BreadcrumbsItem to={"/dao/" + daoState.address}>{daoState.name}</BreadcrumbsItem>

        <div className={css.infoContainer}>
          <div className={css.titleContainer}>
            <div className={css.row}>
              <div className={css.headerText}>{daoState.name}</div>
              <div className={css.editButton}>
                <button onClick={this.handleEditContent}>{i18next.t("Edit Home Page")}</button>
              </div>
            </div>
          </div>

          {customData ?
            <>{customData}</>
            :
            <>
              <div>Welcome to {daoState.name}, a decentralized organization built on DAOstack.</div>
              <div>Visit the <Link to={`/dao/${daoState.id}/plugins/`}>Proposals page</Link> to
                make a proposal to the DAO or vote on existing proposals.</div>
            </>
          }

        </div>
        <div className={css.threadsContainer}>
          <div className={css.headerText}>Discuss {daoState.name}</div>
          <ThreeBoxThreads threadId={daoState.id} daoState={daoState} currentAccountAddress={this.props.currentAccountAddress}></ThreeBoxThreads>
        </div>
      </div>
    );
  }
}
