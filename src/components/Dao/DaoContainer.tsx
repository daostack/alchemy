import { IDAOState } from "@daostack/client";
import * as profilesActions from "actions/profilesActions";
import { getArc } from "arc";
import CreateProposalPage from "components/Proposal/Create/CreateProposalPage";
import ProposalDetailsPage from "components/Proposal/ProposalDetailsPage";
import SchemeContainer from "components/Scheme/SchemeContainer";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { connect } from "react-redux";
import { Route, RouteComponentProps, Switch } from "react-router-dom";
//@ts-ignore
import { ModalRoute } from "react-router-modal";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import { Subscription } from "rxjs";
import DaoDiscussionPage from "./DaoDiscussionPage";
import DaoSchemesPage from "./DaoSchemesPage";
import DaoHistoryPage from "./DaoHistoryPage";
import DaoMembersPage from "./DaoMembersPage";
import DaoSidebar from "./DaoSidebar";
import * as css from "./Dao.scss";

type IExternalProps = RouteComponentProps<any>;

interface IStateProps  {
  currentAccountAddress: string;
  currentAccountProfile: IProfileState;
  daoAvatarAddress: string;
}

interface IDispatchProps {
  getProfilesForAllAccounts: typeof profilesActions.getProfilesForAllAccounts;
  showNotification: typeof showNotification;
}

type IProps = IExternalProps & IStateProps & IDispatchProps & ISubscriptionProps<IDAOState>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ...ownProps,
    currentAccountAddress: state.web3.currentAccountAddress,
    currentAccountProfile: state.profiles[state.web3.currentAccountAddress],
    daoAvatarAddress: ownProps.match.params.daoAvatarAddress,
  };
};

const mapDispatchToProps = {
  getProfilesForAllAccounts: profilesActions.getProfilesForAllAccounts,
  showNotification,
};

class DaoContainer extends React.Component<IProps, null> {
  public daoSubscription: any;
  public subscription: Subscription;

  public async componentDidMount () {
    this.props.getProfilesForAllAccounts();
  }

  private daoHistoryRoute = (routeProps: any) => <DaoHistoryPage {...routeProps} daoState={this.props.data} currentAccountAddress={this.props.currentAccountAddress} />;
  private daoMembersRoute = (routeProps: any) => <DaoMembersPage {...routeProps} daoState={this.props.data} />;
  private daoDiscussionRoute = (routeProps: any) => <DaoDiscussionPage {...routeProps} dao={this.props.data} />;
  private daoProposalRoute = (routeProps: any) =>
    <ProposalDetailsPage {...routeProps}
      daoState={this.props.data}
      currentAccountAddress={this.props.currentAccountAddress}
      proposalId={routeProps.match.params.proposalId}
    />;

  private schemeRoute = (routeProps: any) => <SchemeContainer {...routeProps} daoState={this.props.data} currentAccountAddress={this.props.currentAccountAddress} />;
  private daoSchemesRoute = (routeProps: any) => <DaoSchemesPage {...routeProps} daoState={this.props.data} />;
  private modalRoute = (route: any) => `/dao/${route.params.daoAvatarAddress}/scheme/${route.params.schemeId}/`;

  public render(): RenderOutput {
    const daoState = this.props.data;

    return (
      <div className={css.outer}>
        <BreadcrumbsItem to={"/dao/" + daoState.address}>{daoState.name}</BreadcrumbsItem>
        <div className={css.columnsContainer}>
          <div className={css.sidebarColumn}>
            <DaoSidebar dao={daoState} inSchemes={this.props.location.pathname.includes("scheme")} />
          </div>
          <div className={css.contentColumn}>
          <table className={css.pageContentWrapper}>
          <tbody>
          <tr><td>
            <div className={css.pageContentWrapper}>
              <Switch>
                <Route exact path="/dao/:daoAvatarAddress/history"
                  render={this.daoHistoryRoute} />
                <Route exact path="/dao/:daoAvatarAddress/members"
                  render={this.daoMembersRoute} />
                <Route exact path="/dao/:daoAvatarAddress/discussion"
                  render={this.daoDiscussionRoute} />

                <Route exact path="/dao/:daoAvatarAddress/proposal/:proposalId"
                  render={this.daoProposalRoute}
                />

                <Route path="/dao/:daoAvatarAddress/scheme/:schemeId"
                  render={this.schemeRoute} />

                <Route path="/dao/:daoAvatarAddress" render={this.daoSchemesRoute} />
              </Switch>

              <ModalRoute
                path="/dao/:daoAvatarAddress/scheme/:schemeId/proposals/create"
                parentPath={this.modalRoute}
                component={CreateProposalPage}
              />
            </div>
          </td></tr>
          <tr className={css.noticeWrapper}><td>
            <div className={css.noticeWrapper}>
              <div className={css.notice}>
                <div>
                  <img src="/assets/images/Icon/notice.svg" />
                  Alchemy and Arc are in Alpha. There will be BUGS! We don&apos;t guarantee complete security. *Play at your own risk*
                </div>
              </div>
            </div>
          </td></tr>
          </tbody>
          </table>
          </div>
        </div>
      </div>
    );
  }
}

const SubscribedDaoContainer = withSubscription({
  wrappedComponent: DaoContainer,
  loadingComponent: <div className={css.loading}><Loading/></div>,
  errorComponent: (props) => <div>{props.error.message}</div>,
  checkForUpdate: ["daoAvatarAddress"],
  createObservable: (props: IExternalProps) => {
    const arc = getArc(); // TODO: maybe we pass in the arc context from withSubscription instead of creating one every time?
    const daoAddress = props.match.params.daoAvatarAddress;
    return arc.dao(daoAddress).state({ subscribe: true, fetchAllData: true } );
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedDaoContainer);
