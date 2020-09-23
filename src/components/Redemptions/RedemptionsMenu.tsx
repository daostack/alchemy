import { Address, IDAOState, IRewardState, Reward, IContributionRewardProposalState, IProposalState } from "@daostack/arc.js";
import { enableWalletProvider, getArc } from "arc";
import { redeemProposal } from "actions/arcActions";

import BN = require("bn.js");
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import ActionButton from "components/Proposal/ActionButton";
import RedemptionsString from "components/Proposal/RedemptionsString";
import ProposalSummary from "components/Proposal/ProposalSummary";
import { humanProposalTitle } from "lib/util";
import { Page } from "pages";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import { combineLatest, Observable, of } from "rxjs";
import { defaultIfEmpty, map, mergeMap } from "rxjs/operators";
import * as css from "./RedemptionsMenu.scss";
import { GRAPH_POLL_INTERVAL } from "../../settings";

interface IExternalProps {
  redeemableProposals: IProposalState[];
  handleClose: () => void;
}

interface IStateProps {
  currentAccountAddress: Address;
}

const mapStateToProps = (state: IRootState, ownProps: IExternalProps) => {
  return {
    currentAccountAddress: state.web3.currentAccountAddress,
    ...ownProps,
  };
};

interface IDispatchProps {
  redeemProposal: typeof redeemProposal;
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  redeemProposal,
  showNotification,
};

type IProps = IExternalProps & IStateProps & IDispatchProps & ISubscriptionProps<IProposalState[]>;

class RedemptionsMenu extends React.Component<IProps, null> {
  public render(): RenderOutput {
    const { currentAccountAddress, handleClose, data: redeemableProposals } = this.props;
    return <div className={css.menu}>
      <div className={css.proposals}>
        {redeemableProposals.length > 0 ?
          redeemableProposals.map(proposal => (
            <MenuItem
              key={proposal.id}
              proposal={proposal}
              currentAccountAddress={currentAccountAddress}
              handleClose={handleClose}
            />
          ))
          : <div className={css.empty}>
            <h2>Nothing to redeem</h2>
            <img src="/assets/images/empty-redemptions.svg"/>
          </div>}
      </div>
      <div className={css.actions}>
        <Link
          to="/redemptions"
          onClick={handleClose}
          data-test-id="viewAllRedemptionsLink"
          className={redeemableProposals.length === 0 ? css.disabled : ""}
        >
          View all &gt;
        </Link>
        <button
          className={css.redeemAllButton}
          onClick={this.redeemAll}
          disabled={redeemableProposals.length === 0}
        >
          <img src="/assets/images/Icon/redeem.svg" />
          Redeem all {redeemableProposals.length > 0 ? redeemableProposals.length : ""}
        </button>
      </div>
    </div>;
  }

  private redeemAll = async (): Promise<void> => {
    const {
      currentAccountAddress,
      data: redeemableProposals,
      redeemProposal,
      showNotification,
    } = this.props;

    if (!await enableWalletProvider({ showNotification })) { return; }

    redeemableProposals.forEach(proposal => {
      redeemProposal(proposal.id, currentAccountAddress);
    });
  }
}

const SubscribedRedemptionsMenu = withSubscription({
  wrappedComponent: RedemptionsMenu,
  loadingComponent: <div className={css.menu}>Loading...</div>,
  errorComponent: (props) => <div className={css.menu}>{ props.error.message }</div>,
  checkForUpdate: ["redeemableProposals"],
  createObservable: (props: IExternalProps) => {
    return of(
      props.redeemableProposals
    ).pipe(defaultIfEmpty<IProposalState[]>([]));
  },
});

interface IMenuItemProps {
  proposal: IProposalState;
  currentAccountAddress: Address;
  handleClose: () => void;
}

class MenuItem extends React.Component<IMenuItemProps, null> {
  public render(): RenderOutput {
    const { proposal } = this.props;
    return <div className={css.proposal}>
      <div className={css.title}>
        <Link to={"/dao/" + (proposal as any).coreState.dao.id + "/proposal/" + proposal.id}>
          <span>{humanProposalTitle(proposal)}</span>
          <img src="/assets/images/Icon/Open.svg" />
        </Link>
      </div>
      <ConnectedMenuItemContent {...this.props} />
    </div>;
  }
}

interface IMenuItemContentStateProps {
  beneficiaryProfile?: IProfileState;
}

const mapStateToItemContentProps = (state: IRootState, ownProps: IMenuItemProps) => {
  const { proposal } = ownProps;

  const proposalState = proposal;
  const contributionReward = proposal as IContributionRewardProposalState;
  return {
    ...ownProps,
    beneficiaryProfile: proposalState.name === "ContributionReward" ? state.profiles[contributionReward.beneficiary] : null,
  };
};

type IMenuItemContentProps = IMenuItemProps & IMenuItemContentStateProps & ISubscriptionProps<[IDAOState, IRewardState|null]>;

class MenuItemContent extends React.Component<IMenuItemContentProps, null> {
  public render(): RenderOutput {
    const { beneficiaryProfile, currentAccountAddress, data, handleClose, proposal } = this.props;
    const [daoState, rewards] = data;
    return <React.Fragment>
      <ProposalSummary
        proposalState={proposal}
        daoState={daoState}
        beneficiaryProfile={beneficiaryProfile}
        detailView={false}
      />
      <div className={css.rewards}>
        <RedemptionsString
          currentAccountAddress={currentAccountAddress}
          daoState={daoState}
          proposal={proposal}
          rewards={rewards}
        />
      </div>
      <div className={css.redeemButton}>
        <ActionButton
          currentAccountAddress={currentAccountAddress}
          daoState={daoState}
          daoEthBalance={new BN(daoState.ethBalance)}
          expanded
          expired
          proposalState={proposal}
          rewards={rewards}
          parentPage={Page.RedemptionsMenu}
          onClick={handleClose}
        />
      </div>
    </React.Fragment>;
  }
}

const SubscribedMenuItemContent = withSubscription({
  wrappedComponent: MenuItemContent,
  loadingComponent: <div>Loading...</div>,
  errorComponent: (props) => <div>{ props.error.message }</div>,
  checkForUpdate: [], // Parent component will rerender anyway.
  createObservable: async (props: IMenuItemProps) => {
    const { currentAccountAddress, proposal } = props;
    const arc = getArc();
    const dao = arc.dao((proposal as any).coreState.dao.id);
    const rewards = (proposal as any).rewards({ where: { beneficiary: currentAccountAddress }})
      .pipe(map((rewards: Reward[]): Reward => rewards.length === 1 && rewards[0] || null))
      .pipe(mergeMap(((reward: Reward): Observable<IRewardState> => reward ? reward.state() : of(null))));
    // subscribe to dao to get DAO reputation supply updates
    return combineLatest(dao.state({ polling: true, pollInterval: GRAPH_POLL_INTERVAL }), rewards);
  },
});

const ConnectedMenuItemContent = connect(mapStateToItemContentProps, null)(SubscribedMenuItemContent);

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedRedemptionsMenu);
