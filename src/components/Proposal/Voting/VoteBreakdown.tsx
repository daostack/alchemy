import { Address, IDAOState, IMemberState, IProposalOutcome, IProposalState } from "@daostack/client";
import { enableWeb3ProviderAndWarn, getArc } from "arc";

import BN = require("bn.js");
import * as classNames from "classnames";
import Reputation from "components/Account/Reputation";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as React from "react";
import { connect } from "react-redux";
import { showNotification } from "reducers/notifications";
import { of } from "rxjs";
import * as css from "./VoteBreakdown.scss";

interface IContainerProps {
  currentAccountAddress: Address;
  currentAccountState: IMemberState|undefined;
  currentVote: number;
  dao: IDAOState;
  detailView?: boolean;
  proposal: IProposalState;
  showNotification: typeof showNotification;
}

interface IState {
  currentVote: number;
  showPreVoteModal: boolean;
}

const mapDispatchToProps = {
  showNotification,
};

class VoteBreakdown extends React.Component<IContainerProps, IState> {

  constructor(props: IContainerProps) {
    super(props);

    this.state = {
      currentVote: this.props.currentVote,
      showPreVoteModal: false,
    };
  }

  public async handleClickVote(vote: number, _event: any): Promise<void> {
    if (!(await enableWeb3ProviderAndWarn(this.props.showNotification))) { return; }
    const { currentAccountState } = this.props;
    if (currentAccountState.reputation.gt(new BN(0))) {
      this.setState({ showPreVoteModal: true, currentVote: vote });
    }
  }

  public closePreVoteModal(_event: any): void {
    this.setState({ showPreVoteModal: false });
  }

  public render(): any {
    const {
      currentVote,
      detailView,
      proposal,
      dao,
    } = this.props;

    const wrapperClass = classNames({
      [css.wrapper]: true,
      [css.detailView]: detailView,
    });

    const voteUpClass = classNames({
      [css.voteBreakdown]: true,
      [css.voteUp]: true,
      [css.votedFor]: currentVote === IProposalOutcome.Pass,
    });

    const voteDownClass = classNames({
      [css.voteBreakdown]: true,
      [css.voteDown]: true,
      [css.votedAgainst]: currentVote === IProposalOutcome.Fail,
    });

    return (
      <div className={wrapperClass}>
        <div className={voteUpClass}>
          <img className={css.upvote} src="/assets/images/Icon/vote/for-gray.svg"/>
          <img className={css.upvoted} src="/assets/images/Icon/vote/for-fill.svg"/>
          <span className={css.reputation}>
            <span className={css.label}>For</span>
            <br className={css.label}/>
            <Reputation daoName={dao.name} totalReputation={proposal.totalRepWhenCreated} reputation={proposal.votesFor} hideSymbol hideTooltip={!detailView} />
            <b className={css.label}> Rep</b>
          </span>
        </div>
        <div className={voteDownClass}>
          <img className={css.downvote} src="/assets/images/Icon/vote/against-gray.svg"/>
          <img className={css.downvoted} src="/assets/images/Icon/vote/against-fill.svg"/>
          <span className={css.reputation}>
            <span className={css.label}>Against</span>
            <br className={css.label}/>
            <Reputation daoName={dao.name} totalReputation={proposal.totalRepWhenCreated} reputation={proposal.votesAgainst} hideSymbol hideTooltip={!detailView} />
            <b className={css.label}> Rep</b>
          </span>
        </div>
      </div>
    );
  }
}

const ConnectedVoteBreakdown = connect(null, mapDispatchToProps)(VoteBreakdown);

interface IProps {
  currentAccountAddress: Address;
  currentVote: number;
  dao: IDAOState;
  detailView?: boolean;
  proposal: IProposalState;
}

export default (props: IProps) => {

  const arc = getArc();
  const dao = arc.dao(props.dao.address);
  const observable = props.currentAccountAddress ? dao.member(props.currentAccountAddress).state() : of(null);

  return <Subscribe observable={observable} name="Vot Breakdown">{
    (state: IObservableState<IMemberState>): any => {
      if (state.isLoading) {
        return <div>Loading votebox...</div>;
      } else if (state.error) {
        return <div>{ state.error.message }</div>;
      } else {
        return <ConnectedVoteBreakdown currentAccountState={state.data} {...props} />;
      }
    }
  }</Subscribe>;
};
