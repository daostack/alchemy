import { History } from "history";
import { first, filter, toArray, mergeMap } from "rxjs/operators";
import { Address, AnyPlugin, DAO, IProposalStage, IDAOState, IPluginState, IProposalState, IProposalOutcome, IContributionRewardExtState, ISchemeRegistrarState, Plugin } from "@daostack/arc.js";
import { getArc } from "arc";
import classNames from "classnames";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { pluginName, getPluginIsActive, PROPOSAL_PLUGIN_NAMES } from "lib/pluginUtils";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Helmet } from "react-helmet";
import { Link, Route, RouteComponentProps, Switch } from "react-router-dom";
import * as Sticky from "react-stickynode";
import { showNotification } from "reducers/notifications";
import { IRootState } from "reducers";
import { connect } from "react-redux";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import { combineLatest, Observable, of } from "rxjs";
import { ICrxRewarderProps, getCrxRewarderProps, hasRewarderContract, CrxRewarderComponentType, getCrxRewarderComponent } from "components/Plugin/ContributionRewardExtRewarders/rewardersProps";
import ReputationFromToken from "./ReputationFromToken";
import PluginInfoPage from "./PluginInfoPage";
import PluginProposalsPage from "./PluginProposalsPage";
import PluginOpenBountyPage from "./PluginOpenBountyPage";
import * as css from "./Plugin.scss";

interface IDispatchProps {
  showNotification: typeof showNotification;
}

interface IExternalProps extends RouteComponentProps<any> {
  currentAccountAddress: Address;
  history: History;
  daoState: IDAOState;
  pluginRegistrar: ISchemeRegistrarState;
}

interface IExternalState {
  pluginId: Address;
}

interface IState {
  crxListComponent: any;
  crxRewarderProps: ICrxRewarderProps;
}

type IProps = IExternalProps & IDispatchProps & IExternalState & ISubscriptionProps<[IPluginState, IPluginState, Array<IProposalState>]>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IExternalState => {
  const match = ownProps.match;

  return {
    ...ownProps,
    pluginId: match.params.pluginId,
  };
};

const mapDispatchToProps = {
  showNotification,
};

class PluginContainer extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    this.state = {
      crxListComponent: null,
      crxRewarderProps: null,
    };
  }

  private pluginInfoPageHtml = (props: any) => <PluginInfoPage {...props} daoState={this.props.daoState} plugin={this.props.data[0]} pluginRegistrar={this.props.data[1]} />;
  private pluginProposalsPageHtml = (isActive: boolean, crxRewarderProps: ICrxRewarderProps) => (props: any) => <PluginProposalsPage {...props} isActive={isActive} daoState={this.props.daoState} currentAccountAddress={this.props.currentAccountAddress} pluginState={this.props.data[0]} crxRewarderProps={crxRewarderProps} />;
  private contributionsRewardExtTabHtml = () => (props: any) =>
  {
    if (!this.state.crxListComponent) {
      return null;
    }

    return <this.state.crxListComponent {...props} daoState={this.props.daoState} plugin={this.props.data[0]} proposals={this.props.data[2]} />;
  };

  public async componentDidMount() {

    const newState = {};

    if (!this.state.crxRewarderProps) {
      Object.assign(newState, { crxRewarderProps: await getCrxRewarderProps(this.props.data[0] as IContributionRewardExtState) } );
    }

    if (!this.state.crxListComponent) {
      Object.assign(newState, {
        crxListComponent: await getCrxRewarderComponent(
          this.props.data[0] as IContributionRewardExtState,
          CrxRewarderComponentType.List
        )
      });
    }

    this.setState(newState);
  }

  public render(): RenderOutput {
    const { pluginId, daoState } = this.props;
    const daoAvatarAddress = daoState.address;
    const pluginState = this.props.data[0];
    const approvedProposals = this.props.data[2];

    if (pluginState.name === "ReputationFromToken") {
      return <ReputationFromToken {...this.props} daoAvatarAddress={daoAvatarAddress} pluginState={pluginState} />;
    }

    const isActive = getPluginIsActive(pluginState);
    const isProposalPlugin = PROPOSAL_PLUGIN_NAMES.includes(pluginState.name);

    const proposalsTabClass = classNames({
      [css.proposals]: true,
      [css.active]: isProposalPlugin && !this.props.location.pathname.includes("info") && !this.props.location.pathname.includes("crx") && !this.props.location.pathname.includes("open"),
    });
    const infoTabClass = classNames({
      [css.info]: true,
      [css.active]: !isProposalPlugin || this.props.location.pathname.includes("info"),
    });
    const openBountiesTabClass = classNames({
      [css.openbounty]: true,
      [css.active]: this.props.location.pathname.includes("openbounties"),
    });

    const crxTabClass = classNames({
      [css.crx]: true,
      [css.active]: this.props.location.pathname.includes("crx"),
    });
    const pluginFriendlyName = pluginName(pluginState, pluginState.address);

    return (
      <div className={css.pluginContainer}>

        <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/plugin/${pluginId}`}>{pluginFriendlyName}</BreadcrumbsItem>
        <Helmet>
          <meta name="description" content={daoState.name + " | " + pluginState.name + " proposals | Managed on Alchemy by DAOstack"} />
          <meta name="og:description" content={daoState.name + " | " + pluginState.name + " proposals | Managed on Alchemy by DAOstack"} />
          <meta name="twitter:description" content={daoState.name + " | " + pluginState.name + " proposals | Managed on Alchemy by DAOstack"} />
        </Helmet>

        <Sticky enabled top={50} innerZ={10000}>
          <h2 className={css.pluginName}>
            {pluginFriendlyName}
          </h2>

          <div className={css.pluginMenu}>
            {isProposalPlugin
              ? <Link className={proposalsTabClass} to={`/dao/${daoAvatarAddress}/plugin/${pluginId}/proposals/`}>Proposals</Link>
              : ""}

            { // if Bounties Plugin, create new tab
              (pluginName(pluginState, pluginState.address) === "Standard Bounties") &&
              <Link className={openBountiesTabClass} to={`/dao/${daoAvatarAddress}/plugin/${pluginId}/openbounties/`}>Open Bounties</Link>
            }

            <TrainingTooltip placement="top" overlay={"Learn about the protocol parameters for this plugin"}>
              <Link className={infoTabClass} to={`/dao/${daoAvatarAddress}/plugin/${pluginId}/info/`}>Information</Link>
            </TrainingTooltip>
            {
              this.state.crxRewarderProps ?
                <TrainingTooltip placement="top" overlay={this.state.crxRewarderProps.shortDescription}>
                  <Link className={crxTabClass} to={`/dao/${daoAvatarAddress}/plugin/${pluginId}/crx/`}>{this.state.crxRewarderProps.friendlyName} ({approvedProposals.length})</Link>
                </TrainingTooltip>
                : ""
            }
          </div>
        </Sticky>

        <Switch>

          <Route exact path="/dao/:daoAvatarAddress/plugin/:pluginId/openbounties"
            render={(props) => <PluginOpenBountyPage {...props} daoAvatarAddress={daoAvatarAddress} plugin={pluginState} />} />
          <Route exact path="/dao/:daoAvatarAddress/plugin/:pluginId/info" render={this.pluginInfoPageHtml} />
          {
            this.state.crxRewarderProps ?
              <Route exact path="/dao/:daoAvatarAddress/plugin/:pluginId/crx" render={this.contributionsRewardExtTabHtml()} />
              : ""
          }
          <Route path="/dao/:daoAvatarAddress/plugin/:pluginId" render={isProposalPlugin ? this.pluginProposalsPageHtml(isActive, this.state.crxRewarderProps) : this.pluginInfoPageHtml} />
        </Switch>
      </div>
    );
  }
}

const SubscribedPluginContainer = withSubscription({
  wrappedComponent: PluginContainer,
  loadingComponent: <Loading/>,
  errorComponent: null,
  checkForUpdate: ["pluginId"],
  createObservable: async (props: IProps) => {
    const arc = getArc();
    const plugins = await arc.plugins({ where: { id: props.pluginId } }).pipe(first()).toPromise();

    if (!plugins || plugins.length === 0) {
      throw Error(`Plugin not found. ID: ${props.pluginId}`);
    }

    const plugin = plugins[0];

    // TODO: this may NOT be the best place to do this - we'd like to do this higher up
    // why are we doing this for all plugins and not just the plugin we care about here?
    const dao = new DAO(arc, props.daoState);
    await dao.proposals(
      // eslint-disable-next-line @typescript-eslint/camelcase
      {where: { stage_in: [IProposalStage.Boosted, IProposalStage.QuietEndingPeriod, IProposalStage.Queued, IProposalStage.PreBoosted, IProposalStage.Executed ]}},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      { fetchAllData: true, subscribe: true }).subscribe(() => {});
    // end cache priming

    const pluginState = await plugin.fetchState();
    /**
     * hack alert.  These approved proposals are for the Competition plugin.
     * Doesn't smell right to be doing Competition-specific stuff in the
     * context of this component.
     * However, it seems likely that this could be needed by other CrExt rewarder
     * contracts that might come along.
     */
    let  approvedProposals: Observable<Array<IProposalState>>;
    if (hasRewarderContract(pluginState as IContributionRewardExtState)) {
      approvedProposals = dao.proposals(
        // eslint-disable-next-line @typescript-eslint/camelcase
        { where: { plugin: plugin.id, stage_in: [IProposalStage.Executed]},
          orderBy: "closingAt",
          orderDirection: "desc",
        },
        { subscribe: true, fetchAllData: true })
        .pipe(
          // work on each array individually so that toArray can perceive closure on the stream of items in the array
          mergeMap(proposals => of(proposals).pipe(
            mergeMap(proposals => proposals),
            mergeMap(proposal => proposal.state({}).pipe(first())),
            filter((proposal: IProposalState) => proposal.winningOutcome === IProposalOutcome.Pass ),
            toArray())
          )
        );
    } else {
      approvedProposals = of([]);
    }

    return combineLatest(
      of(pluginState),
      // Find the SchemeRegistrar plugin if this dao has one
      Plugin.search(arc, {where: { dao: props.daoState.id, name: "SchemeRegistrar" }}).pipe(mergeMap((plugin: Array<AnyPlugin>): Observable<IPluginState> => plugin[0] ? plugin[0].state() : of(null))),
      approvedProposals
    );
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedPluginContainer);
