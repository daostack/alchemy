import { IDAOState, ITokenTradeProposalState } from "@daostack/arc.js";
import classNames from "classnames";
import * as React from "react";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import { IProfileState } from "reducers/profilesReducer";

import * as css from "./ProposalSummary.scss";
import { tokenDetails, formatTokens, toWei } from "lib/util";
import i18next from "i18next";

interface IProps {
  beneficiaryProfile?: IProfileState;
  detailView?: boolean;
  daoState: IDAOState;
  proposalState: ITokenTradeProposalState;
  transactionModal?: boolean;
}

export default class ProposalSummaryTokenTrade extends React.Component<IProps> {

  constructor(props: IProps) {
    super(props);
  }

  public render(): RenderOutput {

    const { beneficiaryProfile, proposalState, daoState, detailView, transactionModal } = this.props;

    let receiveToken;
    let sendToken;

    if (proposalState.sendTokenAddress && proposalState.sendTokenAmount) {
      const tokenData = tokenDetails(proposalState.sendTokenAddress);
      sendToken = formatTokens(toWei(Number(proposalState.sendTokenAmount)), tokenData ? tokenData["symbol"] : "?", tokenData ? tokenData["decimals"] : 18);
    }

    if (proposalState.receiveTokenAddress && proposalState.receiveTokenAmount) {
      const tokenData = tokenDetails(proposalState.receiveTokenAddress);
      receiveToken = formatTokens(toWei(Number(proposalState.receiveTokenAmount)), tokenData ? tokenData["symbol"] : "?", tokenData ? tokenData["decimals"] : 18);
    }

    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
    });
    return (
      <div className={proposalSummaryClass}>
        <span className={css.transferType}>
          { sendToken &&
          <div>
            <div>
              <span className={css.bold}>{i18next.t("Send to DAO")}:</span>
            </div>
            <AccountPopup accountAddress={proposalState.beneficiary} daoState={daoState} width={12} />
            <span>
              <AccountProfileName accountAddress={proposalState.beneficiary} accountProfile={beneficiaryProfile} daoAvatarAddress={daoState.address}/>
            </span>
            <span className={css.transferAmount}></span>
            <img className={css.transferIcon} src="/assets/images/Icon/Transfer.svg" />
            {receiveToken}
          </div>
          }
          { receiveToken &&
          <div>
            <div>
              <span className={css.bold}>{i18next.t("Receive from DAO")}:</span>
            </div>
            {receiveToken}
            <span className={css.transferAmount}></span>
            <img className={css.transferIcon} src="/assets/images/Icon/Transfer.svg" />
            <AccountPopup accountAddress={proposalState.beneficiary} daoState={daoState} width={12} />
            <span>
              <AccountProfileName accountAddress={proposalState.beneficiary} accountProfile={beneficiaryProfile} daoAvatarAddress={daoState.address}/>
            </span>
          </div>
          }
        </span>
      </div>
    );

  }
}
