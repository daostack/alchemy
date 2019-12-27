import { IDAOState, IProposalState, Address } from "@daostack/client";
import * as React from "react";
import TrainingTooltip from "components/Shared/TrainingTooltip";

// import UserSearchField from "components/Shared/UserSearchField";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { of } from "rxjs";

import BN = require("bn.js");
import { formatTokens } from "lib/util";
import * as css from "./Competitions.scss";

// FAKE
interface ISubscriptionState {
  title: string;
  description: string;
  proposer: Address;
  reputationVoted: BN;
  accounthasVoted: boolean;
  isWinner: boolean;
  votingIsActive: boolean;
}

interface IExternalProps {
  daoState: IDAOState;
  proposalState: IProposalState;
  suggestionId: string;
  handleClose: () => any;
  handleVote: () => any;
}

type IProps = IExternalProps & ISubscriptionProps<ISubscriptionState>;

class SolutionDetails extends React.Component<IProps, null> {

  public handleVote = async (): Promise<void> => {
    this.props.handleVote();
  }

  public render(): RenderOutput {
    // const { proposalState } = this.props;
    const subscriptionState = this.props.data;

    return (
      <div className={css.solutionDetails}>
        <div className={css.closeButton}>Close Button</div>
        <div className={css.reputationVoted}>
          <img src="/assets/images/Icon/vote/for-gray.svg"/>
          {formatTokens(subscriptionState.reputationVoted)}
        </div>
        { subscriptionState.isWinner ? 
          <img src="/assets/images/Icon/winner.svg"></img>
          : 
          subscriptionState.accounthasVoted ?
            <TrainingTooltip overlay="Vote yes for this solution">
              <div className={css.voteButton}>Vote Button</div>
            </TrainingTooltip> : ""
        }
        
        <div className={css.proposer}>{subscriptionState.proposer}</div>
        <div className={css.description}>{subscriptionState.title}</div>
        <div className={css.description}>{subscriptionState.description}</div>
      </div>
    );
  }
}

export default withSubscription({
  wrappedComponent: SolutionDetails,
  loadingComponent: null,
  errorComponent: (props) => <div>{ props.error.message }</div>,
  checkForUpdate: ["suggestionId"],
  createObservable: (_props: IExternalProps) => {
    // FAKE
    return of({
      proposer: "Proposer",
      reputationVoted: new BN("56000000000000000"),
      title:"Title",
      accounthasVoted: true,
      description: "Description",
    });
  },
});
