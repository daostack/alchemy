import { Address, IProposalState, IDAOState, IMemberState, IRewardState, Reward, Stake, Vote, Proposal, Member, IContributionRewardProposalState } from "@daostack/arc.js";
import { getArc } from "arc";
import { ethErrorHandler, ethBalance } from "lib/util";

import BN = require("bn.js");
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as moment from "moment";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { closingTime } from "lib/proposalHelpers";
import { IProfileState } from "reducers/profilesReducer";
import { combineLatest, concat, of, Observable } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { GRAPH_POLL_INTERVAL } from "../../settings";

import * as css from "./ProposalCard.scss";

interface IExternalProps {
  currentAccountAddress: Address;
  daoState: IDAOState;
  proposalId: string;
  children(props: IInjectedProposalProps): JSX.Element;
  /**
   * true to subscribe to changes in votes, stakes and rewards
   */
  subscribeToProposalDetails?: boolean;
}

interface IStateProps {
  beneficiaryProfile?: IProfileState;
  creatorProfile?: IProfileState;
}

type SubscriptionData = [IProposalState, Vote[], Stake[], IRewardState, IMemberState|null, BN, BN, BN];
type IPreProps = IStateProps & IExternalProps & ISubscriptionProps<SubscriptionData>;
type IProps = IStateProps & IExternalProps & ISubscriptionProps<SubscriptionData>;

export interface IInjectedProposalProps {
  beneficiaryProfile?: IProfileState;
  creatorProfile?: IProfileState;
  currentAccountGenBalance: BN;
  currentAccountGenAllowance: BN;
  daoEthBalance: BN;
  expired: boolean;
  member: IMemberState;
  proposalState: IProposalState;
  rewards: IRewardState;
  stakes: Stake[];
  votes: Vote[];
}

const mapStateToProps = (state: IRootState, ownProps: IExternalProps & ISubscriptionProps<SubscriptionData>): IPreProps => {
  const proposalState = ownProps.data[0];
  //const proposalState = proposal ? proposal.coreState : null;
  const crState = proposalState as IContributionRewardProposalState;

  return {
    ...ownProps,
    beneficiaryProfile: proposalState && proposalState.name === "ContributionReward" ? state.profiles[crState.beneficiary] : null,
    creatorProfile: proposalState ? state.profiles[proposalState.proposer] : null,
  };
};

interface IState {
  expired: boolean;
}

class ProposalData extends React.Component<IProps, IState> {
  private expireTimeout: any;

  constructor(props: IProps) {
    super(props);

    if (props.data && props.data[0]) {
      const proposalState = props.data[0];

      this.state = {
        expired: proposalState ? closingTime(proposalState).isSameOrBefore(moment()) : false,
      };
    } else {
      this.state = {
        expired: false,
      };
    }
  }

  async componentDidMount() {
    if (!this.props.data || !this.props.data[0]) {
      return;
    }

    // Expire proposal in real time
    // Don't schedule timeout if its too long to wait, because browser will fail and trigger the timeout immediately
    const millisecondsUntilExpires = closingTime(this.props.data[0]).diff(moment());
    if (!this.state.expired && millisecondsUntilExpires < 2147483647) {
      this.expireTimeout = setTimeout(() => { this.setState({ expired: true });}, millisecondsUntilExpires);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.expireTimeout);
  }

  render(): RenderOutput {
    if (!this.props.data || !this.props.data[0]) {
      return <></>;
    }

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
      proposalState: proposal,
      rewards,
      stakes,
      votes,
    });
  }
}

const ConnectedProposalData = connect(mapStateToProps, null)(ProposalData);

export default withSubscription({
  wrappedComponent: ConnectedProposalData,
  // TODO: we might want a different one for each child component, how to pass in to here?
  loadingComponent: (props) => <div className={css.loading}>Loading proposal {props.proposalId.substr(0, 6)} ...</div>,
  // TODO: we might want a different one for each child component, how to pass in to here?
  errorComponent: (props) => <div>{props.error.message}</div>,

  checkForUpdate: ["currentAccountAddress", "proposalId"],

  createObservable: async (props) => {
    const arc = getArc();
    const { currentAccountAddress, daoState, proposalId } = props;
    //const dao = arc.dao(daoState.address);
    const proposal = await Proposal.create(arc, proposalId);
    await proposal.fetchState();
    const spender = proposal ? proposal.coreState.votingMachine : "0x0000000000000000000000000000000000000000";

    if (currentAccountAddress) {
      const member = new Member(arc, Member.calculateId({
        address: currentAccountAddress,
        contract: daoState.reputation.id,
      }));
      const memberState = await member.fetchState().catch(() => ({ reputation: new BN(0) }));


      return combineLatest(
        proposal.state({ polling: true, pollInterval: GRAPH_POLL_INTERVAL }), // state of the current proposal
        proposal.votes({where: { voter: currentAccountAddress }}, { polling: true, pollInterval: GRAPH_POLL_INTERVAL }),
        proposal.stakes({where: { staker: currentAccountAddress }}, { polling: true, pollInterval: GRAPH_POLL_INTERVAL }),
        proposal.rewards({ where: {beneficiary: currentAccountAddress}}, { polling: true, pollInterval: GRAPH_POLL_INTERVAL })
          .pipe(map((rewards: Reward[]): Reward => rewards.length === 1 && rewards[0] || null))
          .pipe(mergeMap(((reward: Reward): Observable<IRewardState> => reward ? reward.state() : of(null)))),

        of(memberState),
        // TODO: also need the member state for the proposal proposer and beneficiary
        //      but since we need the proposal state first to get those addresses we will need to
        //      update the client query to load them inline
        concat(of(new BN("0")), await ethBalance(daoState.address)
          .pipe(ethErrorHandler())),
        arc.GENToken().balanceOf(currentAccountAddress)
          .pipe(ethErrorHandler()),
        arc.allowance(currentAccountAddress, spender)
          .pipe(ethErrorHandler())
      );
    } else {
      return combineLatest(
        proposal.state({ polling: true, pollInterval: GRAPH_POLL_INTERVAL }), // state of the current proposal
        of([]), // votes
        of([]), // stakes
        of(null), // rewards
        of(null), // current account member state
        concat(of(new BN(0)), await ethBalance(daoState.address)) // dao eth balance
          .pipe(ethErrorHandler()),
        of(new BN(0)), // current account gen balance
        of(null) // current account GEN allowance
      );
    }
  },
});
