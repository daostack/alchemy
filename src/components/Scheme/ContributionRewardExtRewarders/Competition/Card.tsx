import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import { humanProposalTitle } from "lib/util";
import * as React from "react";
import { Link } from "react-router-dom";
import RewardsString from "components/Proposal/RewardsString";
import { IDAOState, IProposalState } from "@daostack/client";
import { IProfileState } from "reducers/profilesReducer";
import { IRootState } from "reducers";
import { connect } from "react-redux";
import * as css from "./Competitions.scss";

interface IStateProps {
  creatorProfile: IProfileState;
  beneficiaryProfile: IProfileState;
}

interface IExternalProps {
  daoState: IDAOState;
  proposalState: IProposalState;
  suppressTrainingTooltips?: boolean;
}

type IProps = IExternalProps & IStateProps;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {

  return {
    ...ownProps,
    creatorProfile: state.profiles[ownProps.proposalState.proposer],
    // FAKE:  should be proposalState.contributionRewardExt
    beneficiaryProfile: state.profiles[ownProps.proposalState.contributionReward.beneficiary],
    // currentAccountAddress: state.web3.currentAccountAddress,
  };
};

class CompetitionCard extends React.Component<IProps, null> {

  public render(): RenderOutput {

    const {
      creatorProfile,
      daoState,
      proposalState,
    } = this.props;

    return <div className={css.competitionCardContainer} data-test-id={"competition-card-" + proposalState.id}>
      <div className={css.status}>Not open yet </div>
      <div className={css.createdBy}>
        <AccountPopup accountAddress={proposalState.proposer} daoState={daoState}/>
        <AccountProfileName accountAddress={proposalState.proposer} accountProfile={creatorProfile} daoAvatarAddress={daoState.address} detailView={false} />
      </div>
      <div className={css.countdown}>Suggestions open in 24h</div>
      <div className={css.description}>
        <Link className={css.detailLink} to={"/dao/" + daoState.address +  "/crx/proposal/" + proposalState.id} data-test-id="proposal-title">
          <div className={css.name}>{humanProposalTitle(proposalState)}</div>
          <img src="/assets/images/Icon/Open.svg" />
        </Link>
      </div>
      <div className={css.rewards}>
        <div className={css.transferType}><RewardsString proposal={proposalState} dao={daoState} /></div>
        <img src="/assets/images/Icon/Transfer.svg" />
        {/* FAKE:  should be proposalState.contributionRewardExt.numWinners */}
        <div className={css.winners}>2 winners</div>
      </div>
    </div>;
  }
}

export default connect(mapStateToProps)(CompetitionCard);
