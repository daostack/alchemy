import { Address, IDAOState, IProposalState, IProposalStage, IRewardState } from "@daostack/client";
import { executeProposal, redeemProposal } from "actions/arcActions";
import { checkNetworkAndWarn } from "arc";
import BN = require("bn.js");
import * as classNames from "classnames";
import { ActionTypes, default as PreTransactionModal } from "components/Shared/PreTransactionModal";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { proposalEnded } from "reducers/arcReducer";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import { isRedeemPending } from "selectors/operations";
import RedemptionsString from "./RedemptionsString";
import RedemptionsTip from "./RedemptionsTip";

import * as css from "./ActionButton.scss";

interface IStateProps {
  beneficiaryProfile: IProfileState;
  isRedeemPending: boolean;
}

interface IContainerProps {
  currentAccountAddress: Address;
  dao: IDAOState;
  daoEthBalance: BN;
  detailView?: boolean;
  expired: boolean;
  proposal: IProposalState;
  rewardsForCurrentUser: IRewardState[];
}

interface IDispatchProps {
  executeProposal: typeof executeProposal;
  redeemProposal: typeof redeemProposal;
  showNotification: typeof showNotification;
}

const mapStateToProps = (state: IRootState, ownProps: IContainerProps): IStateProps & IContainerProps => {
  const proposal = ownProps.proposal;

  return {...ownProps,
    beneficiaryProfile: state.profiles[proposal.beneficiary],
    isRedeemPending: ownProps.currentAccountAddress && isRedeemPending(proposal.id, ownProps.currentAccountAddress)(state),
  };
};

const mapDispatchToProps = {
  redeemProposal,
  executeProposal,
  showNotification
};

type IProps = IStateProps & IContainerProps & IDispatchProps;

interface IState {
  preRedeemModalOpen: boolean;
}

class ActionButton extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    this.state = {
      preRedeemModalOpen: false
    };
  }

  public async handleClickExecute(event: any) {
    if (!(await checkNetworkAndWarn(showNotification))) { return; }
    await this.props.executeProposal(this.props.dao.address, this.props.proposal.id, this.props.currentAccountAddress);
  }

  public handleClickRedeem(event: any) {
    this.setState({ preRedeemModalOpen: true });
  }

  public closePreRedeemModal(event: any) {
    this.setState({ preRedeemModalOpen: false });
  }

  public render() {
    const {
      beneficiaryProfile,
      currentAccountAddress,
      dao,
      daoEthBalance,
      detailView,
      expired,
      isRedeemPending,
      proposal,
      redeemProposal,
      rewardsForCurrentUser
    } = this.props;

    // TODO: should be the DAO balance of the proposal.externalToken
    const externalTokenBalance = dao.externalTokenBalance || new BN(0);

    const beneficiaryHasRewards = (
      !proposal.reputationReward.isZero() ||
      proposal.nativeTokenReward.gt(new BN(0)) ||
      (proposal.ethReward.gt(new BN(0)) && daoEthBalance.gte(proposal.ethReward)) ||
      (proposal.externalTokenReward.gt(new BN(0)) && externalTokenBalance.gte(proposal.externalTokenReward))
    ) as boolean;

    const accountHasRewards = rewardsForCurrentUser.length !== 0;
    const executable = proposalEnded(proposal) && !proposal.executedAt;
    const redeemable = proposal.executedAt && (accountHasRewards || beneficiaryHasRewards);

    const redemptionsTip = RedemptionsTip({ beneficiaryHasRewards, currentAccountAddress, dao, isRedeemPending, proposal, rewardsForCurrentUser });

    const redeemButtonClass = classNames({
      [css.redeemButton]: true,
      [css.pending]: isRedeemPending,
    });

    const wrapperClass = classNames({
      [css.wrapper]: true,
      [css.detailView]: detailView
    });

    return (
      <div className={wrapperClass}>
        {this.state.preRedeemModalOpen ?
          <PreTransactionModal
            actionType={executable && !redeemable ? ActionTypes.Execute : ActionTypes.Redeem}
            action={redeemProposal.bind(null, dao.address, proposal.id, currentAccountAddress)}
            beneficiaryProfile={beneficiaryProfile}
            closeAction={this.closePreRedeemModal.bind(this)}
            dao={dao}
            effectText={redemptionsTip}
            proposal={proposal}
          /> : ""
        }

        { proposal.stage === IProposalStage.Queued && proposal.upstakeNeededToPreBoost.lte(new BN(0)) ?
            <button className={css.preboostButton} onClick={this.handleClickExecute.bind(this)} data-test-id="buttonBoost">
              <img src="/assets/images/Icon/boost.svg"/>
              <span> Pre-Boost</span>
            </button> :
          proposal.stage === IProposalStage.PreBoosted && expired && proposal.downStakeNeededToQueue.lte(new BN(0)) ?
            <button className={css.unboostButton} onClick={this.handleClickExecute.bind(this)} data-test-id="buttonBoost">
              <img src="/assets/images/Icon/boost.svg"/>
              <span> Un-Boost</span>
            </button> :
          proposal.stage === IProposalStage.PreBoosted && expired ?
            <button className={css.boostButton} onClick={this.handleClickExecute.bind(this)} data-test-id="buttonBoost">
              <img src="/assets/images/Icon/boost.svg"/>
              <span> Boost</span>
            </button> :
          (proposal.stage === IProposalStage.Boosted || proposal.stage === IProposalStage.QuietEndingPeriod) && expired ?
            <button className={css.executeButton} onClick={this.handleClickExecute.bind(this)}>
              <img src="/assets/images/Icon/execute.svg"/>
              <span> Execute</span>
            </button>
          : redeemable ?
            <div>
              { !detailView ?
                  <RedemptionsString currentAccountAddress={currentAccountAddress} dao={dao} proposal={proposal} rewards={rewardsForCurrentUser} />
                  : ""
              }
              <Tooltip placement="left" trigger={["hover"]} overlay={redemptionsTip}>
                <button
                  style={{ whiteSpace: "nowrap" }}
                  disabled={false}
                  className={redeemButtonClass}
                  onClick={this.handleClickRedeem.bind(this)}
                >
                  <img src="/assets/images/Icon/redeem.svg" />
                  {
                    isRedeemPending ?
                      " Redeem in progress" :
                      beneficiaryHasRewards && !accountHasRewards ?
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
}

export default connect(mapStateToProps, mapDispatchToProps)(ActionButton);
