import { Address, IDAOState, IProposalOutcome, IProposalStage, IProposalState, IRewardState } from "@daostack/client";
import { executeProposal, redeemProposal } from "actions/arcActions";
import { enableWeb3ProviderAndWarn } from "arc";
import * as classNames from "classnames";
import { ActionTypes, default as PreTransactionModal } from "components/Shared/PreTransactionModal";
import { claimableContributionRewards, hasClaimableRewards } from "lib/util";
import * as moment from "moment";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { closingTime } from "reducers/arcReducer";
import { proposalEnded } from "reducers/arcReducer";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import * as css from "./ActionButton.scss";
/* import RedemptionsString from "./RedemptionsString"; */
import RedemptionsTip from "./RedemptionsTip";

import BN = require("bn.js");

interface IExternalProps {
  currentAccountAddress?: Address;
  daoState: IDAOState;
  daoEthBalance: BN;
  detailView?: boolean;
  proposalState: IProposalState;
  rewards: IRewardState;
}

interface IStateProps {
  beneficiaryProfile: IProfileState;
}

interface IDispatchProps {
  executeProposal: typeof executeProposal;
  redeemProposal: typeof redeemProposal;
  showNotification: typeof showNotification;
}

type IProps = IExternalProps & IStateProps & IDispatchProps;

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
    if (!(await enableWeb3ProviderAndWarn(this.props.showNotification.bind(this)))) { return; }
    await this.props.executeProposal(this.props.daoState.address, this.props.proposalState.id, this.props.currentAccountAddress);
  }

  public async handleClickRedeem(_event: any): Promise<void> {
    if (!(await enableWeb3ProviderAndWarn(this.props.showNotification.bind(this)))) { return; }
    this.setState({ preRedeemModalOpen: true });
  }

  public closePreRedeemModal(_event: any): void {
    this.setState({ preRedeemModalOpen: false });
  }

  public render(): any {
    const {
      beneficiaryProfile,
      currentAccountAddress,
      daoState,
      daoEthBalance,
      detailView,
      proposalState,
      rewards,
    } = this.props;

    const executable = proposalEnded(proposalState) && !proposalState.executedAt;
    const expired = closingTime(proposalState).isSameOrBefore(moment());

    let beneficiaryHasRewards;

    const accountHasGPRewards = hasClaimableRewards(rewards);
    if (proposalState.contributionReward) {
      const daoBalances: {[key: string]: BN} = {
        eth: daoEthBalance,
        nativeToken: undefined,
        rep: undefined,
        externalToken: undefined,
      };
      const contributionRewards = claimableContributionRewards(proposalState.contributionReward, daoBalances);

      beneficiaryHasRewards = Object.keys(contributionRewards).length > 0;
    }

    const redeemable = proposalState.executedAt &&
                       ((currentAccountAddress ? proposalState.accountsWithUnclaimedRewards.includes(currentAccountAddress.toLowerCase()) : false)
                        || (proposalState.winningOutcome === IProposalOutcome.Pass && beneficiaryHasRewards));

    // hack to work around https://github.com/daostack/subgraph/issues/304
    const redemptionsTip = RedemptionsTip({
      beneficiaryHasRewards,
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
                    {/* !detailView ?
                  <RedemptionsString currentAccountAddress={currentAccountAddress} dao={daoState} proposal={proposalState} rewards={rewardsForCurrentUser} />
                  : ""
              */}
                    <Tooltip placement="left" trigger={["hover"]} overlay={redemptionsTip}>
                      <button
                        style={{ whiteSpace: "nowrap" }}
                        disabled={false}
                        className={redeemButtonClass}
                        onClick={this.handleClickRedeem.bind(this)}
                        data-test-id="button-redeem"
                      >
                        <img src="/assets/images/Icon/redeem.svg" />
                        {
                          beneficiaryHasRewards && !accountHasGPRewards ?
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
    if (!(await enableWeb3ProviderAndWarn(this.props.showNotification.bind(this)))) { return; }

    const {
      currentAccountAddress,
      daoState,
      proposalState,
      redeemProposal,
    } = this.props;

    await redeemProposal(daoState.address, proposalState.id, currentAccountAddress);
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ActionButton);
