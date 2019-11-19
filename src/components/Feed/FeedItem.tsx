// import { Event } from "@daostack/client";
import moment = require("moment");
import { IProfileState } from "reducers/profilesReducer";
import * as React from "react";
import ProposalFeedItem from "./ProposalFeedItem";
//import { Link } from "react-router-dom";
import * as css from "./Feed.scss";

interface IProps {
  event: any;
  profile: IProfileState;
}

const FeedItem = (props: IProps) => {
  const { event, profile } = props;

  let title;
  let content;
  let icon;
  let eventData = JSON.parse(event.data)
  switch (event.type) {
    case "NewDAO":
      title = "New DAO!";
      icon = "🎉";
      content = "msodifnisudfnisu nfisabdfi bsidbusabvfuasbf usbfuasbfuasbvfuavfuavfusdyafvuadsyfv";
      break;
    case "NewReputationHolder":
      // TODO
      title = "DAO name has a new reputation holder";
      icon = <img src="/assets/images/Icon/new-person.svg" />;
      content = "msodifnisudfnisu nfisabdfi bsidbusabvfuasbf usbfuasbfuasbvfuavfuavfusdyafvuadsyfv";
      break;
    case "ProposalStageChange":
      // TODO: dao name and boosted or unboosted?
      title = `${event.dao.name} - proposal stage changed to ${eventData.stage}`;
      icon = <img src="/assets/images/Icon/info.svg" />;
      content = <ProposalFeedItem event={event} profile={profile} />;
      break;
    case "VoteFlip":
      const voteFlipForAgainst = eventData.outcome === "Pass" && "Pass" || "Fail"
      title = `${voteFlipForAgainst} is now in the lead`;
      icon = <img src="/assets/images/Icon/info.svg" />;
      content = <ProposalFeedItem event={event} profile={profile} />;
      break;
    case "NewProposal":
      // TODO: proposer name. also maybe start with DAO name?
      title = "Proposer submitted a new proposal";
      icon = <img src="/assets/images/Icon/circle-plus.svg" />;
      content = <ProposalFeedItem event={event} profile={profile} />;
      break;
    case "Stake":
      const stakeForAgainst = eventData.outcome === "Pass" && "Pass" || "Fail"
      title = `${event.user} staked on ${stakeForAgainst} with ${eventData.stakeAmount} REP`;
      icon = <img src="/assets/images/Icon/v-small-line.svg" />;
      content = <ProposalFeedItem event={event} profile={profile} />;
      break;
    case "Vote":
      const voteForAgainst = eventData.outcome === "Pass" && "For" || "Against"
      title = `${event.user} voted ${voteForAgainst} with ${eventData.reputationAmount} REP`;
      icon = <img src="/assets/images/Icon/vote/for-gray.svg" />;
      content = <ProposalFeedItem event={event} profile={profile} />;
      break;
    default:
      return null;
  }

  return (
    <div className={css.feedItemContainer} data-test-id={`eventCard-${event.id}`}>
      <span className={css.icon}>{icon}</span>
      <div className={css.itemTitle}>
        <span>{title}</span>
        <span className={css.timestamp}>{moment.unix(event.timestamp).fromNow()}</span>
      </div>
      <div className={css.itemContent}>{content}</div>
    </div>
  );
};

export default FeedItem;
