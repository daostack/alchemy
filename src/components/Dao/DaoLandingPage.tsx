import { IDAOState } from "@daostack/client";
import * as React from "react";
import * as css from "./DaoLandingPage.scss";
import { Page } from "pages";
import Analytics from "lib/analytics";
import { Link } from "react-router-dom";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { DiscussionEmbed } from "disqus-react";

type IExternalProps = {
  daoState: IDAOState;
};

// interface IHasNewPosts {
//   hasNewPosts: boolean;
// }

type IProps = IExternalProps;

export default class DaoLandingPage extends React.Component<IProps, null> {

  public componentDidMount() {
    Analytics.track("Page View", {
      "Page Name": Page.DAOLanding,
      "DAO Address": this.props.daoState.id,
      "DAO Name": this.props.daoState.name,
    });
  }

  private editLandingPageContent = () => {
    alert("Stay Tuned!");
  }

  public render() {
    const daoState = this.props.daoState;

    const disqusConfig = {
      url: process.env.BASE_URL + "/dao/" + daoState.address + "/discussion",
      identifier: daoState.address,
      title: "Discuss " + daoState.name,
    };

    return (
      <div className={css.landingPage}>

        <BreadcrumbsItem to={"/dao/" + daoState.address}>{daoState.name}</BreadcrumbsItem>

        <div className={css.infoContainer}>
          <div className={css.titleContainer}>
            <div className={css.row}>
              <div className={css.headerText}>{daoState.name}</div>
              <div className={css.editButton}>
                <button onClick={this.editLandingPageContent}>Edit Home Page</button>
              </div>
            </div>
          </div>

          <div className={css.welcome}>Welcome to {daoState.name}, a decentralized organization built on DAOstack.</div>

          <div className={css.visitProposals}>Visit the <Link to={`/dao/${daoState.id}/schemes/`}>Proposals page</Link> to
          make a proposal to the DAO or vote on existing proposals.</div>
        </div>

        <div className={css.wallContainer}>
          <div className={css.headerText}>
            {
            // <span className={
            //   classNames({
            //     [css.hasNewDiscussions]: true,
            //     [css.red]: hasNewPosts,
            //   })}></span>
            }
              Discuss {daoState.name}
          </div>

          <DiscussionEmbed shortname={process.env.DISQUS_SITE} config={disqusConfig} />
        </div>

        <div className={css.editHomePagePopup}></div>
      </div>

    );
  }
}

// export default withSubscription({
//   wrappedComponent: DaoLandingPage,
//   checkForUpdate: [],
//   loadingComponent: <div></div>,
//   createObservable: (props: IProps) => {
//     const daoAddress = props.daoState.address;
//     if (daoAddress) {
//       const lastAccessDate = localStorage.getItem(`daoWallEntryDate_${daoAddress}`) || "0";

//       const promise = axios.get(`https://disqus.com/api/3.0/threads/listPosts.json?api_key=KVISHbDLtTycaGw5eoR8aQpBYN8bcVixONCXifYcih5CXanTLq0PpLh2cGPBkM4v&forum=${process.env.DISQUS_SITE}&thread:ident=${daoAddress}&since=${lastAccessDate}&limit=1&order=asc`)
//         .then((response: AxiosResponse<any>): IHasNewPosts => {
//           if (response.status) {
//             const posts = response.data.response;
//             return { hasNewPosts: posts && posts.length };
//           } else {
//             // eslint-disable-next-line no-console
//             console.error(`request for disqus posts failed: ${response.statusText}`);
//             return { hasNewPosts: false };
//           }
//         })
//         .catch((error: Error): IHasNewPosts => {
//           // eslint-disable-next-line no-console
//           console.error(`request for disqus posts failed: ${error.message}`);
//           return { hasNewPosts: false };
//         });

//       return from(promise);
//     } else {
//       return of(null);
//     }
//   },
// });
