import { IDAOState, IJoinProposalState } from "@daostack/arc.js";
import classNames from "classnames";
import { getNetworkName, linkToEtherScan, fromWei } from "lib/util";
import * as React from "react";
import { IProfileState } from "reducers/profilesReducer";
import i18next from "i18next";
import * as css from "./ProposalSummary.scss";

interface IExternalProps {
  beneficiaryProfile?: IProfileState;
  detailView?: boolean;
  daoState: IDAOState;
  proposalState: IJoinProposalState;
  transactionModal?: boolean;
}

interface IState {
  network: string;
}

type IProps = IExternalProps;

export default class ProposalSummary extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    this.state = {
      network: "",
    };

  }

  public async componentDidMount(): Promise<void> {
    this.setState({ network: (await getNetworkName()).toLowerCase() });
  }

  public render(): RenderOutput {
    const { proposalState, detailView, transactionModal } = this.props;
    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
      [css.withDetails]: true,
    });

    return (
      <div className={proposalSummaryClass}>
        <div>
          <span className={css.summaryTitle}>
            <a href={linkToEtherScan(proposalState.name)} target="_blank" rel="noopener noreferrer">{proposalState.name}</a>
          </span>
          {detailView &&
            <div className={css.summaryDetails}>
              <table><tbody>
                <tr>
                  <th>
                    {i18next.t("Address")}
                    <a href={linkToEtherScan(proposalState.proposedMember)} target="_blank" rel="noopener noreferrer">
                      <img src="/assets/images/Icon/Link-blue.svg" />
                    </a>
                  </th>
                  <td>{proposalState.proposedMember}</td>
                </tr>
                <tr><th>{i18next.t("Funding")}</th><td>{fromWei(proposalState.funding)}</td></tr>
                <tr><th>{i18next.t("Reputation Minted")}</th><td>{fromWei(proposalState.reputationMinted)}</td></tr>
                <tr><th>{i18next.t("Minimum DAO bounty")}</th><td>{fromWei(proposalState.genesisProtocolParams.minimumDaoBounty)}</td></tr>
              </tbody></table>
            </div>
          }
        </div>
      </div>
    );
  }
}
