import { Address, IDAOState, IMemberState, IProposalOutcome, IProposalState } from "@daostack/client";
import { enableWalletProvider } from "arc";

import BN = require("bn.js");
import * as classNames from "classnames";
import Reputation from "components/Account/Reputation";
import * as React from "react";
import { connect } from "react-redux";
import { showNotification } from "reducers/notifications";
import * as css from "./VoteBreakdown.scss";

interface IExternalProps {
  currentAccountAddress: Address;
  currentVote: number;
  daoState: IDAOState;
  detailView?: boolean;
  currentAccountState: IMemberState;
  proposal: IProposalState;
  historyView?: boolean;
}

interface IDispatchProps {
  showNotification: typeof showNotification;
}

type IProps = IExternalProps & IDispatchProps;

interface IState {
  currentVote: number;
  showPreVoteModal: boolean;
}

const mapDispatchToProps = {
  showNotification,
};

class VoteBreakdown extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      currentVote: this.props.currentVote,
      showPreVoteModal: false,
    };
  }

  public async handleClickVote(vote: number, _event: any): Promise<void> {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    if (this.props.currentAccountState.reputation.gt(new BN(0))) {
      this.setState({ showPreVoteModal: true, currentVote: vote });
    }
  }

  public closePreVoteModal(_event: any): void {
    this.setState({ showPreVoteModal: false });
  }

  public render(): RenderOutput {
    const {
      currentVote,
      detailView,
      historyView,
      proposal,
      daoState,
    } = this.props;

    const wrapperClass = classNames({
      [css.wrapper]: true,
      [css.detailView]: detailView,
      [css.historyView]: historyView,
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
            <Reputation daoName={daoState.name} totalReputation={proposal.totalRepWhenCreated} reputation={proposal.votesFor} hideSymbol hideTooltip={!detailView} />
            <b className={css.label}> Rep</b>
          </span>
        </div>
        <div className={voteDownClass}>
          <img className={css.downvote} src="/assets/images/Icon/vote/against-gray.svg"/>
          <img className={css.downvoted} src="/assets/images/Icon/vote/against-fill.svg"/>
          <span className={css.reputation}>
            <span className={css.label}>Against</span>
            <br className={css.label}/>
            <Reputation daoName={daoState.name} totalReputation={proposal.totalRepWhenCreated} reputation={proposal.votesAgainst} hideSymbol hideTooltip={!detailView} />
            <b className={css.label}> Rep</b>
          </span>
        </div>
      </div>
    );
  }
}

export default connect(null, mapDispatchToProps)(VoteBreakdown);
