import * as classNames from "classnames";
import { DiscussionEmbed } from 'disqus-react';
import * as moment from "moment";
import { denormalize } from "normalizr";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link, Route, RouteComponentProps, Switch } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
// import { IProposalState } from "reducers/arcReducer";
import * as selectors from "selectors/daoSelectors";
import * as schemas from "schemas";

// import { ConnectedProposalContainer as ProposalContainer } from "./ProposalContainer";
import ProposalContainer from "./ProposalContainer";
import Subscribe, { IObservableState } from "components/Shared/Subscribe"
import { IDAOState, IProposalState, ProposalStage } from '@daostack/client'

import * as css from "./ViewProposal.scss";
import { arc } from "arc";

interface IProps extends RouteComponentProps<any> {
  proposal: IProposalState;
}

class ViewProposalContainer extends React.Component<IProps, null> {
  public render() {
    const { proposal } = this.props;

    const disqusConfig = {
      url: process.env.BASE_URL + this.props.location.pathname,
      identifier: proposal.id,
      title: proposal.title
    };

    return(
      <div>
        <div className={css.proposalsHeader}>
          Viewing proposal: {proposal.title}
        </div>
        <div className={css.proposal}>
          <ProposalContainer proposalId={proposal.id} />
        </div>
        <DiscussionEmbed shortname={process.env.DISQUS_SITE} config={disqusConfig} />
      </div>
    )
  }
}

export default (props: { proposalId: string} & RouteComponentProps<any>) =>
  <Subscribe observable={arc.proposal(props.proposalId).state}>{(state: IObservableState<IProposalState>) => {
      if (state.data) {
        return <ViewProposalContainer proposal={state.data} {...props}/>
      } else if (state.error) {
        return <div>{ state.error.message }</div>
      } else {
        return <div>Loading...</div>
      }
    }
  }</Subscribe>
