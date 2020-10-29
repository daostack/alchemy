import { IDAOState, IPluginManagerProposalState, NULL_ADDRESS, IGenesisProtocolParams } from "@daostack/arc.js";
import classNames from "classnames";
import { copyToClipboard, getNetworkName, linkToEtherScan } from "lib/util";
import { pluginNameAndAddress } from "lib/pluginUtils";
import * as React from "react";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import { connect } from "react-redux";
import * as css from "./ProposalSummary.scss";
import { GenericPluginRegistry } from "genericPluginRegistry";
import { PLUGIN_NAMES } from "lib/pluginUtils";
import { renderGpParams } from "components/Plugin/PluginInfoPage";

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

/**
 * Given an array of voting params values from the decoded data, returns IGenesisProtocolParams object
 * @param {Array<any>} votingParams
 * @returns {IGenesisProtocolParams}
 */
const mapVoteParamsToGenesisParams = (votingParams: Array<any>): IGenesisProtocolParams => {
  const genesisProtocolParams: IGenesisProtocolParams = {
    activationTime: votingParams[10],
    boostedVotePeriodLimit: votingParams[2],
    daoBountyConst: votingParams[9],
    limitExponentValue: 0, // This is not included in the decoded data
    minimumDaoBounty: votingParams[8],
    preBoostedVotePeriodLimit: votingParams[3],
    proposingRepReward: votingParams[6],
    queuedVoteRequiredPercentage: votingParams[0],
    queuedVotePeriodLimit: votingParams[1],
    quietEndingPeriod: votingParams[5],
    thresholdConst: votingParams[4],
    votersReputationLossRatio: votingParams[7],
  };
  return genesisProtocolParams;
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

  public async componentDidMount(): Promise<void> {
    this.setState({
      network: (await getNetworkName()).toLowerCase(),
    });
  }

  public render(): RenderOutput {
    const { proposalState, detailView, transactionModal } = this.props;
    let pluginName = proposalState.pluginToRegisterName;
    const decodedData = proposalState.pluginToRegisterDecodedData;
    let votingParams;
    let genesisProtocolParams: IGenesisProtocolParams;
    let contractToCall;
    if (pluginName && decodedData && pluginName !== "ReputationFromToken") { // pluginName && decodedData ---> means the plugin is Add or Replace (not Remove)
      votingParams = decodedData.params[2].value;
      if (pluginName === "GenericScheme") {
        contractToCall = decodedData.params[5].value;
        const genericPluginRegistry = new GenericPluginRegistry();
        const genericPluginInfo = genericPluginRegistry.getPluginInfo(decodedData.params[5].value);
        if (genericPluginInfo) {
          pluginName = genericPluginInfo.specs.name;
        } else {
          pluginName = "Blockchain Interaction";
        }
      }
      else if (pluginName === "ContributionRewardExt") {
        pluginName = decodedData.params[7].value; // Rewarder name
      }
      else {
        pluginName = PLUGIN_NAMES[pluginName as keyof typeof PLUGIN_NAMES];
        if (pluginName === undefined) {
          pluginName = "Unknown plugin name";
        }
      }
      genesisProtocolParams = mapVoteParamsToGenesisParams(votingParams);
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
              <img src="/assets/images/Icon/delete.svg" />&nbsp;
                  Remove Plugin&nbsp;
              <a href={linkToEtherScan(proposalState.pluginToRemove)} target="_blank" rel="noopener noreferrer">{pluginNameAndAddress(proposalState.pluginToRemove)}</a>
            </span>
            {detailView &&
              <div className={css.summaryDetails}>
                <div className={css.detailsRowsContainer}>
                  <div>Address:</div>
                  <div>
                    <a href={linkToEtherScan(proposalState.pluginToRemove)} target="_blank" rel="noopener noreferrer" style={{ marginRight: "5px" }}>
                      <img src="/assets/images/Icon/Link-blue.svg" />
                    </a>
                    {proposalState.pluginToRemove}
                  </div>
                </div>
              </div>}
          </div>
          : pluginName &&
          <div>
            <span className={css.summaryTitle}>
              <b className={css.pluginRegisterIcon}>{isReplace ? <img src="/assets/images/Icon/edit-sm.svg" /> : "+"}</b>&nbsp;
              {isReplace ? "Replace" : "Add"} Plugin&nbsp;
              {isReplace ? pluginNameAndAddress(proposalState.pluginToRemove) : pluginName}
            </span>
            {detailView &&
              <div className={css.summaryDetails}>
                <div className={css.detailsRowsContainer}>
                  {isReplace && <React.Fragment>
                    <div>Address:</div>
                    <div>
                      <a href={linkToEtherScan(proposalState.pluginToRemove)} target="_blank" rel="noopener noreferrer" style={{ marginRight: "5px" }}>
                        <img src="/assets/images/Icon/Link-blue.svg" />
                      </a>
                      {proposalState.pluginToRemove}
                    </div>
                  </React.Fragment>}
                  <div>Name:</div>
                  <div>{pluginName}</div>
                  <div>Version:</div>
                  <div>{proposalState.pluginToRegisterPackageVersion.join(".")}</div>
                  <div>Init Calldata:</div>
                  <div>
                    {proposalState.pluginToRegisterData.substr(0, 10)}...
                    <img className={css.copyButton} src="/assets/images/Icon/Copy-blue.svg" onClick={this.copyToClipboardHandler(proposalState.pluginToRegisterData)} />
                  </div>
                  <div>Permissions:</div>
                  <div>
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
                    <div>Mint or burn reputation</div>
                  </div>
                  {renderGpParams(genesisProtocolParams)}
                  {contractToCall && <React.Fragment><div>Contract to Call:</div><div>{contractToCall}</div></React.Fragment>}
                </div>
              </div>
            }
          </div>
        }
      </div>
    );
  }
}

export default connect(null, mapDispatchToProps)(ProposalSummary);
