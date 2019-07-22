/* tslint:disable:max-classes-per-file */

import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Address, ISchemeState } from "@daostack/client";
import { copyToClipboard, fromWei, linkToEtherScan, schemeName } from "lib/util";
import * as css from "./SchemeInfo.scss";

interface IProps {
  daoAvatarAddress: Address;
  scheme: ISchemeState;
}

export default class SchemeInfo extends React.Component<IProps, null> {

  public render() {
    const { daoAvatarAddress, scheme } = this.props;

    const renderGpParams = (params: any) => {
      return <tbody>
        <tr><th>Activation Time:</th><td>{params.activationTime} seconds</td></tr>
        <tr><th>Boosted Vote Period Limit:</th><td>{params.boostedVotePeriodLimit} seconds</td></tr>
        <tr><th>DAO Bounty Const:</th><td>{params.daoBountyConst}</td></tr>
        <tr><th>Limit Exponent Value:</th><td>{params.limitExponentValue}</td></tr>
        <tr><th>Minimum DAO Bounty:</th><td>{fromWei(params.minimumDaoBounty)} GEN</td></tr>
        <tr><th>Pre-Boosted Vote Period Limit:</th><td>{params.preBoostedVotePeriodLimit} seconds</td></tr>
        <tr><th>Queued Vote Period Limit:</th><td>{params.queuedVotePeriodLimit} seconds</td></tr>
        <tr><th>Queued Vote Required Percentage:</th><td>{params.queuedVoteRequiredPercentage}%</td></tr>
        <tr><th>Quiet Ending Period:</th><td>{params.quietEndingPeriod} seconds</td></tr>
        <tr><th>Threshold Const:</th><td>{params.thresholdConst.toString()}</td></tr>
        <tr><th>Voters Reputation Loss Ratio:</th><td>{params.votersReputationLossRatio}</td></tr>
      </tbody>;
    };

    return <div>
      <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/scheme/${scheme.id}/info`}>{schemeName(scheme, scheme.address)}</BreadcrumbsItem>

      <div className={css.schemeInfoContainer}>
        <h3>{schemeName(scheme, scheme.address)}</h3>
        <table className={css.infoCardContent}>
          <tbody>
            <tr>
              <th>Address: <a href={linkToEtherScan(scheme.address)} target="_blank" rel="noopener noreferrer"><img src="/assets/images/Icon/Link-blue.svg" /></a></th>
              <td className={css.ellipsis}>
                <span>{scheme.address}</span>
              </td>
              <td>
                <img src="/assets/images/Icon/Copy-blue.svg" onClick={() => copyToClipboard(scheme.address)} />
              </td>
            </tr>
            <tr>
              <th>Param Hash:</th>
              <td className={css.ellipsis}>
                <span>{scheme.paramsHash}</span>
              </td>
              <td>
                <img src="/assets/images/Icon/Copy-blue.svg" onClick={() => copyToClipboard(scheme.paramsHash)} />
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
          </tbody>
        </table>
      </div>

      {scheme.contributionRewardParams || scheme.genericSchemeParams ?
        <div className={css.schemeInfoContainer}>
          <h3>Genesis Protocol Params -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank" rel="noopener noreferrer">Learn more</a></h3>
          <table className={css.infoCardContent}>
            {renderGpParams(scheme.contributionRewardParams ? scheme.contributionRewardParams.voteParams : scheme.genericSchemeParams.voteParams)}
          </table>
        </div>
        : ""
      }

      {scheme.schemeRegistrarParams ?
        <div className={css.schemeInfoContainer}>
          <h3>Genesis Protocol Params for Scheme Registration -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank" rel="noopener noreferrer">Learn more</a></h3>
          <table className={css.infoCardContent}>
            {renderGpParams(scheme.schemeRegistrarParams.voteRegisterParams)}
          </table>
        </div>
        : ""
      }

      {scheme.schemeRegistrarParams ?
        <div className={css.schemeInfoContainer}>
          <h3>Genesis Protocol Params for Scheme Removal -- <a href="https://daostack.zendesk.com/hc/en-us/articles/360002000537" target="_blank" rel="noopener noreferrer">Learn more</a></h3>
          <table className={css.infoCardContent}>
            {renderGpParams(scheme.schemeRegistrarParams.voteRemoveParams)}
          </table>
        </div>
        : ""
      }
    </div>;
  }
}

