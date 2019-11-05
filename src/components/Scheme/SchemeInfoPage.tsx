/* tslint:disable:max-classes-per-file */

import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Address, ISchemeState, IGenesisProtocolParams } from "@daostack/client";
import { copyToClipboard, fromWei, linkToEtherScan, schemeName, roundUp } from "lib/util";
import * as moment from "moment";
import Tooltip from "rc-tooltip";
import * as css from "./SchemeInfo.scss";

interface IProps {
  daoAvatarAddress: Address;
  scheme: ISchemeState;
}

export default class SchemeInfo extends React.Component<IProps, null> {

  private copyToClipboardHandler = (str: string) => (_event: any) => { copyToClipboard(str); };

  public render(): RenderOutput {
    const { daoAvatarAddress, scheme } = this.props;

    const duration = (durationSeconds: number): any => {

      if (!durationSeconds) {
        return "";
      }

      const duration = moment.duration(durationSeconds * 1000);

      const days = duration.days() ? <strong>{duration.days()}d</strong> : "";
      const hours = duration.hours() ? <strong>{duration.hours()}h</strong> : "";
      const minutes = duration.minutes() ? <strong>{duration.minutes()}m</strong> : "";
      const seconds = duration.seconds() ? <strong>{duration.seconds()}s</strong> : "";
      // there won't ever be milliseconds
      const colon = <span className={css.colon}>:</span>;

      const first = days ? days : hours ? hours : minutes ? minutes : seconds ? seconds : null;

      return <span>
        {
          days ? <span className={css.timeSection}>{days}</span> : ""
        }
        {
          hours ? <span className={css.timeSection}><span>{first !== hours ? colon : ""} {hours}</span></span> : ""
        }
        {
          minutes ? <span className={css.timeSection}><span>{first !== minutes ? colon : ""} {minutes}</span></span> : ""
        }
        {
          seconds ? <span className={css.timeSection}><span>{first !== seconds ? colon : ""} {seconds}</span></span> : ""
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

      const activationTime = moment(params.activationTime);

      return <tbody>
        <tr><th>Activation Time:</th><td className={css.ellipsis}>{
          `${ activationTime.format("MMMM Do, YYYY")} ${activationTime.isSameOrBefore(moment()) ? "(active)" : "(inactive)"}`
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
      </tbody>;
    };

    const votingMachine = (
      (scheme.genericSchemeParams && scheme.genericSchemeParams.votingMachine) ||
      (scheme.uGenericSchemeParams && scheme.uGenericSchemeParams.votingMachine) ||
      (scheme.contributionRewardParams && scheme.contributionRewardParams.votingMachine) ||
      (scheme.schemeRegistrarParams && scheme.schemeRegistrarParams.votingMachine)
    );
    return <div>
      <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/scheme/${scheme.id}/info`}>{schemeName(scheme, scheme.address)}</BreadcrumbsItem>

      <div className={css.schemeInfoContainer}>
        <h3>{schemeName(scheme, scheme.address)}</h3>
        <table className={css.infoCardContent}>
          <tbody>
            <tr>
              <th>Address of scheme: <a href={linkToEtherScan(scheme.address)} target="_blank" rel="noopener noreferrer"><img src="/assets/images/Icon/Link-blue.svg" /></a></th>
              <td>
                <span>{scheme.address}</span>
              </td>
              <td>
                <img src="/assets/images/Icon/Copy-blue.svg" onClick={this.copyToClipboardHandler(scheme.address)} />
              </td>
            </tr>
            { scheme.genericSchemeParams ?
              <tr>
                <th>will call this contract: <a href={linkToEtherScan(scheme.genericSchemeParams.contractToCall)} target="_blank" rel="noopener noreferrer"><img src="/assets/images/Icon/Link-blue.svg" /></a></th>
                <td>
                  <span>{scheme.genericSchemeParams.contractToCall}</span>
                </td>
                <td>
                  <img src="/assets/images/Icon/Copy-blue.svg" onClick={this.copyToClipboardHandler(scheme.genericSchemeParams.contractToCall)} />
                </td>
              </tr> : undefined
            }
            { scheme.uGenericSchemeParams ?
              <tr>
                <th>will call this contract: <a href={linkToEtherScan(scheme.uGenericSchemeParams.contractToCall)} target="_blank" rel="noopener noreferrer"><img src="/assets/images/Icon/Link-blue.svg" /></a></th>
                <td>
                  <span>{scheme.uGenericSchemeParams.contractToCall}</span>
                </td>
                <td>
                  <img src="/assets/images/Icon/Copy-blue.svg" onClick={this.copyToClipboardHandler(scheme.uGenericSchemeParams.contractToCall)} />
                </td>
              </tr> : undefined
            }

            <tr>
              <th>Param Hash:</th>
              <td>
                <span>{scheme.paramsHash}</span>
              </td>
              <td>
                <img src="/assets/images/Icon/Copy-blue.svg" onClick={this.copyToClipboardHandler(scheme.paramsHash)} />
              </td>
            </tr>
            <tr>
              <th>Can Register Schemes?</th>
              <td>
                {scheme.canRegisterSchemes ? "Yes" : "No"}
              </td>
              <td>
              </td>
            </tr>
            <tr>
              <th>Can Upgrade Controller?</th>
              <td>
                {scheme.canUpgradeController ? "Yes" : "No"}
              </td>
              <td>
              </td>
            </tr>
            <tr>
              <th>Can Delegate Call?</th>
              <td>
                {scheme.canDelegateCall ? "Yes" : "No"}
              </td>
              <td>
              </td>
            </tr>
            <tr>
              <th>Can Manage Global Constraints?</th>
              <td>
                {scheme.canManageGlobalConstraints ? "Yes" : "No"}
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

      {scheme.contributionRewardParams || scheme.genericSchemeParams ?
        <div className={css.schemeInfoContainer}>
          <h3>Genesis Protocol Params -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank" rel="noopener noreferrer">Learn more</a></h3>
          <table className={css.infoCardContent}>
            {renderVotingMachineLink(votingMachine)}
            {renderGpParams(scheme.contributionRewardParams ? scheme.contributionRewardParams.voteParams : scheme.genericSchemeParams.voteParams)}
          </table>
        </div>
        : ""
      }
      { scheme.uGenericSchemeParams ?
        <div className={css.schemeInfoContainer}>
          <h3>Genesis Protocol Params -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank" rel="noopener noreferrer">Learn more</a></h3>
          <table className={css.infoCardContent}>
            {renderVotingMachineLink(votingMachine)}
            {renderGpParams(scheme.uGenericSchemeParams.voteParams)}
          </table>
        </div>
        : ""
      }

      {scheme.schemeRegistrarParams ?
        <div className={css.schemeInfoContainer}>
          <h3>Genesis Protocol Params for Scheme Registration -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank" rel="noopener noreferrer">Learn more</a></h3>
          <table className={css.infoCardContent}>
            {renderVotingMachineLink(votingMachine)}
            {renderGpParams(scheme.schemeRegistrarParams.voteRegisterParams)}
          </table>
        </div>
        : ""
      }

      {scheme.schemeRegistrarParams ?
        <div className={css.schemeInfoContainer}>
          <h3>Genesis Protocol Params for Scheme Removal -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank" rel="noopener noreferrer">Learn more</a></h3>
          <table className={css.infoCardContent}>
            {renderVotingMachineLink(votingMachine)}
            {renderGpParams(scheme.schemeRegistrarParams.voteRemoveParams)}
          </table>
        </div>
        : ""
      }
    </div>;
  }
}
