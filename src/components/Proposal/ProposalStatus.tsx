import { Address, IDAOState, IProposalStage, IProposalState, IRewardState, Reward } from "@daostack/client";
import { executeProposal, redeemProposal } from "actions/arcActions";
import { checkMetaMaskAndWarn } from "arc";
import BN = require("bn.js");
import * as classNames from "classnames";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as moment from "moment";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { closingTime } from "reducers/arcReducer";
import { proposalFailed, proposalPassed, proposalEnded } from "reducers/arcReducer";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import { Observable, of } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import * as css from "./ProposalStatus.scss";
/* import RedemptionsString from "./RedemptionsString"; */
// import RedemptionsTip from "./RedemptionsTip";

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
  return {
    ...ownProps,
    beneficiaryProfile: proposalState.contributionReward ? state.profiles[proposalState.contributionReward.beneficiary] : null,
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

class ProposalStatus extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
  }

  public async handleClickExecute(event: any) {
    if (!(await checkMetaMaskAndWarn(this.props.showNotification.bind(this)))) { return; }
    await this.props.executeProposal(this.props.dao.address, this.props.proposalState.id, this.props.currentAccountAddress);
  }

  public render() {
    const {
      // currentAccountAddress,
      proposalState,
    } = this.props;

    // const executable = proposalEnded(proposalState) && !proposalState.executedAt;
    const ended = proposalEnded(proposalState);
    const expired = !ended && closingTime(proposalState).isSameOrBefore(moment());
    const passed = ended && proposalPassed(proposalState);
    const failed = ended && proposalFailed(proposalState);

    const wrapperClass = classNames({
      [css.wrapper]: true
      //, [css.detailView]: detailView
    });

    return (
      <div className={wrapperClass}>
        {((proposalState.stage === IProposalStage.Queued) && !expired) ?
          <div className={classNames({
            [css.status]: true,
            [css.regular]: true
          })}>Regular</div> :
          ((proposalState.stage === IProposalStage.PreBoosted) && !expired) ?
            <div className={classNames({
              [css.status]: true,
              [css.pending]: true
            })}><img src="/assets/images/Icon/pending.svg" />Pending</div> :
            (proposalState.stage === IProposalStage.Boosted && !expired) ?
              <div className={classNames({
                [css.status]: true,
                [css.boosted]: true
              })}><img src="/assets/images/Icon/boosted.svg" />Boosted</div> :
              (passed) ?
                <div className={classNames({
                  [css.status]: true,
                  [css.boosted]: true
                })}><img src="/assets/images/Icon/boosted.svg" />Passed</div> :
                (failed) ?
                  <div className={classNames({
                    [css.status]: true,
                    [css.boosted]: true
                  })}><img src="/assets/images/Icon/boosted.svg" />Failed</div> :
                  (ended) ?
                    <div className={classNames({
                      [css.status]: true,
                      [css.expired]: true
                    })}>Expired</div> :
                    <div className={classNames({
                      [css.status]: true,
                      [css.expired]: true
                    })}>???</div>
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

const ConnectedProposalStatus = connect(mapStateToProps, mapDispatchToProps)(ProposalStatus);

export default (props: IMyProps) => {

  const proposalState = props.proposalState;
  let observable: Observable<IRewardState>;
  if (props.currentAccountAddress) {
    observable = proposalState.proposal.rewards({ beneficiary: props.currentAccountAddress })
      .pipe(map((rewards: Reward[]): Reward => rewards.length === 1 && rewards[0] || null))
      .pipe(mergeMap(((reward) => reward ? reward.state() : of(null))));
  } else {
    observable = of(null);
  }

  return <Subscribe observable={observable}>{(state: IObservableState<any>) => {
    if (state.isLoading) {
      return <div>Loading proposal {props.proposalState.id.substr(0, 6)} ...</div>;
    } else if (state.error) {
      return <div>{state.error.message}</div>;
    } else {
      const rewardsForCurrentUser = state.data;
      return <ConnectedProposalStatus {...props} rewardsForCurrentUser={rewardsForCurrentUser} />;
    }
  }
  }</Subscribe>;
};
