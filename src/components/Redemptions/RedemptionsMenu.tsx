import { Address, IDAOState, IProposalState, IRewardState, Proposal, Reward } from "@daostack/arc.js";
import { enableWalletProvider, getArc } from "arc";
import { redeemProposal } from "actions/arcActions";

import * as BN from "bn.js";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import ActionButton from "components/Proposal/ActionButton";
import RedemptionsString from "components/Proposal/RedemptionsString";
import ProposalSummary from "components/Proposal/ProposalSummary";
import { ethErrorHandler, humanProposalTitle, ethBalance, standardPolling, getNetworkByAddress } from "lib/util";
import { Page } from "pages";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import { combineLatest, concat, Observable, of } from "rxjs";
import { defaultIfEmpty, map, mergeMap } from "rxjs/operators";
import * as css from "./RedemptionsMenu.scss";

interface IExternalProps {
  redeemableProposals: any[];
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
            <img src="/assets/images/empty-redemptions.svg" />
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
      redeemProposal(proposal.dao.id, proposal.id, currentAccountAddress);
    });
  }
}

const SubscribedRedemptionsMenu = withSubscription({
  wrappedComponent: RedemptionsMenu,
  loadingComponent: <div className={css.menu}>Loading...</div>,
  errorComponent: (props) => <div className={css.menu}>{props.error.message}</div>,
  checkForUpdate: ["redeemableProposals"],
  createObservable: (props: IExternalProps) => {
    // getArcs with loop
    const arc = getArc();
    return combineLatest(
      props.redeemableProposals.map(proposalData => (
        new Proposal(proposalData.id, arc).state()
      ))
    ).pipe(defaultIfEmpty([]));
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
        <Link to={"/dao/" + proposal.dao.id + "/proposal/" + proposal.id}>
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
  return {
    ...ownProps,
    beneficiaryProfile: proposal.contributionReward ? state.profiles[proposal.contributionReward.beneficiary] : null,
  };
};

type IMenuItemContentProps = IMenuItemProps & IMenuItemContentStateProps & ISubscriptionProps<[IDAOState, BN | null, IRewardState]>;

class MenuItemContent extends React.Component<IMenuItemContentProps, null> {
  public render(): RenderOutput {
    const { beneficiaryProfile, currentAccountAddress, data, handleClose, proposal } = this.props;
    const [dao, daoEthBalance, rewards] = data;
    return <React.Fragment>
      <ProposalSummary
        proposal={proposal}
        dao={dao}
        beneficiaryProfile={beneficiaryProfile}
        detailView={false}
      />
      <div className={css.rewards}>
        <RedemptionsString
          currentAccountAddress={currentAccountAddress}
          dao={dao}
          proposal={proposal}
          rewards={rewards}
        />
      </div>
      <div className={css.redeemButton}>
        <ActionButton
          currentAccountAddress={currentAccountAddress}
          daoState={dao}
          daoEthBalance={daoEthBalance}
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
  errorComponent: (props) => <div>{props.error.message}</div>,
  checkForUpdate: [], // Parent component will rerender anyway.
  createObservable: (props: IMenuItemProps) => {
    const { currentAccountAddress, proposal } = props;
    const arc = getArc(getNetworkByAddress(currentAccountAddress));
    const dao = arc.dao(proposal.dao.id);
    const daoEthBalance = concat(of(new BN("0")), ethBalance(proposal.dao.id)).pipe(ethErrorHandler());
    const rewards = proposal.proposal.rewards({ where: { beneficiary: currentAccountAddress } })
      .pipe(map((rewards: Reward[]): Reward => rewards.length === 1 && rewards[0] || null))
      .pipe(mergeMap(((reward: Reward): Observable<IRewardState> => reward ? reward.state() : of(null))));
    // subscribe to dao to get DAO reputation supply updates
    return combineLatest(dao.state(standardPolling()), daoEthBalance, rewards);
  },
});

const ConnectedMenuItemContent = connect(mapStateToItemContentProps, null)(SubscribedMenuItemContent);

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedRedemptionsMenu);
