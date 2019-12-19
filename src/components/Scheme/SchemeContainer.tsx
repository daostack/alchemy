import * as H from "history";
import { first, mergeMap, filter, toArray } from "rxjs/operators";
import { Address, IProposalStage, IDAOState, ISchemeState, IProposalState, Proposal, IProposalOutcome } from "@daostack/client";
import { enableWalletProvider, getArc } from "arc";
import * as classNames from "classnames";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { schemeName, getSchemeIsActive} from "lib/util";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Link, Route, RouteComponentProps, Switch } from "react-router-dom";
import * as Sticky from "react-stickynode";
import { showNotification } from "reducers/notifications";
import { IRootState } from "reducers";
import { connect } from "react-redux";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import Competitions from "components/Scheme/ContributionRewardExtRewarders/Competition/List";
import { combineLatest, from } from "rxjs";
import { ICrxRewarderProps, getCrxRewarderConfig } from "crxRegistry";
import ReputationFromToken from "./ReputationFromToken";
import SchemeInfoPage from "./SchemeInfoPage";
import SchemeProposalsPage from "./SchemeProposalsPage";
import * as css from "./Scheme.scss";

interface IDispatchProps {
  showNotification: typeof showNotification;
}

interface IExternalProps extends RouteComponentProps<any> {
  currentAccountAddress: Address;
  history: H.History;
  daoState: IDAOState;
}

interface IStateProps {
  schemeId: Address;
}

type IProps = IExternalProps & IDispatchProps & IStateProps & ISubscriptionProps<[ISchemeState, Array<IProposalState>]>;

const mapStateToProps = (_state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  const match = ownProps.match;

  return {
    ...ownProps,
    schemeId: match.params.schemeId,
  };
};

const mapDispatchToProps = {
  showNotification,
};

class SchemeContainer extends React.Component<IProps, null> {

  public handleNewProposal = async (e: any): Promise<void> => {
    const { schemeId, showNotification, daoState } = this.props;
    const daoAvatarAddress = daoState.address;
    e.preventDefault();

    if (!await enableWalletProvider({ showNotification })) { return; }

    this.props.history.push(`/dao/${daoAvatarAddress}/scheme/${schemeId}/proposals/create/`);
  };

  private schemeInfoPageHtml = (props: any) => <SchemeInfoPage {...props} daoState={this.props.daoState} scheme={this.props.data[0]} />;
  private schemeProposalsPageHtml = (isActive: boolean) => (props: any) => <SchemeProposalsPage {...props} isActive={isActive} daoState={this.props.daoState} currentAccountAddress={this.props.currentAccountAddress} scheme={this.props.data[0]} />;
  private contributionsRewardExtTabHtml = (crxRewarderConfig: ICrxRewarderProps) => (props: any) => 
  {
    if (!crxRewarderConfig) {
      return null;
    }

    switch(crxRewarderConfig.contractName) {
      case "Competition":
        return <Competitions {...props} daoState={this.props.daoState} currentAccountAddress={this.props.currentAccountAddress} scheme={this.props.data[0]} proposals={this.props.data[1]} />;
      default:
        throw new Error(`Unknown ContributionRewardExt rewarder name: ${crxRewarderConfig.contractName}`);
    }
  };

  public render(): RenderOutput {
    const { schemeId, daoState } = this.props;
    const daoAvatarAddress = daoState.address;
    const schemeState = this.props.data[0];
    const approvedProposals = this.props.data[1];

    if (schemeState.name === "ReputationFromToken") {
      return <ReputationFromToken {...this.props} daoAvatarAddress={daoAvatarAddress} schemeState={schemeState} />;
    }

    const isActive = getSchemeIsActive(schemeState);
    const crxRewarderConfig = getCrxRewarderConfig(schemeState);

    const proposalsTabClass = classNames({
      [css.proposals]: true,
      [css.active]: !this.props.location.pathname.includes("info") && !this.props.location.pathname.includes("crx"),
    });
    const infoTabClass = classNames({
      [css.info]: true,
      [css.active]: this.props.location.pathname.includes("info"),
    });
    const crxTabClass = classNames({
      [css.crx]: true,
      [css.active]: this.props.location.pathname.includes("crx"),
    });

    return (
      <div className={css.schemeContainer}>
      
        <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/scheme/${schemeId}`}>{schemeName(schemeState, schemeState.address)}</BreadcrumbsItem>

        <Sticky enabled top={50} innerZ={10000}>
          <h2 className={css.schemeName}>
            {schemeName(schemeState, schemeState.address)}
          </h2>

          <div className={css.schemeMenu}>
            <Link className={proposalsTabClass} to={`/dao/${daoAvatarAddress}/scheme/${schemeId}/proposals/`}>Proposals</Link>
            <TrainingTooltip placement="top" overlay={"Learn about the protocol parameters for this scheme"}>
              <Link className={infoTabClass} to={`/dao/${daoAvatarAddress}/scheme/${schemeId}/info/`}>Information</Link>
            </TrainingTooltip>
            {
              crxRewarderConfig ?
                <TrainingTooltip placement="top" overlay={crxRewarderConfig.shortDescription}>
                  <Link className={crxTabClass} to={`/dao/${daoAvatarAddress}/scheme/${schemeId}/crx/`}>{crxRewarderConfig.friendlyName} ({approvedProposals.length})</Link>
                </TrainingTooltip>
                : ""
            }
            <TrainingTooltip placement="topRight" overlay={"A small amount of ETH is necessary to submit a proposal in order to pay gas costs"}>
              <a className={
                classNames({
                  [css.createProposal]: true,
                  [css.disabled]: !isActive,
                })}
              data-test-id="createProposal"
              href="javascript:void(0)"
              onClick={isActive ? this.handleNewProposal : null}
              >
              + New { `${crxRewarderConfig ? crxRewarderConfig.contractName : schemeState.name } `}Proposal</a>
            </TrainingTooltip>
          </div>
        </Sticky>

        <Switch>
          <Route exact path="/dao/:daoAvatarAddress/scheme/:schemeId/info" render={this.schemeInfoPageHtml} />
          {
            crxRewarderConfig ?
              <Route exact path="/dao/:daoAvatarAddress/scheme/:schemeId/crx" render={this.contributionsRewardExtTabHtml(crxRewarderConfig)} />
              : ""
          }
          <Route path="/dao/:daoAvatarAddress/scheme/:schemeId" render={this.schemeProposalsPageHtml(isActive)} />
        </Switch>
      </div>
    );
  }
}

const SubscribedSchemeContainer = withSubscription({
  wrappedComponent: SchemeContainer,
  loadingComponent: <div className={css.loading}><Loading/></div>,
  errorComponent: null,
  checkForUpdate: ["schemeId"],
  createObservable: async (props: IProps) => {
    const arc = getArc();
    const scheme = arc.scheme(props.schemeId);

    // TODO: this may NOT be the best place to do this - we'd like to do this higher up

    // eslint-disable-next-line @typescript-eslint/camelcase
    const proposals = await props.daoState.dao.proposals({where: { stage_in: [IProposalStage.Boosted, IProposalStage.QuietEndingPeriod, IProposalStage.Queued, IProposalStage.PreBoosted]}}, { fetchAllData: true }).pipe(first()).toPromise();
    // end cache priming

    return combineLatest(
      scheme.state(),
      from(proposals).pipe(
        mergeMap((proposal: Proposal): Promise<IProposalState> => proposal.state().pipe(first()).toPromise()),
        filter((proposal: IProposalState) => proposal.winningOutcome === IProposalOutcome.Pass ),
        toArray()
      )
    );
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedSchemeContainer);
