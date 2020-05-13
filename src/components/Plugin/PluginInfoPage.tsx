/* tslint:disable:max-classes-per-file */

import { enableWalletProvider } from "arc";
import { History } from "history";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Address, IPluginState, IGenesisProtocolParams, IDAOState, ISchemeRegistrarState } from "@daostack/arc.js";
import { copyToClipboard, fromWei, linkToEtherScan, roundUp } from "lib/util";
import { pluginName } from "lib/pluginUtils";
import * as moment from "moment";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { connect } from "react-redux";
import Tooltip from "rc-tooltip";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import * as css from "./PluginInfo.scss";

interface IDispatchProps {
  showNotification: typeof showNotification;
}

interface IExternalProps {
  daoState: IDAOState;
  history: History;
  plugin: IPluginState;
  pluginRegistrar?: ISchemeRegistrarState;
}

type IProps = IExternalProps & IDispatchProps;

const mapDispatchToProps = {
  showNotification,
};

class PluginInfo extends React.Component<IProps, null> {

  private copyToClipboardHandler = (str: string) => (_event: any) => {
    copyToClipboard(str);
    this.props.showNotification(NotificationStatus.Success, "Copied to clipboard!");
  };

  private handleEditPlugin = async (e: any) => {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    // TODO @jordan use the plugin manager, instead of the registrar
    this.props.history.push(`/dao/${this.props.daoState.id}/plugin/${this.props.pluginRegistrar.id}/proposals/create/?currentTab=editPlugin`);
    e.preventDefault();
  }

  public render(): RenderOutput {
    const { daoState, plugin } = this.props;
    const daoAvatarAddress = daoState.address;

    const duration = (durationSeconds: number): any => {
      if (!durationSeconds) {
        return "";
      }

      const duration = moment.duration(durationSeconds * 1000);

      const days = Math.floor(duration.asDays());
      const hours = duration.hours();
      const minutes = duration.minutes();
      const seconds = duration.seconds();
      // there won't ever be milliseconds
      const colon = <span className={css.colon}>: </span>;

      const first = days ? "days" : hours ? "hours" : minutes ? "minutes" : seconds ? "seconds" : null;

      return <span>
        {
          days ? <span className={css.timeSection}><strong>{days} day{days > 1 ? "s" : ""}</strong></span> : ""
        }
        {
          hours ? <span className={css.timeSection}>{first !== "hours" ? colon : ""}<strong>{hours} hour{hours > 1 ? "s" : ""}</strong></span> : ""
        }
        {
          minutes ? <span className={css.timeSection}><span>{first !== "minutes" ? colon : ""}<strong>{minutes} minute{minutes > 1 ? "s" : ""}</strong></span></span> : ""
        }
        {
          seconds ? <span className={css.timeSection}><span>{first !== "seconds" ? colon : ""}<strong>{seconds} second{seconds > 1 ? "s" : ""}</strong></span></span> : ""
        }
      </span>;
    };

    const renderVotingMachineLink = (votingMachine: Address) => {
      if (votingMachine) {
        return <tr>
          <th>Address:</th>
          <td>
            <a href={linkToEtherScan(votingMachine)} target="_blank" rel="noopener noreferrer">{ votingMachine }</a>
          </td>
        </tr>;
      }
    };
    const renderGpParams = (params: IGenesisProtocolParams): any => {

      // represent time in locale-independent UTC format
      const activationTime = moment.unix(params.activationTime).utc();

      return <React.Fragment>
        <tr><th>Activation Time:</th><td className={css.ellipsis}>{
          `${ activationTime.format("h:mm A [UTC] on MMMM Do, YYYY")} ${activationTime.isSameOrBefore(moment()) ? "(active)" : "(inactive)"}`
        }</td></tr>
        <tr><th>Boosted Vote Period Limit:</th><td>{duration(params.boostedVotePeriodLimit)} ({params.boostedVotePeriodLimit} seconds)</td></tr>
        <tr><th>DAO Bounty Constant:</th><td>{params.daoBountyConst}</td></tr>
        <tr><th>Proposal Reputation Reward:</th><td>{fromWei(params.proposingRepReward)} REP</td></tr>
        <tr><th>Minimum DAO Bounty:</th><td>{fromWei(params.minimumDaoBounty)} GEN</td></tr>
        <tr><th>Pre-Boosted Vote Period Limit:</th><td>{duration(params.preBoostedVotePeriodLimit)} ({params.preBoostedVotePeriodLimit} seconds)</td></tr>
        <tr><th>Queued Vote Period Limit:</th><td>{duration(params.queuedVotePeriodLimit)} ({params.queuedVotePeriodLimit} seconds)</td></tr>
        <tr><th>Queued Vote Required:</th><td>{params.queuedVoteRequiredPercentage}%</td></tr>
        <tr><th>Quiet Ending Period:</th><td>{duration(params.quietEndingPeriod)} ({params.quietEndingPeriod} seconds)</td></tr>
        <tr><th>Threshold Constant</th><td>
          <Tooltip
            placement="top"
            overlay={
              <span>{params.thresholdConst.toString()}</span>
            }
            trigger={["hover"]}
          >
            <span>{roundUp(params.thresholdConst, 3).toString()}</span>
          </Tooltip>
        </td></tr>
        <tr><th>Voters Reputation Loss:</th><td>{params.votersReputationLossRatio}%</td></tr>
      </React.Fragment>;
    };

    const pluginParams = (plugin as any).pluginParams
    const votingMachine = (
      pluginParams && pluginParams.votingMachine
    );
    return <div>
      <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/plugin/${plugin.id}/info`}>Info</BreadcrumbsItem>

      { this.props.pluginRegistrar ?
        <div className={css.editPlugin}>
          <TrainingTooltip placement="topRight" overlay={"A small amount of ETH is necessary to submit a proposal in order to pay gas costs"}>
            <a
              data-test-id="createProposal"
              href="#!"
              onClick={this.handleEditPlugin}
            >
              Edit Plugin
            </a>
          </TrainingTooltip>
        </div> : undefined
      }

      <div className={css.pluginInfoContainer}>
        <h3>{pluginName(plugin, plugin.address)}</h3>
        <table className={css.infoCardContent}>
          <tbody>
            <tr>
              <th>Address of plugin: <a href={linkToEtherScan(plugin.address)} target="_blank" rel="noopener noreferrer"><img src="/assets/images/Icon/Link-blue.svg" /></a></th>
              <td>
                <span>{plugin.address}</span>
              </td>
              <td>
                <img className={css.copyButton} src="/assets/images/Icon/Copy-blue.svg" onClick={this.copyToClipboardHandler(plugin.address)} />
              </td>
            </tr>
            { pluginParams && pluginParams.contractToCall ?
              <tr>
                <th>will call this contract: <a href={linkToEtherScan(pluginParams.contractToCall)} target="_blank" rel="noopener noreferrer"><img src="/assets/images/Icon/Link-blue.svg" /></a></th>
                <td>
                  <span>{pluginParams.contractToCall}</span>
                </td>
                <td>
                  <img className={css.copyButton} src="/assets/images/Icon/Copy-blue.svg" onClick={this.copyToClipboardHandler(pluginParams.contractToCall)} />
                </td>
              </tr> : undefined
            }

            <tr>
              <th>Can Register Plugins?</th>
              <td>
                {plugin.canRegisterPlugins ? "Yes" : "No"}
              </td>
              <td>
              </td>
            </tr>
            <tr>
              <th>Can Upgrade Controller?</th>
              <td>
                {plugin.canUpgradeController ? "Yes" : "No"}
              </td>
              <td>
              </td>
            </tr>
            <tr>
              <th>Can Delegate Call?</th>
              <td>
                {plugin.canDelegateCall ? "Yes" : "No"}
              </td>
              <td>
              </td>
            </tr>
            <tr>
              <th>Can Manage Global Constraints?</th>
              <td>
                {plugin.canManageGlobalConstraints ? "Yes" : "No"}
              </td>
              <td>
              </td>
            </tr>
            <tr>
              <th>Can Mint or Burn Reputation?</th>
              <td>Yes</td>
              <td>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {pluginParams && pluginParams.voteParams ?
        <div className={css.pluginInfoContainer}>
          <h3>Genesis Protocol Params -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank" rel="noopener noreferrer">Learn more</a></h3>
          <table className={css.infoCardContent}><tbody>
            {renderVotingMachineLink(votingMachine)}
            {renderGpParams(pluginParams.voteParams)}
          </tbody></table>
        </div>
        : ""
      }

      {pluginParams && pluginParams.voteRegisterParams ?
        <div className={css.pluginInfoContainer}>
          <h3>Genesis Protocol Params for Plugin Registration -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank" rel="noopener noreferrer">Learn more</a></h3>
          <table className={css.infoCardContent}><tbody>
            {renderVotingMachineLink(votingMachine)}
            {renderGpParams(pluginParams.voteRegisterParams)}
          </tbody></table>
        </div>
        : ""
      }

      {pluginParams && pluginParams.voteRemoveParams ?
        <div className={css.pluginInfoContainer}>
          <h3>Genesis Protocol Params for Plugin Removal -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank" rel="noopener noreferrer">Learn more</a></h3>
          <table className={css.infoCardContent}><tbody>
            {renderVotingMachineLink(votingMachine)}
            {renderGpParams(pluginParams.voteRemoveParams)}
          </tbody></table>
        </div>
        : ""
      }
    </div>;
  }
}

export default connect(null, mapDispatchToProps)(PluginInfo);
