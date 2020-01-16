import * as H from "history";
import { first } from "rxjs/operators";
import { Address, IProposalStage, IDAOState, ISchemeState } from "@daostack/client";
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

type IProps = IExternalProps & IDispatchProps & IStateProps & ISubscriptionProps<ISchemeState>;

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

    e.preventDefault();

    if (!await enableWalletProvider({ showNotification })) { return; }

    this.props.history.push(`/dao/${daoAvatarAddress}/scheme/${schemeId}/proposals/create/`);
  };

  private isWikiScheme = schemeName(this.props.data, this.props.data.address) === 'WikiUpdate'
  private schemeInfoPageHtml = (daoState: IDAOState) => (props: any) => <SchemeInfoPage {...props} daoState={daoState} scheme={this.props.data}  />;
  private schemeProposalsPageHtml = (isActive: boolean, daoState: IDAOState) => (props: any) => <SchemeProposalsPage isWikiScheme={this.isWikiScheme} {...props} isActive={isActive} daoState={daoState} currentAccountAddress={this.props.currentAccountAddress} scheme={this.props.data} />;

  public render(): RenderOutput {
    const { schemeId, daoState } = this.props;
    const daoAvatarAddress = daoState.address;
    const schemeState = this.props.data;
    
    if (schemeState.name === "ReputationFromToken") {
      return <ReputationFromToken {...this.props} daoAvatarAddress={daoAvatarAddress} schemeState={schemeState} />;
    }

    const isActive = getSchemeIsActive(schemeState);

    const proposalsTabClass = classNames({
      [css.proposals]: true,
      [css.active]: !this.props.location.pathname.includes("info"),
    });
    const infoTabClass = classNames({
      [css.info]: true,
      [css.active]: this.props.location.pathname.includes("info"),
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
              <Link className={infoTabClass} to={`/dao/${daoAvatarAddress}/scheme/${schemeId}/info/`}>Info</Link>
            </TrainingTooltip>
            { this.isWikiScheme ? <></> :<TrainingTooltip placement="topRight" overlay={"A small amount of ETH is necessary to submit a proposal in order to pay gas costs"}>
              <a className={
                classNames({
                  [css.createProposal]: true,
                  [css.disabled]: !isActive,
                })}
              data-test-id="createProposal"
              href="javascript:void(0)"
              onClick={isActive ? this.handleNewProposal : null}
              >+ New proposal</a>
            </TrainingTooltip>
            }
          </div>
        </Sticky>

        <Switch>
          <Route exact path="/dao/:daoAvatarAddress/scheme/:schemeId/info"
            render={this.schemeInfoPageHtml(daoState)} />

          <Route path="/dao/:daoAvatarAddress/scheme/:schemeId"
            render={this.schemeProposalsPageHtml(isActive, daoState)} />
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
    await props.daoState.dao.proposals({where: { stage_in: [IProposalStage.Boosted, IProposalStage.QuietEndingPeriod, IProposalStage.Queued, IProposalStage.PreBoosted]}}, { fetchAllData: true }).pipe(first()).toPromise();
    // end cache priming

    return scheme.state();
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedSchemeContainer);
