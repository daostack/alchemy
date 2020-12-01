import { IDAOState, Member } from "@daostack/arc.js";
import { getProfilesForAddresses } from "actions/profilesActions";
import CreateProposalPage from "components/Proposal/Create/CreateProposalPage";
import ProposalDetailsPage from "components/Proposal/ProposalDetailsPage";
import SchemeContainer from "components/Scheme/SchemeContainer";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { Route, RouteComponentProps, Switch } from "react-router-dom";
import { ModalRoute } from "react-router-modal";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import DetailsPageRouter from "components/Scheme/ContributionRewardExtRewarders/DetailsPageRouter";
import { combineLatest, Subscription } from "rxjs";
import DaoSchemesPage from "./DaoSchemesPage";
import DaoHistoryPage from "./DaoHistoryPage";
import DaoMembersPage from "./DaoMembersPage";
import * as css from "./Dao.scss";
import DaoLandingPage from "components/Dao/DaoLandingPage";
import { standardPolling, targetedNetwork, getArcByDAOAddress, getDAONameByID } from "lib/util";
import gql from "graphql-tag";
import { getArcs } from "arc";

type IExternalProps = RouteComponentProps<any>;

interface IStateProps {
  currentAccountAddress: string;
  currentAccountProfile: IProfileState;
  daoAvatarAddress: string;
  followingDaosAddresses: Array<any>;
}

interface IState {
  memberDaos: Array<any>;
}

interface IDispatchProps {
  getProfilesForAddresses: typeof getProfilesForAddresses;
  showNotification: typeof showNotification;
}

type IProps = IExternalProps & IStateProps & IDispatchProps & ISubscriptionProps<[IDAOState, Member[]]>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ...ownProps,
    currentAccountAddress: state.web3.currentAccountAddress,
    currentAccountProfile: state.profiles[state.web3.currentAccountAddress],
    daoAvatarAddress: ownProps.match.params.daoAvatarAddress,
    followingDaosAddresses: state.profiles[state.web3.currentAccountAddress]?.follows.daos,
  };
};

const mapDispatchToProps = {
  getProfilesForAddresses,
  showNotification,
};

class DaoContainer extends React.Component<IProps, IState> {
  constructor(props: any) {
    super(props);
    this.state = {
      memberDaos: [],
    };
  }
  public daoSubscription: any;
  public subscription: Subscription;

  public async componentDidMount() {
    // TODO: use this once 3box fixes Box.getProfiles
    //this.props.getProfilesForAddresses(this.props.data[1].map((member) => member.staticState.address));
    const { followingDaosAddresses } = this.props;
    const memberQuery = gql` query memberDaos {
      reputationHolders (where: {
        address: "${this.props.currentAccountAddress}"
        ${followingDaosAddresses.length ? "dao_not_in: [" + followingDaosAddresses.map(dao => "\"" + dao + "\"").join(",") + "]" : ""}
      }) {
        dao {
          id
          name
        }
      }
    }`;

    const arcs = getArcs();
    const memberDaosData = [];
    for (const network in arcs) {
      const arc = arcs[network];
      const daos = await arc.sendQuery(memberQuery);
      memberDaosData.push(daos.data.reputationHolders);
    }
    const memberDaos = [].concat(...memberDaosData).map(dao => {
      return { id: dao.dao.id, name: dao.dao.name };
    });
    this.setState({ memberDaos: memberDaos });
  }

  private daoHistoryRoute = (routeProps: any) => <DaoHistoryPage {...routeProps} daoState={this.props.data[0]} currentAccountAddress={this.props.currentAccountAddress} />;
  private daoMembersRoute = (routeProps: any) => <DaoMembersPage {...routeProps} daoState={this.props.data[0]} />;
  private daoProposalRoute = (routeProps: any) =>
    <ProposalDetailsPage {...routeProps}
      currentAccountAddress={this.props.currentAccountAddress}
      daoState={this.props.data[0]}
      proposalId={routeProps.match.params.proposalId}
    />;
  private daoCrxProposalRoute = (routeProps: any) =>
    <DetailsPageRouter {...routeProps}
      currentAccountAddress={this.props.currentAccountAddress}
      daoState={this.props.data[0]}
      proposalId={routeProps.match.params.proposalId}
    />;

  private schemeRoute = (routeProps: any) => <SchemeContainer {...routeProps} daoState={this.props.data[0]} currentAccountAddress={this.props.currentAccountAddress} />;
  private daoSchemesRoute = (routeProps: any) => <DaoSchemesPage {...routeProps} daoState={this.props.data[0]} />;
  private daoLandingRoute = (_routeProps: any) => <DaoLandingPage daoState={this.props.data[0]} />;
  private modalRoute = (route: any) => `/dao/${route.params.daoAvatarAddress}/scheme/${route.params.schemeId}/`;
  private onFollwingDaosListChange = (daoAddress: string, history: any) => history.push(`/dao/${daoAddress}`);

  public render(): RenderOutput {
    const daoState = this.props.data[0];
    const network = targetedNetwork();
    const { followingDaosAddresses } = this.props;
    const { memberDaos } = this.state;

    const followingDaos = followingDaosAddresses?.filter(address => getDAONameByID(address) !== undefined)
    .map(daoAddress => {
      return { id: daoAddress, name: getDAONameByID(daoAddress) };
    });

    const myDaos = followingDaos?.concat(memberDaos);

    const myDaosAddresses = [] as any;
    const myDaosOptions = myDaos?.map(dao => {
      myDaosAddresses.push(dao.id);
      return <option key={dao.id} selected={dao.id === daoState.address ? true : false} value={dao.id}>{dao.name}</option>;
    });

    if (!myDaosAddresses.includes(daoState.id)){
      myDaosOptions?.push(<option key={daoState.id} selected value={daoState.id}>{daoState.name}</option>);
    }

    return (
      <div className={css.outer}>
        <BreadcrumbsItem to="/daos/">All DAOs</BreadcrumbsItem>
        {/* A BreadcrumbsItem position is determined according the path depth, so it has to be at least /daos/. In order to prevent redirection we use preventDefault */}
        <BreadcrumbsItem onClick={(e: any) => { e.preventDefault(); }} to="/daos/"><select className={css.follwingDaosList} onChange={(e) => this.onFollwingDaosListChange(e.target.value, this.props.history)}>{myDaosOptions}</select></BreadcrumbsItem>
        <Helmet>
          <meta name="description" content={daoState.name + " | Managed on Alchemy by DAOstack"} />
          <meta name="og:description" content={daoState.name + " | Managed on Alchemy by DAOstack"} />
          <meta name="twitter:description" content={daoState.name + " | Managed on Alchemy by DAOstack"} />
        </Helmet>

        <div className={css.wrapper}>
          <div className={css.noticeWrapper}>
            <div className={css.noticeBuffer}></div>
            <div className={css.notice}>Alchemy 2.0 has been released! Take a look <a
              href={(network === "main") ? process.env.ALCHEMY_V2_URL_MAINNET : process.env.ALCHEMY_V2_URL_XDAI}
              target="_blank" rel="noopener noreferrer">here</a>.
            </div>
          </div>
          <Switch>
            <Route exact path="/dao/:daoAvatarAddress"
              render={this.daoLandingRoute} />
            <Route exact path="/dao/:daoAvatarAddress/history"
              render={this.daoHistoryRoute} />
            <Route exact path="/dao/:daoAvatarAddress/members"
              render={this.daoMembersRoute} />

            <Route exact path="/dao/:daoAvatarAddress/proposal/:proposalId"
              render={this.daoProposalRoute}
            />

            <Route path="/dao/:daoAvatarAddress/crx/proposal/:proposalId"
              render={this.daoCrxProposalRoute} />

            <Route path="/dao/:daoAvatarAddress/scheme/:schemeId"
              render={this.schemeRoute} />

            <Route exact path="/dao/:daoAvatarAddress/schemes"
              render={this.daoSchemesRoute} />

            <Route path="/dao/:daoAvatarAddress" render={this.daoLandingRoute} />
          </Switch>

          <ModalRoute
            path="/dao/:daoAvatarAddress/scheme/:schemeId/proposals/create"
            parentPath={this.modalRoute}
            component={CreateProposalPage}
          />

        </div>
      </div>
    );
  }
}

const SubscribedDaoContainer = withSubscription({
  wrappedComponent: DaoContainer,
  loadingComponent: <Loading />,
  errorComponent: (props) => <div>{props.error.message}</div>,
  checkForUpdate: ["daoAvatarAddress"],
  createObservable: (props: IExternalProps) => {
    const daoAddress = props.match.params.daoAvatarAddress;
    const arc = getArcByDAOAddress(daoAddress);
    const dao = arc.dao(daoAddress);
    const observable = combineLatest(
      dao.state(standardPolling(true)), // DAO state
      dao.members()
    );
    return observable;
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedDaoContainer);
