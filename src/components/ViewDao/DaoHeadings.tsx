import * as classNames from "classnames";
import * as React from "react";
import { Link } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IDaoState, IProposalState } from "reducers/arcReducer";

import * as css from "./ViewDao.scss";

interface IProps {
  dao: IDaoState;
}

export default class DaoHeadings extends React.Component<IProps, null> {

  public render() {
    const { dao } = this.props;
    console.log(dao);

    var latestHeadingProposal = {
      executionTime: 0,
      title: 'DAO Heading: Pass a proposal with a title that starts with \
             "DAO Heading:" to replace this text.'
    };

    dao.proposals.forEach((proposal: IProposalState) => {
      if(proposal.executionTime > latestHeadingProposal.executionTime &&
      proposal.title.slice(0, 12) === "DAO Heading:") {
        latestHeadingProposal = proposal;
      }
    });
    
    return (
      <div className={css.daoHeadings + " " + css.clearfix}>
        { latestHeadingProposal.title.slice(13) }
      </div>
    );
  }
}
