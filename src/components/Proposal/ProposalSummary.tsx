import { IDAOState, IProposalState, IProposalType } from "@daostack/client";
import * as classNames from "classnames";
import AccountPopupContainer from "components/Account/AccountPopupContainer";
import AccountProfileName from "components/Account/AccountProfileName";
import { default as Util, getNetworkName, schemeName } from "lib/util";
import * as React from "react";
import { IProfileState } from "reducers/profilesReducer";
import * as css from "./ProposalSummary.scss";
import RewardsString from "./RewardsString";

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
                <span className={css.summaryTitle}>
                  <b>{proposal.type === IProposalType.SchemeRegistrarEdit ? <img src="/assets/images/Icon/edit-sm.svg"/> : "+"}</b>&nbsp;
                  {proposal.type === IProposalType.SchemeRegistrarEdit ? "Edit" : "Add"} Scheme&nbsp;
                  <a href={etherscanLink + schemeRegistrar.schemeToRegister} target="_blank">{schemeName(schemeRegistrar.schemeToRegister)}</a>
                </span>
                { detailView ?
                  <div className={css.summaryDetails}>
                    <table>
                      <tbody>
                      <tr>
                        <th>
                          Address:
                          <a href={etherscanLink + schemeRegistrar.schemeToRegister} target="_blank">
                            <img src="/assets/images/Icon/Open.svg"/>
                          </a>
                        </th>
                        <td>
                          <span>{schemeRegistrar.schemeToRegister}</span>
                          <img src="/assets/images/Icon/Copy-black.svg" onClick={() => Util.copyToClipboard(schemeRegistrar.schemeToRegister)} />
                        </td>
                      </tr>
                      <tr>
                        <th>Param Hash:</th>
                        <td>
                          <span>{schemeRegistrar.schemeToRegisterParamsHash.slice(0, 43)}</span>
                          <img src="/assets/images/Icon/Copy-black.svg" onClick={() => Util.copyToClipboard(schemeRegistrar.schemeToRegisterParamsHash)} />
                        </td>
                      </tr>
                      <tr>
                        <th>Permissions:</th>
                        <td>
                          <span>Register Other schemes</span><br/>
                          <span>Upgrade the controller</span><br/>
                          <span>Call genericCall on behalf of</span><br/>
                        </td>
                      </tr>
                      </tbody>
                    </table>
                  </div>
                  : ""
                }
              </div>
              :
              ""
          }
        </div>
      );
    }

    return (
      <div className={proposalSummaryClass}>Unknown function call <pre>{proposal.genericScheme.callData}</pre></div>
    );
  }
}
