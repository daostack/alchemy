import * as classNames from "classnames";
import { DiscussionEmbed, CommentCount } from 'disqus-react';
import * as moment from "moment";
import { denormalize } from "normalizr";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link, Route, RouteComponentProps, Switch } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IProposalState } from "reducers/arcReducer";
import * as selectors from "selectors/daoSelectors";
import * as schemas from "schemas";

import ProposalContainer from "./ProposalContainer";

import * as css from "./ViewProposal.scss";

import SharingButtons from "../Shared/SharingButtons";

interface IStateProps extends RouteComponentProps<any> {
  proposal: IProposalState;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    proposal: state.arc.proposals[ownProps.match.params.proposalId],
  };
};

interface IDispatchProps {
  getProposal: typeof arcActions.getProposal;
}

const mapDispatchToProps = {
  getProposal: arcActions.getProposal
};

type IProps = IStateProps & IDispatchProps;

class ViewProposalContainer extends React.Component<IProps, null> {

  public componentDidMount() {}

  public render() {
    const { proposal } = this.props;

    const disqusShortname = 'daostack-alchemy';
    const disqusConfig = {
      url: process.env.BASE_URL + "/" + this.props.location.pathname,
      identifier: proposal.proposalId,
      title: proposal.title
    };

    if (proposal) {
      return(
        <div>
          <div className={css.proposalsHeader}>
            Viewing proposal: {proposal.title}
            <div className={css.sharingButtons}>
              <SharingButtons size={16} shareText={proposal.title}/>
            </div>
          </div>
          <div className={css.proposal}>
            <ProposalContainer proposalId={proposal.proposalId}/>
          </div>
          <DiscussionEmbed shortname={disqusShortname} config={disqusConfig} />
        </div>
      );
    } else {
      return (<div>Loading... </div>);
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewProposalContainer);
