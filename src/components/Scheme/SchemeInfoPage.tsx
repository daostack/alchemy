/* tslint:disable:max-classes-per-file */

import { History } from "history";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Address, ISchemeState, IGenesisProtocolParams, IDAOState } from "@daostack/arc.js";
import { fromWei, linkToEtherScan, roundUp } from "lib/util";
import CopyToClipboard from "components/Shared/CopyToClipboard";
import { schemeName } from "lib/schemeUtils";
import * as moment from "moment";
import Tooltip from "rc-tooltip";
import * as css from "./SchemeInfo.scss";

interface IExternalProps {
  daoState: IDAOState;
  history: History;
  scheme: ISchemeState;
  schemeManager: ISchemeState;
}

type IProps = IExternalProps;

export default class SchemeInfo extends React.Component<IProps, null> {

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
        return <>
          <div>Address:</div>
          <div>
            <a href={linkToEtherScan(votingMachine)} target="_blank" rel="noopener noreferrer">{ votingMachine }</a>
          </div>
        </>;
      }
    };
    const renderGpParams = (params: IGenesisProtocolParams): any => {

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

    const votingMachine = (
      (scheme.genericSchemeParams && scheme.genericSchemeParams.votingMachine) ||
      (scheme.uGenericSchemeParams && scheme.uGenericSchemeParams.votingMachine) ||
      (scheme.contributionRewardParams && scheme.contributionRewardParams.votingMachine) ||
      (scheme.schemeRegistrarParams && scheme.schemeRegistrarParams.votingMachine) ||
      (scheme.contributionRewardExtParams && scheme.contributionRewardExtParams.votingMachine)
    );
    return <div>
      <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/scheme/${scheme.id}/info`}>Info</BreadcrumbsItem>

      <div className={css.schemeInfoContainer}>
        <h3>{schemeName(scheme, scheme.address)}</h3>
        <div className={css.infoCardContent}>
          <div className={css.infoRowsContainer}>
            <div>Address of plugin: <a href={linkToEtherScan(scheme.address)} target="_blank" rel="noopener noreferrer"><img src="/assets/images/Icon/Link-blue.svg" /></a></div>
            <div>
              <div className={css.addressHash}>{scheme.address}</div>
              <CopyToClipboard value={scheme.address} />
            </div>
            { scheme.genericSchemeParams ?
              <>
                <div>will call this contract: <a href={linkToEtherScan(scheme.genericSchemeParams.contractToCall)} target="_blank" rel="noopener noreferrer"><img src="/assets/images/Icon/Link-blue.svg" /></a></div>
                <div>
                  <div className={css.addressHash}>{scheme.genericSchemeParams.contractToCall}</div>
                  <CopyToClipboard value={scheme.genericSchemeParams.contractToCall} />
                </div>
              </> : undefined
            }
            { scheme.uGenericSchemeParams ?
              <>
                <div>will call this contract: <a href={linkToEtherScan(scheme.uGenericSchemeParams.contractToCall)} target="_blank" rel="noopener noreferrer"><img src="/assets/images/Icon/Link-blue.svg" /></a></div>
                <div>
                  <div className={css.addressHash}>{scheme.uGenericSchemeParams.contractToCall}</div>
                  <CopyToClipboard value={scheme.uGenericSchemeParams.contractToCall} />
                </div>
              </> : undefined
            }

            <div>Param Hash:</div>
            <div>
              <div className={css.addressHash}>{scheme.paramsHash}</div>
              <CopyToClipboard value={scheme.paramsHash} />
            </div>
            <div>Can Register Plugins?</div>
            <div>
              {scheme.canRegisterSchemes ? "Yes" : "No"}
            </div>
            <div>Can Upgrade Controller?</div>
            <div>
              {scheme.canUpgradeController ? "Yes" : "No"}
            </div>
            <div>Can Delegate Call?</div>
            <div>
              {scheme.canDelegateCall ? "Yes" : "No"}
            </div>
            <div>Can Manage Global Constraints?</div>
            <div>
              {scheme.canManageGlobalConstraints ? "Yes" : "No"}
            </div>
            <div>Mint and burn reputation, send ETH and external &amp; native tokens</div>
            <div>Yes</div>
          </div>
        </div>
      </div>

      {scheme.schemeParams ?
        <div className={css.schemeInfoContainer}>
          <h3>Genesis Protocol Params -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank" rel="noopener noreferrer">Learn more</a></h3>
          <div className={css.infoCardContent}>
            <div className={css.gpRowsContainer}>
              {renderVotingMachineLink(votingMachine)}
              {renderGpParams(scheme.schemeParams.voteParams)}
            </div>
          </div>
        </div>
        : ""
      }
      {scheme.contributionRewardParams || scheme.genericSchemeParams ?
        <div className={css.schemeInfoContainer}>
          <h3>Genesis Protocol Params -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank" rel="noopener noreferrer">Learn more</a></h3>
          <div className={css.infoCardContent}>
            <div className={css.gpRowsContainer}>
              {renderVotingMachineLink(votingMachine)}
              {renderGpParams(scheme.contributionRewardParams ? scheme.contributionRewardParams.voteParams : scheme.genericSchemeParams.voteParams)}
            </div>
          </div>
        </div>
        : ""
      }
      { scheme.uGenericSchemeParams ?
        <div className={css.schemeInfoContainer}>
          <h3>Genesis Protocol Params -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank" rel="noopener noreferrer">Learn more</a></h3>
          <div className={css.infoCardContent}>
            <div className={css.gpRowsContainer}>
              {renderVotingMachineLink(votingMachine)}
              {renderGpParams(scheme.uGenericSchemeParams.voteParams)}
            </div>
          </div>
        </div>
        : ""
      }

      {scheme.schemeRegistrarParams ?
        <div className={css.schemeInfoContainer}>
          <h3>Genesis Protocol Params for Plugin Registration -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank" rel="noopener noreferrer">Learn more</a></h3>
          <div className={css.infoCardContent}>
            <div className={css.gpRowsContainer}>
              {renderVotingMachineLink(votingMachine)}
              {renderGpParams(scheme.schemeRegistrarParams.voteRegisterParams)}
            </div>
          </div>
        </div>
        : ""
      }

      {scheme.schemeRegistrarParams ?
        <div className={css.schemeInfoContainer}>
          <h3>Genesis Protocol Params for Plugin Removal -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank" rel="noopener noreferrer">Learn more</a></h3>
          <div className={css.infoCardContent}>
            <div className={css.gpRowsContainer}>
              {renderVotingMachineLink(votingMachine)}
              {renderGpParams(scheme.schemeRegistrarParams.voteRemoveParams)}
            </div>
          </div>
        </div>
        : ""
      }

      {scheme.genericSchemeMultiCallParams ?
        <div className={css.schemeInfoContainer}>
          <h3>Genesis Protocol Params -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank" rel="noopener noreferrer">Learn more</a></h3>
          <div className={css.infoCardContent}>
            <div className={css.gpRowsContainer}>
              {renderVotingMachineLink(votingMachine)}
              {renderGpParams(scheme.genericSchemeMultiCallParams.voteParams)}
            </div>
          </div>
        </div>
        : ""
      }
    </div>;
  }
}

