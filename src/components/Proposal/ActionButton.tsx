import { Address, IDAOState, IProposalOutcome, IProposalStage, IProposalState, IRewardState, Token } from "@daostack/client";
import { executeProposal, redeemProposal } from "actions/arcActions";
import { enableWalletProvider, getArc } from "arc";
import * as classNames from "classnames";
import { ActionTypes, default as PreTransactionModal } from "components/Shared/PreTransactionModal";
import { getClaimableContributionRewards, getGpRewards } from "lib/util";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { proposalEnded } from "reducers/arcReducer";
import { showNotification, NotificationStatus } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { from, of } from "rxjs";
import * as css from "./ActionButton.scss";
import RedemptionsTip from "./RedemptionsTip";

import BN = require("bn.js");

interface IExternalTokenBalance {
  externalTokenBalance: BN;
}

interface IExternalProps {
  currentAccountAddress?: Address;
  daoState: IDAOState;
  daoEthBalance: BN;
  detailView?: boolean;
  expanded?: boolean;
  proposalState: IProposalState;
  /**
   * GP and CR rewards due to the current account
   */
  rewards: IRewardState;
  expired: boolean;
}

interface IStateProps {
  beneficiaryProfile: IProfileState;
}

interface IDispatchProps {
  executeProposal: typeof executeProposal;
  redeemProposal: typeof redeemProposal;
  showNotification: typeof showNotification;
}

type IProps = IExternalProps & IStateProps & IDispatchProps & ISubscriptionProps<IExternalTokenBalance>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  const proposalState = ownProps.proposalState;
  return {...ownProps,
    beneficiaryProfile: proposalState.contributionReward ? state.profiles[proposalState.contributionReward.beneficiary] : null,
  };
};

const mapDispatchToProps = {
  redeemProposal,
  executeProposal,
  showNotification,
};

interface IState {
  preRedeemModalOpen: boolean;
}

class ActionButton extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    this.state = {
      preRedeemModalOpen: false,
    };
    this.handleRedeemProposal = this.handleRedeemProposal.bind(this);
  }

  public async handleClickExecute(_event: any): Promise<void> {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    await this.props.executeProposal(this.props.daoState.address, this.props.proposalState.id, this.props.currentAccountAddress);
  }

  public handleClickRedeem = (canRedeem: boolean) => async (): Promise<void> => {

    if (!canRedeem) {
      this.props.showNotification(NotificationStatus.Failure, "The DAO does not have enough funds to pay for these redemptions");
    } else {
      if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

      this.setState({ preRedeemModalOpen: true });
    }
  }

  public closePreRedeemModal(_event: any): void {
    this.setState({ preRedeemModalOpen: false });
  }

  public render(): RenderOutput {
    const {
      beneficiaryProfile,
      currentAccountAddress,
      daoState,
      daoEthBalance,
      detailView,
      expired,
      expanded,
      proposalState,
      rewards,
    } = this.props;

    const executable = proposalEnded(proposalState) && !proposalState.executedAt;

    const daoBalances: {[key: string]: BN} = {
      eth: daoEthBalance,
      nativeToken: undefined,
      rep: undefined,
      externalToken: this.props.data.externalTokenBalance,
    };

    /**
     * unredeemed and available to the current account
     */
    const availableGpRewards = getGpRewards(rewards, daoBalances);
    const currentAccountHasAvailableUnredeemedGpRewards = Object.keys(availableGpRewards).length > 0;

    /**
     * note beneficiary may not be the current account
     */
    let beneficiaryHasAvailableUnredeemedCrRewards: boolean;
    if (proposalState.contributionReward) {
      /**
       * unredeemed and available to the current account
       */
      const unredeemedAvailableContributionRewards = getClaimableContributionRewards(proposalState.contributionReward, daoBalances);
      beneficiaryHasAvailableUnredeemedCrRewards = Object.keys(unredeemedAvailableContributionRewards).length > 0;
    }

    const redeemable = proposalState.executedAt &&
                       ((currentAccountAddress ? proposalState.accountsWithUnclaimedRewards.includes(currentAccountAddress.toLowerCase()) : false)
                        || (proposalState.winningOutcome === IProposalOutcome.Pass && beneficiaryHasAvailableUnredeemedCrRewards));

    const redemptionsTip = RedemptionsTip({
      currentAccountAddress,
      dao: daoState,
      proposal: proposalState,
      rewardsForCurrentUser: rewards, 
    });

    const redeemButtonClass = classNames({
      [css.redeemButton]: true,
    });

    const wrapperClass = classNames({
      [css.wrapper]: true,
      [css.detailView]: detailView,
      [css.expanded]: expanded,
    });

    return (
      <div className={wrapperClass}>
        {this.state.preRedeemModalOpen ?
          <PreTransactionModal
            actionType={executable && !redeemable ? ActionTypes.Execute : ActionTypes.Redeem}
            action={this.handleRedeemProposal}
            beneficiaryProfile={beneficiaryProfile}
            closeAction={this.closePreRedeemModal.bind(this)}
            dao={daoState}
            effectText={redemptionsTip}
            proposal={proposalState}
          /> : ""
        }

        { proposalState.stage === IProposalStage.Queued && proposalState.upstakeNeededToPreBoost.lt(new BN(0)) ?
          <button className={css.preboostButton} onClick={this.handleClickExecute.bind(this)} data-test-id="buttonBoost">
            <img src="/assets/images/Icon/boost.svg"/>
            { /* space after <span> is there on purpose */ }
            <span> Pre-Boost</span>
          </button> :
          proposalState.stage === IProposalStage.PreBoosted && expired && proposalState.downStakeNeededToQueue.lte(new BN(0)) ?
            <button className={css.unboostButton} onClick={this.handleClickExecute.bind(this)} data-test-id="buttonBoost">
              <img src="/assets/images/Icon/boost.svg"/>
              <span> Un-Boost</span>
            </button> :
            proposalState.stage === IProposalStage.PreBoosted && expired ?
              <button className={css.boostButton} onClick={this.handleClickExecute.bind(this)} data-test-id="buttonBoost">
                <img src="/assets/images/Icon/boost.svg"/>
                <span> Boost</span>
              </button> :
              (proposalState.stage === IProposalStage.Boosted || proposalState.stage === IProposalStage.QuietEndingPeriod) && expired ?
                <button className={css.executeButton} onClick={this.handleClickExecute.bind(this)}>
                  <img src="/assets/images/Icon/execute.svg"/>
                  { /* space after <span> is there on purpose */ }
                  <span> Execute</span>
                </button>
                : redeemable ?
                  <div>
                    <Tooltip placement="left" trigger={["hover"]} overlay={redemptionsTip}>
                      <button
                        style={{ whiteSpace: "nowrap" }}
                        disabled={false}
                        className={redeemButtonClass}
                        onClick={this.handleClickRedeem(beneficiaryHasAvailableUnredeemedCrRewards || currentAccountHasAvailableUnredeemedGpRewards)}
                        data-test-id="button-redeem"
                      >
                        <img src="/assets/images/Icon/redeem.svg" />
                        {
                          beneficiaryHasAvailableUnredeemedCrRewards && !currentAccountHasAvailableUnredeemedGpRewards ?
                            " Redeem for beneficiary" :
                            " Redeem"
                        }
                      </button>
                    </Tooltip>
                  </div>
                  : ""
        }
      </div>
    );
  }

  private async handleRedeemProposal(): Promise<void> {

    // may not be required, but just in case
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    const {
      currentAccountAddress,
      daoState,
      proposalState,
      redeemProposal,
    } = this.props;

    await redeemProposal(daoState.address, proposalState.id, currentAccountAddress);
  }
}

const SubscribedActionButton = withSubscription({
  wrappedComponent: ActionButton,
  // Don't ever update the subscription
  checkForUpdate: () => { return false; },
  loadingComponent: null,
  createObservable: (props: IProps) => {
    if (props.proposalState.contributionReward.externalTokenReward && !props.proposalState.contributionReward.externalTokenReward.isZero())
    {
      const token = new Token(props.proposalState.contributionReward.externalToken, getArc());
      return from(token.balanceOf(props.daoState.address).toPromise()
        .then((balance: BN) => {
          return {externalTokenBalance: balance };
        }));

    } else {
      return of({externalTokenBalance: null});
    }
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedActionButton);
