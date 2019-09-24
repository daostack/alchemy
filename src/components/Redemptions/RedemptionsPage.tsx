import { Address, IDAOState, Proposal } from "@daostack/client";
import { enableWeb3ProviderAndWarn, getArc } from "arc";
import * as arcActions from "actions/arcActions";

import BN = require("bn.js");
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import gql from "graphql-tag";
import { formatTokens, tokenSymbol } from "lib/util";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { connect } from "react-redux";
import * as Sticky from "react-stickynode";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import { combineLatest, Observable, of } from "rxjs";
import { defaultIfEmpty, map, mergeMap } from "rxjs/operators";
import ProposalCard from "../Proposal/ProposalCard";
import * as css from "./RedemptionsPage.scss";

interface IStateProps {
  currentAccountAddress: string;
}

const mapStateToProps = (state: IRootState) => {
  return {
    currentAccountAddress: state.web3.currentAccountAddress,
  };
};

interface IDispatchProps {
  redeemProposal: typeof arcActions.redeemProposal;
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  redeemProposal: arcActions.redeemProposal,
  showNotification,
};

type IProps = IStateProps & IDispatchProps & ISubscriptionProps<[IDAOState[], any[]]>

class RedemptionsPage extends React.Component<IProps, null> {
  public render(): RenderOutput {
    const { data } = this.props;

    if (data === null) {
      return <div className={css.wrapper}>
        Please log in to see your rewards.
      </div>;
    }

    const [, proposals] = data;

    return (
      <div className={css.wrapper}>
        <BreadcrumbsItem to="/redemptions">Redemptions</BreadcrumbsItem>
        <Sticky enabled top={50} innerZ={10000}>
          <div className={css.header}>
            <h2>Redemptions</h2>
            {proposals.length > 0 ?
              <span className={css.totalRewards}>Pending Protocol Rewards:&nbsp;{this.renderTotalRewards()}</span>
              : ""
            }
            {proposals.length > 0 ?
              <button
                className={css.redeemAllButton}
                onClick={this.redeemAll.bind(this)}
              >
                <img src="/assets/images/Icon/redeem.svg" />
                Redeem all
              </button>
              : ""
            }
          </div>
        </Sticky>
        <div>
          {proposals.length > 0 ?
            <div>{this.renderProposalsPerDAO()}</div>
            :
            <div className={css.empty}>
              <img src="/assets/images/empty-redemptions.svg"/>
              <h2>Nothing to redeem</h2>
              <p>Get more rewards by proposing a proposal that the DAO accepts, and by voting / staking in alignment with the DAO.</p>
            </div>
          }
        </div>
      </div>
    );
  }

  private async redeemAll() {
    const {
      currentAccountAddress,
      data: [, proposals],
      redeemProposal,
      showNotification,
    } = this.props;

    if (!(await enableWeb3ProviderAndWarn(showNotification.bind(this)))) { return; }

    proposals.forEach(proposal => {
      redeemProposal(proposal.dao.id, proposal.id, currentAccountAddress);
    });
  }

  private renderProposalsPerDAO(): RenderOutput[] {
    const { currentAccountAddress, data: [daos, proposals] } = this.props;

    const arc = getArc();

    const daosPerId = new Map<Address, IDAOState>();
    const proposalsPerDao = new Map<Address, any[]>();
    daos.forEach(dao => {
      daosPerId.set(dao.id, dao);
      proposalsPerDao.set(dao.id, []);
    });
    proposals.forEach(proposal => {
      proposalsPerDao.get(proposal.dao.id).push(proposal);
    });

    return [...proposalsPerDao].map(([daoId, proposals]) => {
      const dao = daosPerId.get(daoId);
      return <div key={"daoProposals_" + daoId} className={css.dao}>
        <div className={css.daoHeader}>{dao.name}</div>
        <div>
          {proposals.map(proposal => {
            return <ProposalCard
              key={"proposal_" + proposal.id}
              currentAccountAddress={currentAccountAddress}
              daoState={dao}
              proposal={new Proposal(proposal.id, arc)}
            />;
          })}
        </div>
      </div>;
    });
  }

  private renderTotalRewards(): RenderOutput {
    const { currentAccountAddress, data: [, proposals] } = this.props;

    const genReward = new BN(0);
    const ethReward = new BN(0);
    const externalTokenRewards: { [symbol: string]: BN } = {};
    const reputationRewardDaos = new Set();

    // Calculate the total rewards from the genesisprotocol
    proposals.forEach((proposal) => {
      proposal.gpRewards.forEach((reward: any) => {
        if (reward.beneficiary === currentAccountAddress) {
          if (reward.tokensForStaker && Number(reward.tokensForStakerRedeemedAt) === 0) {
            genReward.iadd(new BN(reward.tokensForStaker));
          }
          if (reward.daoBountyForStaker && Number(reward.daoBountyForStakerRedeemedAt) === 0) {
            genReward.iadd(new BN(reward.daoBountyForStaker));
          }
          if ((reward.reputationForVoter && Number(reward.reputationForVoterRedeemedAt) === 0)
              || (reward.reputationForProposer && Number(reward.reputationForProposerRedeemedAt) === 0)) {
            reputationRewardDaos.add(proposal.dao.id);
          }
        }
      });

      // Add ContributionReward redemptions
      const contributionReward = proposal.contributionReward;
      if (contributionReward && contributionReward.beneficiary === currentAccountAddress) {
        ethReward.iadd(new BN(contributionReward.ethReward));

        if (Number(contributionReward.reputationReward) > 0) {
          reputationRewardDaos.add(proposal.dao.id);
        }

        if (Number(contributionReward.externalTokenReward) > 0) {
          if (externalTokenRewards[contributionReward.externalToken]) {
            externalTokenRewards[contributionReward.externalToken].iadd(new BN(contributionReward.externalTokenReward));
          } else {
            externalTokenRewards[contributionReward.externalToken] = new BN(contributionReward.externalTokenReward);
          }
        }
      }

    });

    const totalRewards: any[] = [];
    if (!ethReward.isZero()) {
      totalRewards.push(formatTokens(ethReward, "ETH"));
    }
    if (!genReward.isZero()) {
      totalRewards.push(formatTokens(genReward, "GEN"));
    }
    Object.keys(externalTokenRewards).forEach((tokenAddress) => {
      totalRewards.push(formatTokens(externalTokenRewards[tokenAddress], tokenSymbol(tokenAddress)));
    });
    if (reputationRewardDaos.size > 0) {
      totalRewards.push(<span>reputation in {reputationRewardDaos.size}&nbsp;DAOs</span>);
    }

    return <strong>
      {totalRewards.reduce((acc, v) => {
        return acc === null ? <React.Fragment>{v}</React.Fragment> : <React.Fragment>{acc} <em>&amp;</em> {v}</React.Fragment>;
      }, null)}
    </strong>;
  }
}

const SubscribedRedemptionsPage = withSubscription({
  wrappedComponent: RedemptionsPage,
  loadingComponent: <div className={css.loading}><Loading/></div>,
  errorComponent: (props) => <div>{ props.error.message }</div>,
  checkForUpdate: ["currentAccountAddress"],
  createObservable: (props: IStateProps) => {
    const { currentAccountAddress } = props;

    if (!currentAccountAddress) {
      return of(null);
    }

    const arc = getArc();
    const query = gql`
      {
        proposals(
          where: {
            accountsWithUnclaimedRewards_contains: ["${currentAccountAddress}"]
          },
          orderBy: closingAt
        ) {
          id
          dao {
            id
          }
          gpRewards {
            beneficiary
            tokensForStaker
            tokensForStakerRedeemedAt
            daoBountyForStaker
            daoBountyForStakerRedeemedAt
            reputationForVoter
            reputationForVoterRedeemedAt
            reputationForProposer
            reputationForProposerRedeemedAt
          }
          contributionReward {
            id
            beneficiary
            ethReward
            externalToken
            externalTokenReward
            reputationReward
          }
        }
      }
    `;
    const proposals = arc.getObservable(query)
      .pipe(map((result: any) => result.data.proposals));
    const daos = proposals
      .pipe(mergeMap((proposals: any[]): Observable<IDAOState[]> => {
        const daoIds = new Set(proposals.map((proposal: any) => { return proposal.dao.id; }));
        return combineLatest(Array.from(daoIds, (id: any) => arc.dao(id).state()))
          .pipe(defaultIfEmpty([]));
      }));
    return combineLatest(daos, proposals);
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SubscribedRedemptionsPage);
