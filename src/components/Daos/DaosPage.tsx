import { DAO } from "@daostack/client";
import { enableWalletProvider, getArc } from "arc";
import { toggleFollow } from "actions/profilesActions";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import { connect } from "react-redux";
import * as React from "react";
import * as Sticky from "react-stickynode";
import DaoCard from "./DaoCard";
import * as css from "./Daos.scss";

type SubscriptionData = DAO[];

interface IStateProps {
  currentAccountProfile: IProfileState
}

const mapStateToProps = (state: IRootState, ownProps: any): IStateProps => {
  return {
    currentAccountProfile: state.profiles[state.web3.currentAccountAddress]
  };
};

interface IDispatchProps {
  showNotification: typeof showNotification;
  toggleFollow: typeof toggleFollow;
}

const mapDispatchToProps = {
  showNotification,
  toggleFollow
};

type IProps = IStateProps & IDispatchProps & ISubscriptionProps<SubscriptionData>;

class DaosPage extends React.Component<IProps, null> {

  public handleClickFollow = (daoAvatarAddress: string) => async (e: any) => {
    e.preventDefault();
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    const { toggleFollow, currentAccountProfile } = this.props;
    await toggleFollow(currentAccountProfile.ethereumAccountAddress, "daos", daoAvatarAddress);
  }

  public render(): RenderOutput {
    const { currentAccountProfile, data } = this.props;

    let daos: DAO[];
    if (process.env.NODE_ENV === "staging") {
      // on staging we show all daos (registered or not)
      daos = data.filter((d: DAO) => d.staticState.name === "Genesis Alpha")
        .concat(data.filter((d: DAO) => d.staticState.name !== "Genesis Alpha"));
    } else {
      daos = data.filter((d: DAO) => d.staticState.name === "Genesis Alpha")
        .concat(data.filter((d: DAO) => d.staticState.name !== "Genesis Alpha" && d.staticState.register === "registered"));
    }

    const daoNodes = daos.map((dao: DAO) => {
      return (
        <DaoCard
          key={dao.id}
          dao={dao}
          isFollowing={currentAccountProfile && currentAccountProfile.follows && currentAccountProfile.follows.daos.includes(dao.staticState.address)}
          toggleFollow={this.handleClickFollow(dao.staticState.address)} />
      );
    });
    return (
      <div className={css.wrapper}>
        <Sticky enabled top={50} innerZ={10000}>
          <div className={css.daoListHeader + " clearfix"}>
            <h2 data-test-id="header-all-daos">All DAOs</h2>
          </div>
        </Sticky>
        <div className={css.daoList}>
          {daoNodes ? daoNodes : "None"}
        </div>
      </div>
    );
  }
}

const SubscribedDaosPage = withSubscription({
  wrappedComponent: DaosPage,
  loadingComponent: <div className={css.wrapper}><div className={css.loading}><Loading/></div></div>,
  errorComponent: (props) => <div>{ props.error.message }</div>,

  // Don't ever update the subscription
  checkForUpdate: () => { return false; },

  createObservable: () => {
    const arc = getArc();
    return arc.daos({
      // where: { register: "registered" },
      orderBy: "name", orderDirection: "asc"}, { fetchAllData: true, subscribe: true });
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedDaosPage);
