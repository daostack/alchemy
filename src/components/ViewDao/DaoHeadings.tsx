import * as React from "react";
import { IDaoState, IProposalState } from "reducers/arcReducer";
import { IDAOState } from '@daostack/client'
import * as css from "./ViewDao.scss";

// TODO: interface needs to use IDAOState
interface IProps {
  dao: IDaoState;
}

export default class DaoHeadings extends React.Component<IProps, null> {

  public render() {
    const { dao } = this.props;

    let latestHeadingProposal = {
      executionTime: 0,
      title: 'DAO Heading: Pass a proposal with a title that starts with \
             "DAO Heading:" to replace this text.'
    };

    dao.proposals.forEach((proposal: IProposalState) => {
      if (proposal.executionTime > latestHeadingProposal.executionTime &&
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
