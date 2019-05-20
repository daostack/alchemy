import { IDAOState, IProposalState, IProposalType } from "@daostack/client";
import * as classNames from "classnames";
import { getNetworkName } from "lib/util";
import * as React from "react";
import { IProfileState } from "reducers/profilesReducer";
import * as css from "./ProposalSummary.scss";
import ProposalSummaryContributionReward from "./ProposalSummaryContributionReward";
import ProposalSummaryGenericScheme from "./ProposalSummaryGenericScheme";
import ProposalSummarySchemeRegistrar from "./ProposalSummarySchemeRegistrar";

interface IProps {
  beneficiaryProfile?: IProfileState;
  detailView?: boolean;
  dao: IDAOState;
  proposal: IProposalState;
  transactionModal?: boolean;
}

interface IState {
  network: string;
}

export default class ProposalSummary extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    this.state = { network: "" };
  }

  public async componentWillMount() {
    this.setState({ network: (await getNetworkName()).toLowerCase() });
  }

  public render() {

    const { proposal, detailView, transactionModal } = this.props;

    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
    });

    if (proposal.contributionReward) {
      return <ProposalSummaryContributionReward {...this.props} />;
    } else if (proposal.schemeRegistrar) {
      return <ProposalSummarySchemeRegistrar {...this.props} />;
    } else if (proposal.type === IProposalType.GenericScheme) {
      return <ProposalSummaryGenericScheme {...this.props} />;
    } else {
      return <div className={proposalSummaryClass}>Unknown proposal!! </div>;
    }
  }
}
