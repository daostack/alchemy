import { Address, IDAOState, IProposalOutcome, IProposalStage, IProposalState, IRewardState, Reward } from "@daostack/client";
import { executeProposal, redeemProposal } from "actions/arcActions";
import { checkWeb3ProviderAndWarn } from "arc";

import BN = require("bn.js");
import * as classNames from "classnames";
import { ActionTypes, default as PreTransactionModal } from "components/Shared/PreTransactionModal";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
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
import { Observable, of} from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import * as css from "./ActionButton.scss";
/* import RedemptionsString from "./RedemptionsString"; */
import RedemptionsTip from "./RedemptionsTip";

interface IStateProps {
  beneficiaryProfile: IProfileState;
}

interface IContainerProps {
  currentAccountAddress?: Address;
  dao: IDAOState;
  daoEthBalance: BN;
  detailView?: boolean;
  proposalState: IProposalState;
  rewardsForCurrentUser: IRewardState;
}

interface IDispatchProps {
  executeProposal: typeof executeProposal;
  redeemProposal: typeof redeemProposal;
  showNotification: typeof showNotification;
}

const mapStateToProps = (state: IRootState, ownProps: IContainerProps): IStateProps & IContainerProps => {
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

type IProps = IStateProps & IContainerProps & IDispatchProps;

interface IState {
  preRedeemModalOpen: boolean;
}

class ActionButton extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    this.state = {
      preRedeemModalOpen: false,
    };
  }

  public async handleClickExecute(_event: any): Promise<void> {
    if (!(await checkWeb3ProviderAndWarn(this.props.showNotification.bind(this)))) { return; }
    await this.props.executeProposal(this.props.dao.address, this.props.proposalState.id, this.props.currentAccountAddress);
  }

  public handleClickRedeem(_event: any): void {
    this.setState({ preRedeemModalOpen: true });
  }

  public closePreRedeemModal(_event: any): void {
    this.setState({ preRedeemModalOpen: false });
  }

  public render(): any {
    const {
      beneficiaryProfile,
      currentAccountAddress,
      dao,
      daoEthBalance,
      detailView,
      proposalState,
      redeemProposal,
      rewardsForCurrentUser,
    } = this.props;

    const executable = proposalEnded(proposalState) && !proposalState.executedAt;
    const expired = closingTime(proposalState).isSameOrBefore(moment());

    let beneficiaryHasRewards;

    const accountHasGPRewards = hasClaimableRewards(rewardsForCurrentUser);
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

    const redeemable = proposalState.executedAt
                       && (accountHasGPRewards
                           || (proposalState.winningOutcome === IProposalOutcome.Pass && beneficiaryHasRewards));

    const redemptionsTip = RedemptionsTip({
      beneficiaryHasRewards,
      currentAccountAddress,
      dao,
      proposal: proposalState,
      rewardsForCurrentUser,
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
            action={redeemProposal.bind(null, dao.address, proposalState.id, currentAccountAddress)}
            beneficiaryProfile={beneficiaryProfile}
            closeAction={this.closePreRedeemModal.bind(this)}
            dao={dao}
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
                  <RedemptionsString currentAccountAddress={currentAccountAddress} dao={dao} proposal={proposalState} rewards={rewardsForCurrentUser} />
                  : ""
              */}
                    <Tooltip placement="left" trigger={["hover"]} overlay={redemptionsTip} overlayClassName={css.redeemTooltip}>
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
}

interface IMyProps {
  currentAccountAddress?: Address;
  dao: IDAOState;
  daoEthBalance: BN;
  detailView?: boolean;
  proposalState: IProposalState;
}

const ConnectedActionButton = connect(mapStateToProps, mapDispatchToProps)(ActionButton);

export default (props: IMyProps) => {

  const proposalState = props.proposalState;
  let observable: Observable<IRewardState>;
  if (props.currentAccountAddress) {
    observable = proposalState.proposal.rewards({ where: {beneficiary: props.currentAccountAddress}})
      .pipe(map((rewards: Reward[]): Reward => rewards.length === 1 && rewards[0] || null))
      .pipe(mergeMap(((reward) => reward ? reward.state() : of(null))));
  } else {
    observable = of(null);
  }

  return <Subscribe observable={observable}>{(state: IObservableState<any>) => {
    if (state.isLoading) {
      return <div>Loading proposal {props.proposalState.id.substr(0, 6)} ...</div>;
    } else if (state.error) {
      return <div>{ state.error.message }</div>;
    } else {
      const rewardsForCurrentUser = state.data;
      return <ConnectedActionButton {...props} rewardsForCurrentUser={rewardsForCurrentUser} />;
    }
  }
  }</Subscribe>;
};
