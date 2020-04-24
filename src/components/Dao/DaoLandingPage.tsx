import axios, { AxiosResponse } from "axios";
import { IDAOState } from "@daostack/client";
import * as React from "react";
import * as css from "./DaoLandingPage.scss";
import { Page } from "pages";
import Analytics from "lib/analytics";
import { Link } from "react-router-dom";
import DaoDiscussionPage from "./DaoDiscussionPage";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { of, from } from "rxjs";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import classNames from "classnames";
import FollowButton from "components/Shared/FollowButton";

type IExternalProps = {
  daoState: IDAOState;
};

interface IHasNewPosts {
  hasNewPosts: boolean;
}

type IProps = IExternalProps & ISubscriptionProps<IHasNewPosts>;

class DaoLandingPage extends React.Component<IProps, null> {

  public componentDidMount() {
    Analytics.track("Page View", {
      "Page Name": Page.DAOLanding,
      "DAO Address": this.props.daoState.id,
      "DAO Name": this.props.daoState.name,
    });
  }

  public render() {
    const daoState = this.props.daoState;
    const hasNewPosts = this.props.data;

    return (
      <div className={css.landingPage}>

        <BreadcrumbsItem to={"/dao/" + daoState.address}>{daoState.name}</BreadcrumbsItem>

        <div className={css.infoContainer}>
          <div className={css.titleContainer}>
            <div className={css.row}>
              <div className={css.headerText}>{daoState.name}</div>
              <div className={css.followButton}><FollowButton id={daoState.id} type="daos" style="bigButton" /></div>
            </div>
          </div>

          <div className={css.welcome}>Welcome to {daoState.name}, a decentralized organization built on DAOstack.</div>

          {
            // <div className={css.infoContainer}>
            //   <div className={css.members}>
            //     <div className={css.count}>{daoState.memberCount || "0"}</div>
            //     <div className={css.body}>Members</div>
            //   </div>
            //   <div className={css.proposals}>
            //     <div className={css.count}>{daoState.numberOfQueuedProposals+ daoState.numberOfBoostedProposals + daoState.numberOfPreBoostedProposals}</div>
            //     <div className={css.body}>Open Proposals</div>
            //   </div>
            // </div>
          }

          <div className={css.visitProposals}>Visit the <Link to={`/dao/${daoState.id}/schemes/`}>Proposals page</Link> to
          make a proposal to the DAO or vote on existing proposals.</div>
        </div>

        <div className={css.wallContainer}>
          <div className={css.headerText}>
            <span className={
              classNames({
                [css.hasNewDiscussions]: true,
                [css.red]: hasNewPosts,
              })}></span>Discuss {daoState.name}
          </div>

          <DaoDiscussionPage dao={daoState} />
        </div>

      </div>

    );
  }
}

export default withSubscription({
  wrappedComponent: DaoLandingPage,
  checkForUpdate: [],
  loadingComponent: <div></div>,
  createObservable: (props: IProps) => {
    const daoAddress = props.daoState.address;
    if (daoAddress) {
      const lastAccessDate = localStorage.getItem(`daoWallEntryDate_${daoAddress}`) || "0";

      const promise = axios.get(`https://disqus.com/api/3.0/threads/listPosts.json?api_key=KVISHbDLtTycaGw5eoR8aQpBYN8bcVixONCXifYcih5CXanTLq0PpLh2cGPBkM4v&forum=${process.env.DISQUS_SITE}&thread:ident=${daoAddress}&since=${lastAccessDate}&limit=1&order=asc`)
        .then((response: AxiosResponse<any>): IHasNewPosts => {
          if (response.status) {
            const posts = response.data.response;
            return { hasNewPosts: posts && posts.length };
          } else {
            // eslint-disable-next-line no-console
            console.error(`request for disqus posts failed: ${response.statusText}`);
            return { hasNewPosts: false };
          }
        })
        .catch((error: Error): IHasNewPosts => {
          // eslint-disable-next-line no-console
          console.error(`request for disqus posts failed: ${error.message}`);
          return { hasNewPosts: false };
        });

      return from(promise);
    } else {
      return of(null);
    }
  },
});
