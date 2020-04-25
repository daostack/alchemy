/* tslint:disable:max-classes-per-file */

import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Address, ISchemeState, IGenesisProtocolParams, IDAOState } from "@dorgtech/client";
import { copyToClipboard, fromWei, linkToEtherScan, roundUp } from "lib/util";
import { schemeName } from "lib/schemeUtils";
import * as moment from "moment";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { connect } from "react-redux";
import Tooltip from "rc-tooltip";
import * as css from "./SchemeInfo.scss";

interface IDispatchProps {
  showNotification: typeof showNotification;
}

interface IExternalProps {
  daoState: IDAOState;
  scheme: ISchemeState;
}

type IProps = IExternalProps & IDispatchProps;

const mapDispatchToProps = {
  showNotification,
};

class SchemeInfo extends React.Component<IProps, null> {

  private copyToClipboardHandler = (str: string) => (_event: any) => {
    copyToClipboard(str);
    this.props.showNotification(NotificationStatus.Success, "Copied to clipboard!");
  };

  public render(): RenderOutput {
    const { daoState, scheme } = this.props;
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

      return <tbody>
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
      </tbody>;
    };

    const votingMachine = (
      (scheme.genericSchemeParams && scheme.genericSchemeParams.votingMachine) ||
      (scheme.contributionRewardParams && scheme.contributionRewardParams.votingMachine) ||
      (scheme.schemeRegistrarParams && scheme.schemeRegistrarParams.votingMachine)
    );
    return <div>
      <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/scheme/${scheme.id}/info`}>Info</BreadcrumbsItem>

      <div className={css.schemeInfoContainer}>
        <h3>{schemeName(scheme, scheme.address)}</h3>
        <table className={css.infoCardContent}>
          <tbody>
            <tr>
              <th>Address of plugin: <a href={linkToEtherScan(scheme.address)} target="_blank" rel="noopener noreferrer"><img src="/assets/images/Icon/Link-blue.svg" /></a></th>
              <td>
                <span>{scheme.address}</span>
              </td>
              <td>
                <img className={css.copyButton} src="/assets/images/Icon/Copy-blue.svg" onClick={this.copyToClipboardHandler(scheme.address)} />
              </td>
            </tr>
            { scheme.genericSchemeParams ?
              <tr>
                <th>will call this contract: <a href={linkToEtherScan(scheme.genericSchemeParams.contractToCall)} target="_blank" rel="noopener noreferrer"><img src="/assets/images/Icon/Link-blue.svg" /></a></th>
                <td>
                  <span>{scheme.genericSchemeParams.contractToCall}</span>
                </td>
                <td>
                  <img className={css.copyButton} src="/assets/images/Icon/Copy-blue.svg" onClick={this.copyToClipboardHandler(scheme.genericSchemeParams.contractToCall)} />
                </td>
              </tr> : undefined
            }

            <tr>
              <th>Can Register Plugins?</th>
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

      {scheme.schemeRegistrarParams ?
        <div className={css.schemeInfoContainer}>
          <h3>Genesis Protocol Params for Plugin Registration -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank" rel="noopener noreferrer">Learn more</a></h3>
          <table className={css.infoCardContent}>
            {renderVotingMachineLink(votingMachine)}
            {renderGpParams(scheme.schemeRegistrarParams.voteRegisterParams)}
          </table>
        </div>
        : ""
      }

      {scheme.schemeRegistrarParams ?
        <div className={css.schemeInfoContainer}>
          <h3>Genesis Protocol Params for Plugin Removal -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank" rel="noopener noreferrer">Learn more</a></h3>
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

export default connect(null, mapDispatchToProps)(SchemeInfo);
