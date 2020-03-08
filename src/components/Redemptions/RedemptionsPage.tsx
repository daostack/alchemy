import { Address, IDAOState, Proposal } from "@daostack/client";
import { enableWalletProvider, getArc } from "arc";
import { redeemProposal } from "actions/arcActions";

import BN = require("bn.js");
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import gql from "graphql-tag";
import Analytics from "lib/analytics";
import { baseTokenName, formatTokens, genName, tokenDecimals, tokenSymbol } from "lib/util";
import { Page } from "pages";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { connect } from "react-redux";
import * as Sticky from "react-stickynode";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import { combineLatest, of } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
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
  redeemProposal: typeof redeemProposal;
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  redeemProposal,
  showNotification,
};

type IProps = IStateProps & IDispatchProps & ISubscriptionProps<[IDAOState[], any[]]>

class RedemptionsPage extends React.Component<IProps, null> {

  public componentDidMount() {
    Analytics.track("Page View", {
      "Page Name": Page.Redemptions,
      "Account Address": this.props.currentAccountAddress,
    });
  }

  public render(): RenderOutput {
    const { data } = this.props;

    if (data === null) {
      return <div className={css.wrapper}>
        <h3 className={css.pleaseLogin}>Please log in to see your rewards.</h3>
      </div>;
    }

    const [, proposals] = data;

    return (
      <div className={css.wrapper}>
        <BreadcrumbsItem to="/redemptions">Redemptions</BreadcrumbsItem>
        <Sticky enabled top={50} innerZ={10000}>
          <div className={css.header}>
            <div className={css.title}>
              <div className={css.caption}>Redemptions</div>
              {proposals.length > 0 ?
                <div className={css.totalRewards}>Pending Protocol Rewards: {this.renderTotalRewards()}</div>
                : ""
              }
            </div>
            {proposals.length > 0 ?
              <div>
                <button
                  className={css.redeemAllButton}
                  onClick={this.redeemAll}
                >
                  <img src="/assets/images/Icon/redeem.svg" />
                Redeem all
                </button>
              </div>
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

  private redeemAll = async (): Promise<void> => {
    const {
      currentAccountAddress,
      data: [, proposals],
      redeemProposal,
      showNotification,
    } = this.props;

    if (!await enableWalletProvider({ showNotification })) { return; }

    proposals.forEach(proposal => {
      redeemProposal(proposal.dao.id, proposal.id, currentAccountAddress);
    });
  }

  private renderProposalsPerDAO(): RenderOutput[] {
    const { currentAccountAddress, data: [daos, proposals] } = this.props;

    const arc = getArc();

    const daosPerId = new Map<Address, IDAOState>();
    const proposalsPerDao = new Map<Address, any[]>();
    daos.forEach(daoState => {
      daosPerId.set(daoState.id, daoState);
    });
    proposals.forEach(proposal => {
      if (proposalsPerDao.get(proposal.dao.id) === undefined) {
        proposalsPerDao.set(proposal.dao.id, []);
      }
      proposalsPerDao.get(proposal.dao.id).push(proposal);
    });

    return [...proposalsPerDao].map(([daoId, proposals]) => {
      const daoState = daosPerId.get(daoId);
      return <div key={"daoProposals_" + daoId} className={css.dao}>
        <div className={css.daoHeader}>{daoState.name}</div>
        <div>
          {proposals.map(proposal => {
            return <ProposalCard
              key={"proposal_" + proposal.id}
              currentAccountAddress={currentAccountAddress}
              daoState={daoState}
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
      totalRewards.push(formatTokens(ethReward, baseTokenName()));
    }
    if (!genReward.isZero()) {
      totalRewards.push(formatTokens(genReward, genName()));
    }
    Object.keys(externalTokenRewards).forEach((tokenAddress) => {
      totalRewards.push(formatTokens(externalTokenRewards[tokenAddress], tokenSymbol(tokenAddress), tokenDecimals(tokenAddress)));
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
    const query = gql`query proposalsWithUnclaimedRewards
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
    const proposals = arc.getObservable(query, { subscribe: true })
      .pipe(map((result: any) => result.data.proposals));
    const daos = arc.daos()
      .pipe(
        mergeMap(
          (daos) => combineLatest(Array.from(daos, (dao) => dao.state())
          )
        )
      );
    return combineLatest(daos, proposals);
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SubscribedRedemptionsPage);
