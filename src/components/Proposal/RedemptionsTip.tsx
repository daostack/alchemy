import { Address, IDAOState, IProposalOutcome, AnyProposal, IContributionRewardProposalState } from "@daostack/arc.js";
import Reputation from "components/Account/Reputation";
import { baseTokenName, formatTokens, fromWei, genName, tokenDecimals, tokenSymbol, AccountClaimableRewardsType } from "lib/util";
import * as React from "react";
import * as css from "./RedemptionsTip.scss";

interface IProps {
  canRewardNone: boolean;
  canRewardOnlySome: boolean;
  contributionRewards: AccountClaimableRewardsType;
  currentAccountAddress: Address;
  daoState: IDAOState;
  // non-zero GP rewards of current user, payable or not
  gpRewards: AccountClaimableRewardsType;
  id: string;
  proposal: AnyProposal;
}

export default (props: IProps): JSX.Element => {
  const { canRewardNone, canRewardOnlySome, currentAccountAddress, contributionRewards, daoState, gpRewards, id, proposal } = props;
  const proposalState = proposal.coreState;

  const messageDiv = (canRewardNone || canRewardOnlySome) ? <div className={css.message}>
    <img className={css.icon} src="/assets/images/Icon/Alert-yellow-b.svg" />
    {canRewardNone ? <div className={css.text}>At this time, none of these rewards can be redeemed -- {daoState.name} does not hold all the necessary assets.</div> : ""}
    {canRewardOnlySome ? <div className={css.text}>At this time, only some of these rewards can be redeemed -- {daoState.name} does not hold all the necessary assets.</div> : ""}
  </div> : <span></span>;

  const rewardComponents = [];
  let c = null;
  if (gpRewards.reputationForProposer) {
    c = <div key={id + "_proposer"}>
      <strong>For creating the proposal you are due to receive:</strong>
      <ul>
        <li><Reputation reputation={gpRewards.reputationForProposer} totalReputation={daoState.reputationTotalSupply} daoName={daoState.name} /></li>
      </ul>
    </div>;
    rewardComponents.push(c);
  }
  if (gpRewards.reputationForVoter) {
    c = <div key={id + "_voter"}>
      <strong>For voting on the proposal you are due to receive:</strong>
      <ul>
        <li><Reputation reputation={gpRewards.reputationForVoter} totalReputation={daoState.reputationTotalSupply} daoName={daoState.name} /></li>
      </ul>
    </div>;
    rewardComponents.push(c);
  }
  if (gpRewards.tokensForStaker) {
    c = <div key={id + "_staker_tokens"}>
      <strong>For staking on the proposal you are due to receive:</strong>
      <ul>
        <li>{fromWei(gpRewards.tokensForStaker)} {genName()}</li>
      </ul>
    </div>;
    rewardComponents.push(c);
  }
  if (gpRewards.daoBountyForStaker) {
    c = <div key={id + "_staker_bounty"}>
      <strong>For staking on the proposal you are due to receive:</strong>
      <ul>
        <li>{fromWei(gpRewards.daoBountyForStaker)} {genName()} as bounty from {daoState.name}
        </li>
      </ul>
    </div >;
    rewardComponents.push(c);
  }

  let ContributionRewardDiv = <div />;
  if (contributionRewards) {
    if (proposalState.winningOutcome === IProposalOutcome.Pass && proposalState.name === "ContributionReward") {
      if (Object.keys(contributionRewards).length > 0) {
        const contributionReward = proposal.coreState as IContributionRewardProposalState;
        ContributionRewardDiv = <div>
          <strong>
            {(currentAccountAddress && currentAccountAddress === contributionReward.beneficiary.toLowerCase()) ?
              "As the beneficiary of the proposal you are due to receive:" :
              "The beneficiary of the proposal is due to receive:"}
          </strong>
          <ul>
            {contributionRewards["eth"] ?
              <li>
                {formatTokens(contributionReward.ethReward, baseTokenName())}
              </li> : ""
            }
            {contributionRewards["externalToken"] ?
              <li>
                {formatTokens(contributionRewards["externalToken"], tokenSymbol(contributionReward.externalToken), tokenDecimals(contributionReward.externalToken))}
              </li> : ""
            }
            {contributionRewards["rep"] ? <li><Reputation reputation={contributionRewards["rep"]} totalReputation={daoState.reputationTotalSupply} daoName={daoState.name} /></li> : ""}

            {contributionRewards["nativeToken"] ?
              <li>
                {formatTokens(contributionRewards["nativeToken"], daoState.tokenSymbol)}
              </li> : ""
            }

          </ul>
        </div>;
      }
    }
  }

  return <div className={css.tipContainer}>
    { messageDiv }
    <React.Fragment>
      { rewardComponents }
    </React.Fragment>
    { ContributionRewardDiv }
  </div>;
};
