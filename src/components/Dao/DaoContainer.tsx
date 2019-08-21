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
import DaoSchemesPage from "./DaoSchemesPage";
import DaoHistoryPage from "./DaoHistoryPage";
import DaoMembersPage from "./DaoMembersPage";
import DaoRedemptionsPage from "./DaoRedemptionsPage";
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

  public async componentWillMount() {
    this.props.getProfilesForAllAccounts();
  }

  public render() {
    const dao = this.props.data;
    const { currentAccountAddress } = this.props;

    return (
      <div className={css.outer}>
        <BreadcrumbsItem to={"/dao/" + dao.address}>{dao.name}</BreadcrumbsItem>
        <DaoSidebar currentAccountAddress={this.props.currentAccountAddress} dao={dao} />
        <div className={css.wrapper}>
          <div className={css.noticeWrapper}>
            <div className={css.noticeBuffer}></div>
            <div className={css.notice}>
              <div>
                <img src="/assets/images/Icon/notice.svg" />
                Alchemy and Arc are in Alpha. There will be BUGS! We don&apos;t guarantee complete security. *Play at your own risk*
              </div>
            </div>
          </div>
          <Switch>
            <Route exact path="/dao/:daoAvatarAddress/history"
              render={(props) => <DaoHistoryPage {...props} currentAccountAddress={currentAccountAddress} />} />
            <Route exact path="/dao/:daoAvatarAddress/members"
              render={(props) => <DaoMembersPage {...props} dao={dao} />} />
            <Route exact path="/dao/:daoAvatarAddress/redemptions"
              render={(props) =>
                <DaoRedemptionsPage {...props} dao={dao} currentAccountAddress={currentAccountAddress} />
              }
            />

            <Route exact path="/dao/:daoAvatarAddress/proposal/:proposalId"
              render={(props) =>
                <ProposalDetailsPage {...props}
                  dao={dao}
                  currentAccountAddress={currentAccountAddress}
                  proposalId={props.match.params.proposalId}
                />
              }
            />

            <Route path="/dao/:daoAvatarAddress/scheme/:schemeId"
              render={(props) => <SchemeContainer {...props} currentAccountAddress={currentAccountAddress} />} />

            <Route path="/dao/:daoAvatarAddress" render={(props) => <DaoSchemesPage {...props} />} />
          </Switch>

          <ModalRoute
            path="/dao/:daoAvatarAddress/scheme/:schemeId/proposals/create"
            parentPath={(route: any) => `/dao/${route.params.daoAvatarAddress}/scheme/${route.params.schemeId}/`}
            component={CreateProposalPage}
          />

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
    return arc.dao(daoAddress).state();
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedDaoContainer);
