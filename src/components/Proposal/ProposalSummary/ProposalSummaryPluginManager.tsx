import { IDAOState, IPluginManagerProposalState, NULL_ADDRESS } from "@daostack/arc.js";
import classNames from "classnames";
import { copyToClipboard, getNetworkName, linkToEtherScan } from "lib/util";
import { pluginNameAndAddress } from "lib/pluginUtils";
import * as React from "react";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import { connect } from "react-redux";
import * as css from "./ProposalSummary.scss";
import * as moment from "moment";
import { GenericPluginRegistry } from "genericPluginRegistry";

interface IDispatchProps {
  showNotification: typeof showNotification;
}

interface IExternalProps {
  beneficiaryProfile?: IProfileState;
  detailView?: boolean;
  daoState: IDAOState;
  proposalState: IPluginManagerProposalState;
  transactionModal?: boolean;
}

type IProps = IExternalProps & IDispatchProps;

interface IState {
  network: string;
}

const mapDispatchToProps = {
  showNotification,
};

class ProposalSummary extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    this.state = {
      network: "",
    };
  }

  private copyToClipboardHandler = (str: string) => (_event: any) => {
    copyToClipboard(str);
    this.props.showNotification(NotificationStatus.Success, "Copied to clipboard!");
  };

  public async componentDidMount (): Promise<void> {
    this.setState({
      network: (await getNetworkName()).toLowerCase(),
    });
  }

  public render(): RenderOutput {
    const { proposalState, detailView, transactionModal } = this.props;
    let pluginName = proposalState.pluginToRegisterName;
    const decodedData = proposalState.pluginToRegisterDecodedData;
    let votingParams;
    let contractToCall;
    if (proposalState.pluginToRemove === NULL_ADDRESS && pluginName !== "ReputationFromToken"){
      votingParams = decodedData.params[2].value;
      if (pluginName === "GenericScheme"){
        contractToCall = decodedData.params[5].value;
        const genericPluginRegistry = new GenericPluginRegistry();
        const genericPluginInfo = genericPluginRegistry.getPluginInfo(decodedData.params[5].value);
        if (genericPluginInfo){
          pluginName = genericPluginInfo.specs.name;
        } else {
          pluginName = "Blockchain Interaction";
        }
      }
      else if (pluginName === "ContributionRewardExt"){
        pluginName = decodedData.params[7].value; // Rewarder name
      }
      else if (pluginName === "SchemeFactory"){
        pluginName = "Plugin Manager";
      }
    }

    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
      [css.withDetails]: true,
    });

    const permissions = parseInt(proposalState.pluginToRegisterPermission, 16);
    const isReplace = proposalState.pluginToRemove !== NULL_ADDRESS && pluginName ? true : false;

    return (
      <div className={proposalSummaryClass}>
        { proposalState.pluginToRemove !== NULL_ADDRESS && !isReplace ?
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
          : pluginName ?
            <div>
              <span className={css.summaryTitle}>
                <b className={css.pluginRegisterIcon}>{isReplace ? <img src="/assets/images/Icon/edit-sm.svg"/> : "+"}</b>&nbsp;
                {isReplace ? "Replace" : "Add"} Plugin&nbsp;
                {isReplace ? pluginNameAndAddress(proposalState.pluginToRemove) : pluginName}
                {isReplace ? " With " + pluginName : ""}
              </span>
              { detailView ?
                <div className={css.summaryDetails}>
                  <table>
                    <tbody>
                      {isReplace ?
                        <tr>
                          <th>
                                Address:
                            <a href={linkToEtherScan(proposalState.pluginToRemove)} target="_blank" rel="noopener noreferrer">
                              <img src="/assets/images/Icon/Link-blue.svg"/>
                            </a>
                          </th>
                          <td>{proposalState.pluginToRemove}</td>
                        </tr>
                        : <></>}
                      <tr>
                        <th>Name:</th>
                        <td>{pluginName}</td>
                      </tr>
                      <tr>
                        <th>Version:</th>
                        <td>{proposalState.pluginToRegisterPackageVersion.join(".")}</td>
                      </tr>
                      <tr>
                        <th>Init Calldata:</th>
                        <td>
                          {proposalState.pluginToRegisterData.substr(0, 10)}...
                          <img className={css.copyButton} src="/assets/images/Icon/Copy-blue.svg" onClick={this.copyToClipboardHandler(proposalState.pluginToRegisterData)} />
                        </td>
                      </tr>

                      { votingParams && (
                        <React.Fragment>
                          <tr><th>Queued Vote Required:</th><td>{votingParams[0]}%</td></tr>
                          <tr><th>Queued Vote Period Limit:</th><td>{votingParams[1]}</td></tr>
                          <tr><th>Boosted Vote Period Limit:</th><td>{votingParams[2]}</td></tr>
                          <tr><th>Pre-Boosted Vote Period Limit:</th><td>{votingParams[3]}</td></tr>
                          <tr><th>Threshold Const:</th><td>{votingParams[4]}</td></tr>
                          <tr><th>Quiet Ending Period:</th><td>{votingParams[5]}</td></tr>
                          <tr><th>Proposing Reputation Reward:</th><td>{votingParams[6]}</td></tr>
                          <tr><th>Voters Reputation Loss Ratio:</th><td>{votingParams[7]}%</td></tr>
                          <tr><th>Minimum DAO Bounty:</th><td>{votingParams[8]}</td></tr>
                          <tr><th>DAO Bounty Const:</th><td>{votingParams[9]}</td></tr>
                          <tr><th>Activation Time:</th><td>{ moment.unix(votingParams[10]).format("YYYY-MM-DD HH:mm")}</td></tr>
                          {contractToCall && <tr><th>Contract to Call:</th><td>{contractToCall}</td></tr>}
                        </React.Fragment>)
                      }
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

export default connect(null, mapDispatchToProps)(ProposalSummary);
