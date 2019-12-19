import * as React from 'react';
import { GenericSchemeInfo } from "genericSchemeRegistry";
import { IProposalState } from "@daostack/client";

interface IProps {
  genericSchemeInfo: GenericSchemeInfo;
  detailView?: boolean;
  proposal: IProposalState;
  transactionModal?: boolean;
}

export default class ProposalSummaryWikiUpdate extends React.Component<IProps> {
  public render(): RenderOutput {
    return (
      <div>
      </div>
    )
  }
}