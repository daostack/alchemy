import * as classNames from "classnames";
import * as React from "react";
import { Link } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IDaoState, IProposalState } from "reducers/arcReducer";
import HashtaggedTitle from "../shared/HashtaggedTitle";

import * as css from "./ViewDao.scss";

interface IProps {
  dao: IDaoState;
}

export default class DaoHeadings extends React.Component<IProps, null> {

  public render() {
    const { dao } = this.props;

    let latestHeadingProposal: IProposalState = {} as any;
    latestHeadingProposal.executionTime = 0;
    latestHeadingProposal.title = 'Pass a proposal that includes the hashtag \
                                  #heading to replace this text.'

    dao.proposals.forEach((proposal: IProposalState) => {
      console.log(proposal);
      if (proposal.executionTime > latestHeadingProposal.executionTime &&
          !!proposal.title.match(/\B\#\bheading\b/i)) {
            latestHeadingProposal = proposal;
      }
    });

    return (
      <div className={css.daoHeadings + " " + css.clearfix}>
        <HashtaggedTitle proposal={latestHeadingProposal} />
      </div>
    );
  }
}
