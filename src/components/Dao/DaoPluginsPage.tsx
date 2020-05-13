import { DAO, IDAOState, AnyPlugin } from "@daostack/arc.js";
import { getArc } from "arc";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import UnknownPluginCard from "components/Dao/UnknownPluginCard";
import Analytics from "lib/analytics";
import { KNOWN_PLUGIN_NAMES, PROPOSAL_PLUGIN_NAMES } from "lib/pluginUtils";
import { Page } from "pages";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { RouteComponentProps } from "react-router-dom";
import * as Sticky from "react-stickynode";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import * as css from "./DaoPluginsPage.scss";
import ProposalPluginCard from "./ProposalPluginCard";
import SimplePluginCard from "./SimplePluginCard";

const Fade = ({ children, ...props }: any) => (
  <CSSTransition
    {...props}
    timeout={1000}
    classNames={{
      enter: css.fadeEnter,
      enterActive: css.fadeEnterActive,
      exit: css.fadeExit,
      exitActive: css.fadeExitActive,
    }}
  >
    {children}
  </CSSTransition>
);

type IExternalProps = {
  daoState: IDAOState;
} & RouteComponentProps<any>;

type IProps = IExternalProps & ISubscriptionProps<AnyPlugin[]>;

class DaoPluginsPage extends React.Component<IProps, null> {

  public componentDidMount() {
    const { daoState } = this.props;

    Analytics.track("Page View", {
      "Page Name": Page.DAOPlugins,
      "DAO Address": daoState.address,
      "DAO Name": daoState.name,
    });
  }

  public render() {
    const { daoState, data } = this.props;
    const allPlugins = data;

    const contributionReward = allPlugins.filter((plugin: AnyPlugin) => plugin.coreState.name === "ContributionReward");
    const knownPlugins = allPlugins.filter((plugin: AnyPlugin) => plugin.coreState.name !== "ContributionReward" && KNOWN_PLUGIN_NAMES.indexOf(plugin.coreState.name) >= 0);
    const unknownPlugins = allPlugins.filter((plugin: AnyPlugin) =>  KNOWN_PLUGIN_NAMES.indexOf(plugin.coreState.name) === -1 );
    const allKnownPlugins = [...contributionReward, ...knownPlugins];

    const pluginCardsHTML = (
      <TransitionGroup>
        { allKnownPlugins.map((plugin: AnyPlugin) => (
          <Fade key={"plugin " + plugin.id}>
            {PROPOSAL_PLUGIN_NAMES.includes(plugin.coreState.name)
              ?
              <ProposalPluginCard daoState={daoState} pluginState={plugin.coreState} />
              : <SimplePluginCard daoState={daoState} pluginState={plugin.coreState} />
            }
          </Fade>
        ))
        }

        {!unknownPlugins ? "" :
          <Fade key={"plugins unknown"}>
            <UnknownPluginCard plugins={unknownPlugins} />
          </Fade>
        }
      </TransitionGroup>
    );

    return (
      <div className={css.wrapper}>
        <BreadcrumbsItem to={"/dao/" + daoState.address}>{daoState.name}</BreadcrumbsItem>

        <Sticky enabled top={50} innerZ={10000}>
          <h1>All Plugins</h1>
        </Sticky>
        {(allKnownPlugins.length + unknownPlugins.length) === 0
          ? <div>
            <img src="/assets/images/meditate.svg" />
            <div>
              No plugins registered
            </div>
          </div>
          :
          <div className={css.allPlugins}>{pluginCardsHTML}</div>
        }
      </div>
    );
  }
}

export default withSubscription({
  wrappedComponent: DaoPluginsPage,
  loadingComponent: <Loading/>,
  errorComponent: (props) => <span>{props.error.message}</span>,
  checkForUpdate: [],
  createObservable: (props: IExternalProps) => {
    const dao = new DAO(getArc(), props.daoState);
    return dao.plugins({ where: { isRegistered: true } }, { fetchAllData: true, subscribe: true });
  },
});
