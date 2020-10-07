/* tslint:disable:max-classes-per-file */

import { History } from "history";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Address, IPluginState, IGenesisProtocolParams, IDAOState, IPluginManagerState } from "@daostack/arc.js";
import { fromWei, linkToEtherScan, roundUp } from "lib/util";
import { pluginName } from "lib/pluginUtils";
import CopyToClipboard from "components/Shared/CopyToClipboard";
import * as moment from "moment";
import Tooltip from "rc-tooltip";
import * as css from "./PluginInfo.scss";

interface IExternalProps {
  daoState: IDAOState;
  history: History;
  plugin: IPluginState;
  pluginManager?: IPluginManagerState;
}

type IProps = IExternalProps;

export const renderGpParams = (params: IGenesisProtocolParams): any => {

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

  // represent time in locale-independent UTC format
  const activationTime = moment.unix(params.activationTime).utc();

  return <React.Fragment>
    <div>Activation Time:</div><div className={css.ellipsis}>{
      `${ activationTime.format("h:mm A [UTC] on MMMM Do, YYYY")} ${activationTime.isSameOrBefore(moment()) ? "(active)" : "(inactive)"}`
    }</div>
    <div>Boosted Vote Period Limit:</div><div>{duration(params.boostedVotePeriodLimit)} ({params.boostedVotePeriodLimit} seconds)</div>
    <div>DAO Bounty Constant:</div><div>{params.daoBountyConst}</div>
    <div>Proposal Reputation Reward:</div><div>{fromWei(params.proposingRepReward)} REP</div>
    <div>Minimum DAO Bounty:</div><div>{fromWei(params.minimumDaoBounty)} GEN</div>
    <div>Pre-Boosted Vote Period Limit:</div><div>{duration(params.preBoostedVotePeriodLimit)} ({params.preBoostedVotePeriodLimit} seconds)</div>
    <div>Queued Vote Period Limit:</div><div>{duration(params.queuedVotePeriodLimit)} ({params.queuedVotePeriodLimit} seconds)</div>
    <div>Queued Vote Required:</div><div>{params.queuedVoteRequiredPercentage}%</div>
    <div>Quiet Ending Period:</div><div>{duration(params.quietEndingPeriod)} ({params.quietEndingPeriod} seconds)</div>
    <div>Threshold Constant</div><div>
      <Tooltip
        placement="top"
        overlay={
          <span>{params.thresholdConst.toString()}</span>
        }
        trigger={["hover"]}
      >
        <span>{roundUp(params.thresholdConst, 3).toString()}</span>
      </Tooltip>
    </div>
    <div>Voters Reputation Loss:</div><div>{params.votersReputationLossRatio}%</div>
  </React.Fragment>;
};

export default class PluginInfo extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const { daoState, plugin } = this.props;
    const daoAvatarAddress = daoState.address;

    const renderVotingMachineLink = (votingMachine: Address) => {
      if (votingMachine) {
        return <>
          <div>Address:</div>
          <div>
            <a href={linkToEtherScan(votingMachine)} target="_blank" rel="noopener noreferrer">{ votingMachine }</a>
          </div>
        </>;
      }
    };


    const pluginParams = (plugin as any).pluginParams;
    const votingMachine = (
      pluginParams && pluginParams.votingMachine
    );
    return <div>
      <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/plugin/${plugin.id}/info`}>Info</BreadcrumbsItem>

      <div className={css.pluginInfoContainer}>
        <h3>{pluginName(plugin, plugin.address)}</h3>
        <div className={css.infoCardContent}>
          <div className={css.infoRowsContainer}>
            <div>Address of plugin: <a href={linkToEtherScan(plugin.address)} target="_blank" rel="noopener noreferrer"><img src="/assets/images/Icon/Link-blue.svg" /></a></div>
            <div>
              <div className={css.addressHash}>{plugin.address}</div>
              <CopyToClipboard value={plugin.address} />
            </div>
            {pluginParams && pluginParams.contractToCall ?
              <>
                <div>will call this contract: <a href={linkToEtherScan(pluginParams.contractToCall)} target="_blank" rel="noopener noreferrer"><img src="/assets/images/Icon/Link-blue.svg" /></a></div>
                <div>
                  <div className={css.addressHash}>{pluginParams.contractToCall}</div>
                  <CopyToClipboard value={pluginParams.contractToCall} />
                </div>
              </> : undefined
            }

            <div>Can Register Plugins?</div>
            <div>
              {plugin.canRegisterPlugins ? "Yes" : "No"}
            </div>
            <div>Can Upgrade Controller?</div>
            <div>
              {plugin.canUpgradeController ? "Yes" : "No"}
            </div>
            <div>Can Delegate Call?</div>
            <div>
              {plugin.canDelegateCall ? "Yes" : "No"}
            </div>
            <div>Can Manage Global Constraints?</div>
            <div>
              {plugin.canManageGlobalConstraints ? "Yes" : "No"}
            </div>
            <div>Mint and burn reputation, send ETH and external &amp; native tokens</div>
            <div>Yes</div>
          </div>
        </div>
      </div>

      {pluginParams && pluginParams.voteParams ?
        <div className={css.pluginInfoContainer}>
          <h3>Genesis Protocol Params -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank" rel="noopener noreferrer">Learn more</a></h3>
          <div className={css.infoCardContent}>
            <div className={css.gpRowsContainer}>
              {renderVotingMachineLink(votingMachine)}
              {renderGpParams(pluginParams.voteParams)}
            </div>
          </div>
        </div>
        : ""
      }

      {pluginParams && pluginParams.voteRegisterParams ?
        <div className={css.pluginInfoContainer}>
          <h3>Genesis Protocol Params for Plugin Registration -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank" rel="noopener noreferrer">Learn more</a></h3>
          <div className={css.infoCardContent}>
            <div className={css.gpRowsContainer}>
              {renderVotingMachineLink(votingMachine)}
              {renderGpParams(pluginParams.voteRegisterParams)}
            </div>
          </div>
        </div>
        : ""
      }

      {pluginParams && pluginParams.voteRemoveParams ?
        <div className={css.pluginInfoContainer}>
          <h3>Genesis Protocol Params for Plugin Removal -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank" rel="noopener noreferrer">Learn more</a></h3>
          <div className={css.infoCardContent}>
            <div className={css.gpRowsContainer}>
              {renderVotingMachineLink(votingMachine)}
              {renderGpParams(pluginParams.voteRemoveParams)}
            </div>
          </div>
        </div>
        : ""
      }
    </div>;
  }
}

