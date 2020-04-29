import { Address, IDAOState, IProposalStage, Vote, Proposal } from "@daostack/arc.js";
import classNames from "classnames";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import ProposalCountdown from "components/Shared/ProposalCountdown";
import FollowButton from "components/Shared/FollowButton";
import { humanProposalTitle } from "lib/util";
import { Page } from "pages";
import * as React from "react";
import TrackVisibility from "react-on-screen";
import { Link } from "react-router-dom";
import { closingTime } from "lib/proposalHelpers";
import TagsSelector from "components/Proposal/Create/SchemeForms/TagsSelector";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import ActionButton from "./ActionButton";
import BoostAmount from "./Staking/BoostAmount";
import StakeButtons from "./Staking/StakeButtons";
import StakeGraph from "./Staking/StakeGraph";
import ProposalData from "./ProposalData";
import ProposalSummary from "./ProposalSummary";
import VoteBreakdown from "./Voting/VoteBreakdown";
import VoteButtons from "./Voting/VoteButtons";
import VoteGraph from "./Voting/VoteGraph";

import * as css from "./ProposalCard.scss";

interface IExternalProps {
  currentAccountAddress: Address;
  daoState: IDAOState;
  proposal: Proposal;
  suppressTrainingTooltips?: boolean;
}

type IProps = IExternalProps;

export default class ProposalCard extends React.Component<IProps, null> {

  constructor(props: IProps) {
    super(props);
  }

  private stopClick = (e: any) => { e.preventDefault(); e.stopPropagation(); }

  public render(): RenderOutput {

    const {
      currentAccountAddress,
      daoState,
      proposal,
    } = this.props;

    return <ProposalData currentAccountAddress={currentAccountAddress} daoState={daoState} proposalId={proposal.id}>
      { props => {
        const {
          beneficiaryProfile,
          creatorProfile,
          currentAccountGenBalance,
          currentAccountGenAllowance,
          daoEthBalance,
          expired,
          member,
          proposal,
          rewards,
          stakes,
          votes,
        } = props;

        const tags = proposal.tags;

        let currentAccountVote = 0;

        let currentVote: Vote;

        // TODO: the next line, is a hotfix for a  which filters the votes, should not be necessary
        // https://daostack.tpondemand.com/RestUI/Board.aspx#page=board/5209716961861964288&appConfig=eyJhY2lkIjoiQjgzMTMzNDczNzlCMUI5QUE0RUE1NUVEOUQyQzdFNkIifQ==&boardPopup=bug/1766
        const currentAccountVotes = votes.filter((v: Vote) => v.coreState.voter === currentAccountAddress);
        if (currentAccountVotes.length > 0) {
          currentVote = currentAccountVotes[0];
          currentAccountVote = currentVote.coreState.outcome;
        }

        const proposalClass = classNames({
          [css.proposal]: true,
        });

        const voteWrapperClass = classNames({
          [css.voteBox]: true,
          clearfix: true,
        });

        const voteControls = classNames({
          [css.voteControls]: true,
        });

        const votingHtml = <div className={voteWrapperClass}>
          <div className={voteControls + " clearfix"}>
            <div className={css.voteDivider}>
              <VoteGraph size={40} proposal={proposal} />
            </div>

            <VoteBreakdown
              currentAccountAddress={currentAccountAddress}
              currentAccountState={member}
              currentVote={currentAccountVote}
              daoState={daoState}
              proposal={proposal}
              detailView={false} />
          </div>

          <div className={css.voteButtons}>
            <VoteButtons
              currentAccountAddress={currentAccountAddress}
              currentAccountState={member}
              currentVote={currentAccountVote}
              dao={daoState}
              expired={expired}
              proposal={proposal}
              parentPage={Page.SchemeProposals}
            />
          </div>
        </div>;

        const stakingHtml = <div className={css.predictions}>
          <StakeGraph
            proposal={proposal}
          />
          <BoostAmount proposal={proposal} />

          <div className={css.predictionButtons}>
            <StakeButtons
              beneficiaryProfile={beneficiaryProfile}
              currentAccountAddress={currentAccountAddress}
              currentAccountGens={currentAccountGenBalance}
              currentAccountGenStakingAllowance={currentAccountGenAllowance}
              dao={daoState}
              expired={expired}
              proposal={proposal}
              stakes={stakes}
              parentPage={Page.SchemeProposals}
            />
          </div>
        </div>;

        return <div className={proposalClass + " clearfix"} data-test-id={"proposal-" + proposal.id}>
          <div className={css.proposalInfo}>
            <div className={css.cardTop + " clearfix"}>
              <Link to={"/dao/" + daoState.address + "/proposal/" + proposal.id}>
                <div className={css.timer}>
                  <span className={css.content}>
                    {!expired
                      ? <ProposalCountdown proposal={proposal} detailView={false} />
                      : <span className={css.closedTime}>
                        {proposal.stage === IProposalStage.Queued ? "Expired" :
                          proposal.stage === IProposalStage.PreBoosted ? "Ready to Boost" :
                            "Closed"}&nbsp;
                        {closingTime(proposal).format("MMM D, YYYY")}
                      </span>
                    }
                  </span>
                </div>
              </Link>

              <div className={css.actionButton}>
                <ActionButton
                  currentAccountAddress={currentAccountAddress}
                  daoState={daoState}
                  daoEthBalance={daoEthBalance}
                  proposalState={proposal}
                  rewards={rewards}
                  expired={expired}
                  parentPage={Page.SchemeProposals}
                />

                <div onClick={this.stopClick} className={css.contextMenu} data-test-id="proposalContextMenu">
                  <div className={css.menuIcon}>
                    <img src="/assets/images/Icon/Context-menu.svg"/>
                  </div>
                  <TrackVisibility partialVisibility={false} offset={-116}>{({ isVisible }) =>
                    <div className={classNames({[css.menu]: true, [css.leftMenu]: !isVisible })}>
                      <div className={css.followButton}>
                        <FollowButton id={proposal.id} type="proposals" />
                      </div>

                      <VoteButtons
                        currentAccountAddress={currentAccountAddress}
                        currentAccountState={member}
                        currentVote={currentAccountVote}
                        dao={daoState}
                        expired={expired}
                        proposal={proposal}
                        contextMenu
                        parentPage={Page.SchemeProposals}
                      />

                      <StakeButtons
                        beneficiaryProfile={beneficiaryProfile}
                        contextMenu
                        currentAccountAddress={currentAccountAddress}
                        currentAccountGens={currentAccountGenBalance}
                        currentAccountGenStakingAllowance={currentAccountGenAllowance}
                        dao={daoState}
                        expired={expired}
                        proposal={proposal}
                        stakes={stakes}
                        parentPage={Page.SchemeProposals}
                      />
                    </div>
                  }
                  </TrackVisibility>
                </div>
              </div>
            </div>
            <div className={css.createdBy}>
              <AccountPopup accountAddress={proposal.proposer} daoState={daoState} width={12} />
              <AccountProfileName accountAddress={proposal.proposer} accountProfile={creatorProfile} daoAvatarAddress={daoState.address} detailView={false} />
            </div>

            <Link to={"/dao/" + daoState.address + "/proposal/" + proposal.id}>
              <div className={css.description}>
                {proposal.description}
              </div>

              <h3 className={css.detailLink} data-test-id="proposal-title">
                <span>{humanProposalTitle(proposal)}</span>
              </h3>

              { tags && tags.length ? <div className={css.tagsContainer}>
                <TagsSelector readOnly tags={tags}></TagsSelector>
              </div> : "" }
            </Link>

            <div className={css.summary}>
              <ProposalSummary proposal={proposal} dao={daoState} beneficiaryProfile={beneficiaryProfile} detailView={false} />
            </div>

          </div>

          <Link to={"/dao/" + daoState.address + "/proposal/" + proposal.id}>
            <div className={css.proposalActions + " clearfix"}>
              { this.props.suppressTrainingTooltips ? votingHtml :
                (<TrainingTooltip placement="topLeft" overlay={"Percentage of voting power currently voting for and against"}>
                  {votingHtml}
                </TrainingTooltip>)
              }

              { this.props.suppressTrainingTooltips ? stakingHtml :
                (<TrainingTooltip placement="right" overlay={"GEN tokens staked to predict the proposal will pass or fail"}>
                  {stakingHtml}
                </TrainingTooltip>)
              }
            </div>
          </Link>
        </div>;
      }
      }
    </ProposalData>;
  }
}
