import { Address, IDAOState, IProposalStage, IProposalState, IRewardState } from "@daostack/client";
import { executeProposal, redeemProposal } from "actions/arcActions";
import { checkMetaMaskAndWarn } from "arc";
import { getArc } from "arc";
import BN = require("bn.js");
import * as classNames from "classnames";
import { ActionTypes, default as PreTransactionModal } from "components/Shared/PreTransactionModal";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import gql from "graphql-tag";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { proposalEnded } from "reducers/arcReducer";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import { Observable, of} from "rxjs";
import RedemptionsString from "./RedemptionsString";
import RedemptionsTip from "./RedemptionsTip";

import * as css from "./ActionButton.scss";

interface IStateProps {
  beneficiaryProfile: IProfileState;
}

interface IContainerProps {
  currentAccountAddress?: Address;
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
    beneficiaryProfile: proposal.contributionReward ? state.profiles[proposal.contributionReward.beneficiary] : null,
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
    if (!(await checkMetaMaskAndWarn(this.props.showNotification.bind(this)))) { return; }
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
      proposal,
      redeemProposal,
      rewardsForCurrentUser
    } = this.props;

    const executable = proposalEnded(proposal) && !proposal.executedAt;

    let accountHasRewards, beneficiaryHasRewards, redeemable = false, redemptionsTip, redeemButtonClass;
    if (proposal.contributionReward) {
      const contributionReward = proposal.contributionReward;

      // TODO: should be the DAO balance of the proposal.externalToken
      //const externalTokenBalance = dao.externalTokenBalance || new BN(0);

      beneficiaryHasRewards = (
        !contributionReward.reputationReward.isZero() ||
        contributionReward.nativeTokenReward.gt(new BN(0)) ||
        (contributionReward.ethReward.gt(new BN(0)) && daoEthBalance.gte(contributionReward.ethReward)) ||
        (contributionReward.externalTokenReward.gt(new BN(0))) // && externalTokenBalance.gte(contributionReward.externalTokenReward))
      ) as boolean;

      accountHasRewards = rewardsForCurrentUser.length !== 0;
      redeemable = proposal.executedAt && (accountHasRewards || beneficiaryHasRewards);

      redemptionsTip = RedemptionsTip({
        beneficiaryHasRewards,
        currentAccountAddress,
        dao,
        proposal,
        rewardsForCurrentUser
      });

      redeemButtonClass = classNames({
        [css.redeemButton]: true,
      });
    }

    const wrapperClass = classNames({
      [css.wrapper]: true,
      [css.detailView]: detailView
    });

    return (
      <div className={wrapperClass}>
        {this.state.preRedeemModalOpen ?
          <PreTransactionModal
            actionType={executable && !redeemable ? ActionTypes.Execute : ActionTypes.Redeem}
            action={redeemProposal.bind(null, dao.address, proposal.id, proposal.contributionReward.beneficiary)}
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
              { /* space after <span> is there on purpose */ }
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
              { /* space after <span> is there on purpose */ }
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
                  data-test-id="button-redeem"
                >
                  <img src="/assets/images/Icon/redeem.svg" />
                  {
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

const ConnectedActionButton = connect(mapStateToProps, mapDispatchToProps)(ActionButton);

interface IMyProps {
  currentAccountAddress?: Address;
  dao: IDAOState;
  daoEthBalance: BN;
  detailView?: boolean;
  expired: boolean;
  proposal: IProposalState;
}

export default (props: IMyProps) => {

  const arc = getArc();
  const proposal = props.proposal;
  let observable: Observable<any[]>;
  if (props.currentAccountAddress) {
    const query = gql`       {
      gprewards (where: {
        beneficiary: "${props.currentAccountAddress}"
        proposal: "${proposal.id}"
      }) {
        id
        tokensForStaker
        daoBountyForStaker
        reputationForVoter
        reputationForProposer
        beneficiary
      }
    }`;
    observable = arc.getObservable(query);
  } else {
    observable = of([[]]);
  }

  return <Subscribe observable={observable}>{(state: IObservableState<any>) => {
      if (state.isLoading) {
        return <div>Loading proposal {proposal.id.substr(0, 6)} ...</div>;
      } else if (state.error) {
        return <div>{ state.error.message }</div>;
      } else {
        let rewardsForCurrentUser: any[];
        if (props.currentAccountAddress) {
          const rewardsFromGraphQl = state.data.data.gprewards;
          rewardsForCurrentUser = rewardsFromGraphQl.map((obj: any) => {
            return {
              id: obj.id,
              tokensForStaker: new BN(obj.tokensForStaker),
              daoBountyForStaker: new BN(obj.daoBountyForStaker),
              reputationForVoter: new BN(obj.reputationForVoter),
              reputationForProposer: new BN(obj.reputationForProposer),
              beneficiary: obj.beneficiary
            };
          });
        } else {
          rewardsForCurrentUser = [];
        }
        return <ConnectedActionButton { ...props} rewardsForCurrentUser={rewardsForCurrentUser} />;
      }
    }
  }</Subscribe>;
};
