import { IDAOState, ISchemeRegistrarProposalState, ProposalName } from "@daostack/arc.js";
import classNames from "classnames";
import { copyToClipboard, getNetworkName, linkToEtherScan } from "lib/util";
import { pluginNameAndAddress } from "lib/pluginUtils";
import * as React from "react";
import { IProfileState } from "reducers/profilesReducer";
import * as css from "./ProposalSummary.scss";

interface IProps {
  beneficiaryProfile?: IProfileState;
  detailView?: boolean;
  daoState: IDAOState;
  proposalState: ISchemeRegistrarProposalState;
  transactionModal?: boolean;
}

interface IState {
  network: string;

}

export default class ProposalSummary extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    this.state = {
      network: "",
    };

  }

  public async componentDidMount (): Promise<void> {
    this.setState({ network: (await getNetworkName()).toLowerCase() });
  }

  private copyPluginAddressOnClick = (proposalState: ISchemeRegistrarProposalState) => (): void => copyToClipboard(proposalState.pluginToRegister);

  public render(): RenderOutput {
    const { proposalState, detailView, transactionModal } = this.props;

    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
      [css.withDetails]: true,
    });

    const permissions = parseInt(proposalState.pluginToRegisterPermission, 16);

    return (
      <div className={proposalSummaryClass}>
        { proposalState.pluginToRemove  ?
          <div>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/delete.svg"/>&nbsp;
                  Remove Plugin&nbsp;
              <a href={linkToEtherScan(proposalState.pluginToRemove)} target="_blank" rel="noopener noreferrer">{pluginNameAndAddress(proposalState.pluginToRemove)}</a>
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
                <table><tbody>
                  <tr>
                    <th>
                          Address:
                      <a href={linkToEtherScan(proposalState.pluginToRemove)} target="_blank" rel="noopener noreferrer">
                        <img src="/assets/images/Icon/Link-blue.svg"/>
                      </a>
                    </th>
                    <td>{proposalState.pluginToRemove}</td>
                  </tr>
                </tbody></table>
              </div>
              : ""
            }
          </div>
          : proposalState.pluginToRegister ?
            <div>
              <span className={css.summaryTitle}>
                <b className={css.pluginRegisterIcon}>{proposalState.type === "SchemeRegistrarEdit" ? <img src="/assets/images/Icon/edit-sm.svg"/> : "+"}</b>&nbsp;
                {proposalState.type === "SchemeRegistrarEdit" ? "Edit" : "Add"} Plugin&nbsp;
                <a href={linkToEtherScan(proposalState.pluginToRegister)} target="_blank" rel="noopener noreferrer">{pluginNameAndAddress(proposalState.pluginToRegister)}</a>
              </span>
              { detailView ?
                <div className={css.summaryDetails}>
                  <table>
                    <tbody>
                      <tr>
                        <th>
                          Address:
                          <a href={linkToEtherScan(proposalState.pluginToRegister)} target="_blank" rel="noopener noreferrer">
                            <img src="/assets/images/Icon/Link-blue.svg"/>
                          </a>
                        </th>
                        <td>
                          <span>{proposalState.pluginToRegister}</span>
                          <img src="/assets/images/Icon/Copy-blue.svg" onClick={this.copyPluginAddressOnClick(proposalState)} />
                        </td>
                      </tr>
                      <tr>
                        <th>Permissions:</th>
                        <td>
                          {
                            // eslint-disable-next-line no-bitwise
                            permissions & 2 ? <div>Register other Plugins</div> : ""
                          }
                          {
                            // eslint-disable-next-line no-bitwise
                            permissions & 4 ? <div>Change constraints</div> : ""
                          }
                          {
                            // eslint-disable-next-line no-bitwise
                            permissions & 8 ? <div>Upgrade the controller</div> : ""
                          }
                          {
                            // eslint-disable-next-line no-bitwise
                            permissions & 16 ? <div>Call genericCall on behalf of</div> : ""
                          }
                          {
                            <div>Mint or burn reputation</div>
                          }
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                : ""
              }
            </div>
            :
            ""
        }
      </div>
    );
  }
}
