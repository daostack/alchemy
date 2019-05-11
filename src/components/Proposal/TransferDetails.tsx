import { IDAOState, IProposalState } from "@daostack/client";
import * as React from "react";

import * as classNames from "classnames";
import AccountPopupContainer from "components/Account/AccountPopupContainer";
import AccountProfileName from "components/Account/AccountProfileName";
import { IProfileState } from "reducers/profilesReducer";
import RewardsString from "./RewardsString";
import { schemeName, default as Util } from "lib/util";

import * as css from "./TransferDetails.scss";

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

export default class TransferDetails extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    this.state = { network: "" };
  }

  public async componentWillMount() {
    this.setState({ network: (await Util.networkName()).toLowerCase() });
  }

  public render() {

    const { beneficiaryProfile, dao, proposal, detailView, transactionModal } = this.props;

    const transferDetailsClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.transferDetails]: true,
    });

    if (proposal.contributionReward) {
      return (
        <div className={transferDetailsClass}>
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
        <div className={transferDetailsClass + " " + css.schemeRegistrar}>
          { schemeRegistrar.schemeToRemove  ?
              <span>
                <img src="/assets/images/Icon/delete.svg"/>&nbsp;
                Remove Scheme&nbsp;
                <a href={etherscanLink + schemeRegistrar.schemeToRemove} target="_blank">{schemeName(schemeRegistrar.schemeToRemove)}</a>
              </span>
              : schemeRegistrar.schemeToRegister ?
              <span>
                <b>+</b>&nbsp;
                Add Scheme&nbsp;
                <a href={etherscanLink + schemeRegistrar.schemeToRegister} target="_blank">{schemeName(schemeRegistrar.schemeToRegister)}</a>
              </span>
              :
              <span>
                <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
                Edit Scheme&nbsp;
                <a href={etherscanLink + schemeRegistrar.schemeToRegister} target="_blank">{schemeName(schemeRegistrar.schemeToRegister)}</a>
              </span>
          }
        </div>
      );
    }
  }
}
