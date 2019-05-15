import { IDAOState, IProposalState } from "@daostack/client";
import * as React from "react";

import * as classNames from "classnames";
import AccountPopupContainer from "components/Account/AccountPopupContainer";
import AccountProfileName from "components/Account/AccountProfileName";
import { IProfileState } from "reducers/profilesReducer";
import RewardsString from "./RewardsString";
import { getNetworkName, schemeName, default as Util } from "lib/util";

import * as css from "./ProposalSummary.scss";

interface IProps {
  beneficiaryProfile?: IProfileState;
  detailView?: boolean;
  dao: IDAOState;
  proposal: IProposalState;
  transactionModal?: boolean;
}

interface IState {
  network: string;
}

export default class ProposalSummary extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    this.state = { network: "" };
  }

  public async componentWillMount() {
    this.setState({ network: (await getNetworkName()).toLowerCase() });
  }

  public render() {

    const { beneficiaryProfile, dao, proposal, detailView, transactionModal } = this.props;

    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
    });

    if (proposal.contributionReward) {
      return (
        <div className={proposalSummaryClass}>
          <span className={css.transferType}><RewardsString proposal={proposal} dao={dao} /></span>
          <strong className={css.transferAmount}></strong>
          <img src="/assets/images/Icon/Transfer.svg" />
          <AccountPopupContainer accountAddress={proposal.contributionReward.beneficiary} dao={dao} />
          <strong>
            <AccountProfileName accountAddress={proposal.contributionReward.beneficiary} accountProfile={beneficiaryProfile} daoAvatarAddress={dao.address}/>
          </strong>
        </div>
      );
    }

    if (proposal.schemeRegistrar) {
      const schemeRegistrar = proposal.schemeRegistrar;
      const etherscanLink = `https://${this.state.network !== "main" ? `${this.state.network}.` : ""}etherscan.io/address/`;

      // TODO: how to best figure out of this is an add or edit scheme proposal?

      return (
        <div className={proposalSummaryClass + " " + css.schemeRegistrar}>
          { schemeRegistrar.schemeToRemove  ?
              <div>
                <span>
                  <img src="/assets/images/Icon/delete.svg"/>&nbsp;
                  Remove Scheme&nbsp;
                  <a href={etherscanLink + schemeRegistrar.schemeToRemove} target="_blank">{schemeName(schemeRegistrar.schemeToRemove)}</a>
                </span>
                { detailView ?
                  <table>
                    <tr>
                      <th>
                        Address:
                        <a href={etherscanLink + schemeRegistrar.schemeToRemove} target="_blank">
                          <img src="/assets/images/Icon/Open.svg"/>
                        </a>
                      </th>
                      <td>{schemeRegistrar.schemeToRemove}</td>
                    </tr>
                  </table>
                  : ""
                }
              </div>
              : schemeRegistrar.schemeToRegister ?
              <div>
                <span>
                  <b>+</b>&nbsp;
                  Add Scheme&nbsp;
                  <a href={etherscanLink + schemeRegistrar.schemeToRegister} target="_blank">{schemeName(schemeRegistrar.schemeToRegister)}</a>
                </span>
                { detailView ?
                  <table>
                    <tr>
                      <th>
                        Address:
                        <a href={etherscanLink + schemeRegistrar.schemeToRegister} target="_blank">
                          <img src="/assets/images/Icon/Open.svg"/>
                        </a>
                      </th>
                      <td>
                        {schemeRegistrar.schemeToRegister}
                        <img src="/assets/images/Icon/Copy-black.svg" onClick={() => Util.copyToClipboard(schemeRegistrar.schemeToRegister)} />
                      </td>
                    </tr>
                    <tr>
                      <th>Param Hash:</th>
                      <td>
                        {schemeRegistrar.schemeToRegisterParamsHash.slice(0, 43)}...
                        <img src="/assets/images/Icon/Copy-black.svg" onClick={() => Util.copyToClipboard(schemeRegistrar.schemeToRegisterParamsHash)} />
                      </td>
                    </tr>
                    <tr><th>Permissions:</th><td>{schemeRegistrar.schemeToRegisterPermission}</td></tr>
                  </table>
                  : ""
                }
              </div>
              :
              <div>
                <span>
                  <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
                  Edit Scheme&nbsp;
                  <a href={etherscanLink + schemeRegistrar.schemeToRegister} target="_blank">{schemeName(schemeRegistrar.schemeToRegister)}</a>
                </span>
                { detailView ?
                  <table>
                    <tr><th>Address:</th><td>{schemeRegistrar.schemeToRegister.slice(43)}...</td></tr>
                    <tr><th>Param Hash:</th><td>{schemeRegistrar.schemeToRegisterParamsHash.slice(43)}...</td></tr>
                    <tr><th>Permissions:</th><td>{schemeRegistrar.schemeToRegisterPermission}</td></tr>
                  </table>
                  : ""
                }
              </div>
          }
        </div>
      );
    }

    return (
      <div className={proposalSummaryClass}>Unknown function call</div>
    );
  }
}
