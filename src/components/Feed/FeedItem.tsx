import { Event } from "@daostack/client";
import ProposalFeedItem from "./ProposalFeedItem";
import { IProfileState } from "reducers/profilesReducer";
import * as React from "react";
//import { Link } from "react-router-dom";
import * as css from "./Feed.scss";

interface IProps {
  event: Event;
  profile: IProfileState;
}

const FeedItem = (props: IProps) => {
  const { event, profile } = props;

  let title;
  let content;
  let icon;
  switch (event.staticState.type) {
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
      title = "DAO Name - proposal is boosted";
      icon = <img src="/assets/images/Icon/info.svg" />;
      content = <ProposalFeedItem event={event} profile={profile} />;
      break;
    case "VoteFlip":
      // TODO: which direction did it flip?
      title = "For is now in the load";
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
      title = "Staked for";
      icon = <img src="/assets/images/Icon/v-small-line.svg" />;
      content = <ProposalFeedItem event={event} profile={profile} />;
      break;
    case "Vote":
      title = "Voted for";
      icon = <img src="/assets/images/Icon/vote/for-gray.svg" />;
      content = <ProposalFeedItem event={event} profile={profile} />;
      break;
    default:
      return null;
  }

  return (
    <div className={css.feedItemContainer} data-test-id={`eventCard-${event.staticState.id}`}>
      <span>{icon}</span>
      <div className={css.itemTitle}><span>{title}</span></div>
      <div className={css.itemContent}>{content}</div>
    </div>
  );
};

export default FeedItem;
