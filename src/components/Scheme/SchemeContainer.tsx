import { History } from "history";
import { first, filter, toArray, mergeMap } from "rxjs/operators";
import { Address, CompetitionScheme, IProposalStage, IDAOState, ISchemeState, IProposalState, IProposalOutcome, Scheme } from "@daostack/arc.js";
import { getArc, enableWalletProvider } from "arc";
import classNames from "classnames";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { schemeName, getSchemeIsActive, PROPOSAL_SCHEME_NAMES } from "lib/schemeUtils";
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
import { ICrxRewarderProps, getCrxRewarderProps, hasRewarderContract, CrxRewarderComponentType, getCrxRewarderComponent } from "components/Scheme/ContributionRewardExtRewarders/rewardersProps";
import ReputationFromToken from "./ReputationFromToken";
import SchemeInfoPage from "./SchemeInfoPage";
import SchemeProposalsPage from "./SchemeProposalsPage";
import SchemeOpenBountyPage from "./SchemeOpenBountyPage";
import * as css from "./Scheme.scss";
import { standardPolling } from "lib/util";

interface IDispatchProps {
  showNotification: typeof showNotification;
}

interface IExternalProps extends RouteComponentProps<any> {
  currentAccountAddress: Address;
  history: History;
  daoState: IDAOState;
  schemeManager: ISchemeState;
}

interface IExternalState {
  schemeId: Address;
}

interface IState {
  crxListComponent: any;
  crxRewarderProps: ICrxRewarderProps;
}

type IProps = IExternalProps & IDispatchProps & IExternalState & ISubscriptionProps<[ISchemeState, ISchemeState, Array<IProposalState>]>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IExternalState => {
  const match = ownProps.match;

  return {
    ...ownProps,
    schemeId: match.params.schemeId,
  };
};

const mapDispatchToProps = {
  showNotification,
};

class SchemeContainer extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    this.state = {
      crxListComponent: null,
      crxRewarderProps: null,
    };
  }

  private schemeInfoPageHtml = (props: any) => <SchemeInfoPage {...props} daoState={this.props.daoState} scheme={this.props.data[0]} schemeManager={this.props.data[1]} />;
  private schemeProposalsPageHtml = (isActive: boolean, crxRewarderProps: ICrxRewarderProps) => (props: any) =>
    <SchemeProposalsPage {...props}
      /**
       * Warning: since `props` is declared here as `any`, any missing attributes on `SchemeProposalsPage`
       * will not be caught by the compiler.
       */
      daoState={this.props.daoState}
      currentAccountAddress={this.props.currentAccountAddress}
      scheme={this.props.data[0]} crxRewarderProps={crxRewarderProps} />;
  private contributionsRewardExtTabHtml = () => (props: any) => {
    if (!this.state.crxListComponent) {
      return null;
    }

    return <this.state.crxListComponent {...props} daoState={this.props.daoState} scheme={this.props.data[0]} proposals={this.props.data[2]} />;
  };

  public async componentDidMount() {

    const newState = {};

    if (!this.state.crxRewarderProps) {
      Object.assign(newState, { crxRewarderProps: await getCrxRewarderProps(this.props.data[0]) });
    }

    if (!this.state.crxListComponent) {
      Object.assign(newState, { crxListComponent: await getCrxRewarderComponent(this.props.data[0], CrxRewarderComponentType.List) });
    }

    this.setState(newState);
  }

  private handleNewProposal = async (e: any): Promise<void> => {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    this.props.history.push(`/dao/${this.props.daoState.address}/scheme/${this.props.schemeId}/proposals/create/`);

    e.preventDefault();
  };

  private handleEditPlugin = async (e: any) => {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    this.props.history.push(`/dao/${this.props.daoState.id}/scheme/${this.props.data[1].id}/proposals/create/?currentTab=editScheme`);
    e.preventDefault();
  }


  public render(): RenderOutput {
    const { schemeId, daoState } = this.props;
    const daoAvatarAddress = daoState.address;
    const schemeState = this.props.data[0];
    const approvedProposals = this.props.data[2];
    const isActive = getSchemeIsActive(schemeState);
    const isProposalScheme = PROPOSAL_SCHEME_NAMES.includes(schemeState.name);
    const isBountyScheme = schemeName(schemeState, schemeState.address) === "Standard Bounties";
    // checking the special case here where the information tab is the default
    const inInfoTab = this.props.location.pathname.match(/info\/*$/i) || !(isProposalScheme || isBountyScheme || this.state.crxRewarderProps);

    if (schemeState.name === "ReputationFromToken") {
      return <ReputationFromToken {...this.props} daoAvatarAddress={daoAvatarAddress} schemeState={schemeState} />;
    }

    const proposalsTabClass = classNames({
      [css.proposals]: true,
      [css.active]: isProposalScheme && !inInfoTab && !this.props.location.pathname.includes("crx") && !this.props.location.pathname.includes("open"),
    });
    const infoTabClass = classNames({
      [css.info]: true,
      [css.active]: !isProposalScheme || inInfoTab,
    });
    const openBountiesTabClass = classNames({
      [css.openbounty]: true,
      [css.active]: this.props.location.pathname.includes("openbounties"),
    });

    const crxTabClass = classNames({
      [css.crx]: true,
      [css.active]: this.props.location.pathname.includes("crx"),
    });
    const schemeFriendlyName = schemeName(schemeState, schemeState.address);

    return (
      <div className={css.schemeContainer}>

        <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/scheme/${schemeId}`}>{schemeFriendlyName}</BreadcrumbsItem>
        <Helmet>
          <meta name="description" content={daoState.name + " | " + schemeState.name + " proposals | Managed on Alchemy by DAOstack"} />
          <meta name="og:description" content={daoState.name + " | " + schemeState.name + " proposals | Managed on Alchemy by DAOstack"} />
          <meta name="twitter:description" content={daoState.name + " | " + schemeState.name + " proposals | Managed on Alchemy by DAOstack"} />
        </Helmet>

        <Sticky enabled top={50} innerZ={10000}>
          <h2 className={css.schemeName}>
            {schemeFriendlyName}
          </h2>

          <div className={css.schemeMenu}>

            <div className={css.row}>
              <div className={css.tabs}>

                { // Proposals tab
                  isProposalScheme ?
                    <Link className={proposalsTabClass} to={`/dao/${daoAvatarAddress}/scheme/${schemeId}/proposals/`}>Proposals</Link>
                    : ""}

                { // Information tab
                  <TrainingTooltip placement="top" overlay={"Learn about the protocol parameters for this scheme"}>
                    <Link className={infoTabClass} to={`/dao/${daoAvatarAddress}/scheme/${schemeId}/info/`}>Information</Link>
                  </TrainingTooltip>
                }

                { // Standard Bounties scheme tab
                  isBountyScheme ?
                    <Link className={openBountiesTabClass} to={`/dao/${daoAvatarAddress}/scheme/${schemeId}/openbounties/`}>Open Bounties</Link>
                    : ""
                }

                { // Competition scheme tab
                  this.state.crxRewarderProps ?
                    <TrainingTooltip placement="top" overlay={this.state.crxRewarderProps.shortDescription}>
                      <Link className={crxTabClass} to={`/dao/${daoAvatarAddress}/scheme/${schemeId}/crx/`}>{this.state.crxRewarderProps.friendlyName} ({approvedProposals.length})</Link>
                    </TrainingTooltip>
                    : ""
                }
              </div>

              {isProposalScheme ?
                inInfoTab ?
                  <div className={css.editPlugin}>
                    <TrainingTooltip placement="topRight" overlay={"A small amount of ETH is necessary to submit a proposal in order to pay gas costs"}>
                      <a
                        data-test-id="createProposal"
                        href="#!"
                        onClick={this.handleEditPlugin}
                      >
                        Edit Plugin
                      </a>
                    </TrainingTooltip>
                  </div>
                  :
                  <div className={css.createProposal}>
                    <TrainingTooltip placement="topRight" overlay={"A small amount of ETH is necessary to submit a proposal in order to pay gas costs"}>
                      <a className={
                        classNames({
                          [css.disabled]: !isActive,
                        })}
                      data-test-id="createProposal"
                      href="#!"
                      onClick={isActive ? this.handleNewProposal : null}
                      >
                        + New Proposal</a>
                    </TrainingTooltip>
                  </div>
                : ""
              }
            </div>
          </div>
        </Sticky>

        <Switch>

          <Route exact path="/dao/:daoAvatarAddress/scheme/:schemeId/openbounties"
            render={(props) => <SchemeOpenBountyPage {...props} daoAvatarAddress={daoAvatarAddress} scheme={schemeState} />} />
          <Route exact path="/dao/:daoAvatarAddress/scheme/:schemeId/info" render={this.schemeInfoPageHtml} />
          {
            this.state.crxRewarderProps ?
              <Route exact path="/dao/:daoAvatarAddress/scheme/:schemeId/crx" render={this.contributionsRewardExtTabHtml()} />
              : ""
          }
          <Route path="/dao/:daoAvatarAddress/scheme/:schemeId" render={isProposalScheme ? this.schemeProposalsPageHtml(isActive, this.state.crxRewarderProps) : this.schemeInfoPageHtml} />
        </Switch>
      </div>
    );
  }
}

const SubscribedSchemeContainer = withSubscription({
  wrappedComponent: SchemeContainer,
  loadingComponent: <Loading />,
  errorComponent: null,
  checkForUpdate: ["schemeId"],
  createObservable: async (props: IProps) => {
    const arc = getArc();
    const scheme = arc.scheme(props.schemeId) as any;

    // TODO: this may NOT be the best place to do this - we'd like to do this higher up
    // why are we doing this for all schemes and not just the scheme we care about here?
    await props.daoState.dao.proposals(
      // eslint-disable-next-line @typescript-eslint/camelcase
      { where: { stage_in: [IProposalStage.Boosted, IProposalStage.QuietEndingPeriod, IProposalStage.Queued, IProposalStage.PreBoosted, IProposalStage.Executed] } },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      standardPolling(true)).subscribe(() => { });
    // end cache priming

    const schemeState = await scheme.state().pipe(first()).toPromise();
    /**
     * hack alert.  These approvaed proposals are for the Competition scheme.
     * Doesn't smell right to be doing Competition-specific stuff in the
     * context of this component.
     * However, it seems likely that this could be needed by other CrExt rewarder
     * contracts that might come along.
     */
    let approvedProposals: Observable<Array<IProposalState>>;
    if (hasRewarderContract(schemeState)) {
      approvedProposals = props.daoState.dao.proposals(
        {
        // eslint-disable-next-line @typescript-eslint/camelcase
          where: { scheme: scheme.id, stage_in: [IProposalStage.Executed] },
          orderBy: "closingAt",
          orderDirection: "desc",
        },
        standardPolling(true))
        .pipe(
          // work on each array individually so that toArray can perceive closure on the stream of items in the array
          mergeMap(proposals => of(proposals).pipe(
            mergeMap(proposals => proposals),
            mergeMap(proposal => proposal.state().pipe(first())),
            filter((proposal: IProposalState) => proposal.winningOutcome === IProposalOutcome.Pass),
            toArray())
          )
        );
    } else {
      approvedProposals = of([]);
    }

    return combineLatest(
      // refetch so we can subscribe.  Don't worry, has been cached
      arc.scheme(props.schemeId).state(standardPolling()),
      // Find the SchemeManager scheme if this dao has one
      Scheme.search(arc, { where: { dao: props.daoState.id, name: "SchemeRegistrar" } }).pipe(mergeMap((scheme: Array<Scheme | CompetitionScheme>): Observable<ISchemeState> => scheme[0] ? scheme[0].state() : of(null))),
      approvedProposals
    );
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedSchemeContainer);
