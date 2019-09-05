/* tslint:disable:max-classes-per-file */

import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Address, ISchemeState } from "@daostack/client";
import { copyToClipboard, linkToEtherScan, schemeName } from "lib/util";
import * as css from "./SchemeInfo.scss";

interface IProps {
  daoAvatarAddress: Address;
  scheme: ISchemeState;
}

export default class SchemeOpenBounty extends React.Component<IProps, null> {

  private copyToClipboardHandler = (str: string) => (_event: any) => { copyToClipboard(str); };

  public render() {
    const { daoAvatarAddress, scheme } = this.props;

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
                <img src="/assets/images/Icon/Copy-blue.svg" onClick={this.copyToClipboardHandler(scheme.address)} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>;
  }
}


