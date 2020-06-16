import { DAO, IDAOState, AnyPlugin, IPluginState, Plugin } from "@daostack/arc.js";
import { enableWalletProvider, getArc } from "arc";
import classNames from "classnames";
import Loading from "components/Shared/Loading";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import UnknownPluginCard from "components/Dao/UnknownPluginCard";
import Analytics from "lib/analytics";
import { getPluginIsActive, KNOWN_PLUGIN_NAMES, PROPOSAL_PLUGIN_NAMES } from "lib/pluginUtils";
import { Page } from "pages";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { RouteComponentProps } from "react-router-dom";
import * as Sticky from "react-stickynode";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { showNotification } from "reducers/notifications";
import { connect } from "react-redux";
import { combineLatest, Observable, of } from "rxjs";
import { mergeMap } from "rxjs/operators";
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

interface IDispatchProps {
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  showNotification,
};

type IExternalProps = {
  daoState: IDAOState;
} & RouteComponentProps<any>;

type IProps = IExternalProps & ISubscriptionProps<[AnyPlugin[], IPluginState]> & IDispatchProps;

class DaoPluginsPage extends React.Component<IProps, null> {

  public componentDidMount() {
    const { daoState } = this.props;

    Analytics.track("Page View", {
      "Page Name": Page.DAOPlugins,
      "DAO Address": daoState.address,
      "DAO Name": daoState.name,
    });
  }

  public handleNewProposal = (pluginId: string) => async (): Promise<void> => {
    const { showNotification, daoState } = this.props;
    const daoAvatarAddress = daoState.address;

    if (!await enableWalletProvider({ showNotification })) { return; }

    this.props.history.push(`/dao/${daoAvatarAddress}/plugin/${pluginId}/proposals/create/`);
  };

  public render() {
    const { daoState, data } = this.props;
    const allPlugins = data[0];

    const contributionReward = allPlugins.filter((plugin: AnyPlugin) => plugin.coreState.name === "ContributionReward");
    const knownPlugins = allPlugins.filter((plugin: AnyPlugin) => plugin.coreState.name !== "ContributionReward" && KNOWN_PLUGIN_NAMES.indexOf(plugin.coreState.name) >= 0);
    const unknownPlugins = allPlugins.filter((plugin: AnyPlugin) => KNOWN_PLUGIN_NAMES.indexOf(plugin.coreState.name) === -1 );
    const allKnownPlugins = [...contributionReward, ...knownPlugins];

    const pluginManager = data[1];
    const pluginManagerActive = pluginManager ? getPluginIsActive(pluginManager) : false;

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
          <h1>Proposal Plugins</h1>
          { pluginManager ?
            <TrainingTooltip placement="topLeft" overlay={"A small amount of ETH is necessary to submit a proposal in order to pay gas costs"}>
              <a className={
                classNames({
                  [css.addPluginButton]: true,
                  [css.disabled]: !pluginManagerActive,
                })}
              data-test-id="createProposal"
              href="#!"
              onClick={pluginManagerActive ? this.handleNewProposal(pluginManager.id) : null}
              >
                Add a Plugin
              </a>
            </TrainingTooltip>
            : ""}
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

const SubscribedDaoPluginsPage = withSubscription({
  wrappedComponent: DaoPluginsPage,
  loadingComponent: <Loading/>,
  errorComponent: (props) => <span>{props.error.message}</span>,
  checkForUpdate: [],
  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    const dao = new DAO(arc, props.daoState);

    return combineLatest(
      dao.plugins({ where: { isRegistered: true } }, { fetchAllData: true, subscribe: true }),
      // Find the SchemeFactory plugin if this dao has one
      Plugin.search(arc, {where: { dao: dao.id, name: "SchemeFactory" }}).pipe(mergeMap((plugin: Array<AnyPlugin>): Observable<IPluginState> => plugin[0] ? plugin[0].state() : of(null)))
    );
  },
});

export default connect(null, mapDispatchToProps)(SubscribedDaoPluginsPage);
