// eslint-disable @typescript-eslint/naming-convention

import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Address, IPluginState } from "@daostack/arc.js";
import { pluginName } from "lib/pluginUtils";
import { getNetworkName } from "lib/util";
import * as css from "./PluginInfo.scss";

const ReactMarkdown = require("react-markdown");

interface IProps {
  daoAvatarAddress: Address;
  plugin: IPluginState;
}

interface IState {
  bounties: any;
  page: number;
  totalResults: number;
}

export default class PluginOpenBounty extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      bounties: [{
        title: "Loading...",
        token_symbol: "",
        calculated_fulfillment_amount: "0",
        description: "",
        attached_url: "#",
        id: 1,
      }],
      page: 0,
      totalResults: 0,
    };
  }

  private getApi = async (): Promise<void> => {
    // query all open bounties issued by current dao ordered by decending price
    // rinkeby api and mainnet api are different subdomains
    const network = (await getNetworkName()).toLowerCase();
    const testnet = network === "main" ? "" : `${network}.`;
    const res = await fetch(`https://${testnet}api.bounties.network/bounty/?ordering=usd_price&issuer=${this.props.daoAvatarAddress}&bountyStage=1&offset=${this.state.page}`);
    const json = await res.json();

    this.setState({
      totalResults: json.count ? json.count : 0,
      bounties: json.results,
    });
  }

  private nextPage = (): void => {
    // go forward a page in open bounties
    this.setState({
      page: this.state.page + 25,
    });
  }

  private prevPage = (): void => {
    // go back a page in open bounties
    this.setState({
      page: this.state.page - 25,
    });
  }

  public componentDidMount(): void {
    // call for open bounties on page load
    this.getApi();
  }

  public componentDidUpdate(prevProps: IProps, prevState: IState): void {
    // if this.state.page is updated, re-query open bounties
    if (prevState.page !== this.state.page) {
      this.getApi();
    }
  }

  public render(): JSX.Element {
    const { daoAvatarAddress, plugin } = this.props;
    const createCard = () => {

      // Shows open bounty with bounty details if API returns bounty, else, shows "no open bounty" message
      if (this.state.totalResults > 0) {
        return this.state.bounties.map((bounty: any) => (
          <a href={bounty.attached_url} target="_blank" rel="noopener noreferrer" key={bounty.id}>
            <div className={css.pluginInfoContainer}>
              <h3>{bounty.title} [{parseFloat(bounty.calculated_fulfillment_amount).toFixed(3)} {bounty.token_symbol }]</h3>
              <div className={css.infoCardContent}>
                <strong>Bounty ID: </strong> {bounty.bounty_id}  | <strong>Issuer IDs:</strong> {bounty.issuers}
                <ReactMarkdown source={bounty.description} />
              </div>
            </div>
          </a>
        ));
      } else {
        return (
          <div className={css.pluginInfoContainer}>
            <h3>No Open Bounties At This Time</h3>
            <div className={css.infoCardContent}>
                New bounties can be created with a new bounty proposal.
            </div>
          </div>
        );
      }
    };

    return (
      <div>
        <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/plugin/${plugin.id}/info`}>{pluginName(plugin, plugin.address)}</BreadcrumbsItem>
        {
          createCard()
        }
        <div className={css.pageSelectionContainer}>
          {this.state.page - 25 > 0 && (
            <button className={css.pageButton} onClick={this.prevPage}>
              prev
            </button>
          )}
          {this.state.page + 25 < this.state.totalResults && (
            <button className={css.pageButton} onClick={this.nextPage}>
              next
            </button>
          )}
        </div>
      </div>
    );
  }
}


