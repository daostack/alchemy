import { Address, IDAOState, IMemberState, IProposalState, IRewardState, Reward, Stake, Vote } from "@daostack/client";
import { getArc } from "arc";
import { ethErrorHandler } from "lib/util";

import BN = require("bn.js");
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as moment from "moment";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { closingTime } from "reducers/arcReducer";
import { IProfileState } from "reducers/profilesReducer";
import { combineLatest, concat, of, Observable } from "rxjs";
import { map, mergeMap } from "rxjs/operators";

import * as css from "./ProposalCard.scss";

interface IExternalProps {
  currentAccountAddress: Address;
  dao: IDAOState;
  proposalId: string;
  children(props: IInjectedProposalProps): JSX.Element;
}

interface IStateProps {
  beneficiaryProfile?: IProfileState;
  creatorProfile?: IProfileState;
}

type SubscriptionData = [IProposalState, Vote[], Stake[], IRewardState, IMemberState, BN, BN, BN];
type IProps = IStateProps & IExternalProps & ISubscriptionProps<SubscriptionData>;

interface IInjectedProposalProps {
  beneficiaryProfile?: IProfileState;
  creatorProfile?: IProfileState;
  currentAccountGenBalance: BN;
  currentAccountGenAllowance: BN;
  daoEthBalance: BN;
  expired: boolean;
  member: IMemberState;
  proposal: IProposalState;
  rewards: IRewardState;
  stakes: Stake[];
  votes: Vote[];
}

const mapStateToProps = (state: IRootState, ownProps: IExternalProps & ISubscriptionProps<SubscriptionData>): IProps => {
  const proposalState = ownProps.data ? ownProps.data[0] : null;

  return {
    ...ownProps,
    beneficiaryProfile: proposalState && proposalState.contributionReward ? state.profiles[proposalState.contributionReward.beneficiary] : null,
    creatorProfile: proposalState ? state.profiles[proposalState.proposer] : null,
  };
};

interface IState {
  expired: boolean;
}

class ProposalData extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      expired: props.data ? closingTime(props.data[0]).isSameOrBefore(moment()) : false,
    };
  }

  componentDidMount() {
    // Expire proposal in real time

    // Don't schedule timeout if its too long to wait, because browser will fail and trigger the timeout immediately
    const millisecondsUntilExpires = closingTime(this.props.data[0]).diff(moment());
    if (!this.state.expired && millisecondsUntilExpires < 2147483647) {
      setTimeout(() => { this.setState({ expired: true });}, millisecondsUntilExpires);
    }
  }

  render(): RenderOutput {
    const [proposal, votes, stakes, rewards, member, daoEthBalance, currentAccountGenBalance, currentAccountGenAllowance] = this.props.data;
    const { beneficiaryProfile, creatorProfile } = this.props;

    return this.props.children({
      beneficiaryProfile,
      creatorProfile,
      currentAccountGenBalance,
      currentAccountGenAllowance,
      daoEthBalance,
      expired: this.state.expired,
      member,
      proposal,
      rewards,
      stakes,
      votes,
    });
  }
}

const ConnectedProposalData = connect(mapStateToProps)(ProposalData);

export default withSubscription({
  wrappedComponent: ConnectedProposalData,
  // TODO: we might want a different one for each child component, how to pass in to here?
  loadingComponent: (props) => <div className={css.loading}>Loading proposal {props.proposalId.substr(0, 6)} ...</div>,
  // TODO: we might want a different one for each child component, how to pass in to here?
  errorComponent: (props) => <div>{props.error.message}</div>,

  checkForUpdate: ["currentAccountAddress", "proposalId"],

  createObservable: async (props) => {
    const arc = getArc();
    const { currentAccountAddress, dao, proposalId } = props;
    const arcDao = arc.dao(dao.address);
    const proposal = arc.proposal(proposalId);
    await proposal.fetchStaticState();
    const spender = proposal.staticState.votingMachine;

    if (currentAccountAddress) {
      return combineLatest(
        proposal.state(), // state of the current proposal
        proposal.votes({where: { voter: currentAccountAddress }}),
        proposal.stakes({where: { staker: currentAccountAddress }}),
        proposal.rewards({ where: {beneficiary: currentAccountAddress}})
          .pipe(map((rewards: Reward[]): Reward => rewards.length === 1 && rewards[0] || null))
          .pipe(mergeMap(((reward: Reward): Observable<IRewardState> => reward ? reward.state() : of(null)))),

        // we set 'fetchPolicy' to 'cache-only' so as to not send queries for addresses that are not members. The cache is filled higher up.
        // arcDao.member(currentAccountAddress).state({ fetchPolicy: "cache-only"}),
        arcDao.member(currentAccountAddress).state(),
        // TODO: also need the member state for the proposal proposer and beneficiary
        //      but since we need the proposal state first to get those addresses we will need to
        //      update the client query to load them inline
        concat(of(new BN("0")), arcDao.ethBalance())
          .pipe(ethErrorHandler()),
        arc.GENToken().balanceOf(currentAccountAddress)
          .pipe(ethErrorHandler()),
        arc.allowance(currentAccountAddress, spender)
          .pipe(ethErrorHandler())
      );
    } else {
      return combineLatest(
        proposal.state(), // state of the current proposal
        of([]), // votes
        of([]), // stakes
        of(null), // rewards
        of(null), // current account member state
        concat(of(new BN(0)), arcDao.ethBalance()) // dao eth balance
          .pipe(ethErrorHandler()),
        of(new BN(0)), // current account gen balance
        of(null), // current account GEN allowance
      );
    }
  },
});
