// import { Event } from "@daostack/client";
import BN = require("bn.js");
import AccountImage from "components/Account/AccountImage";
import AccountProfileName from "components/Account/AccountProfileName";
import DaoFeedItem from "./DaoFeedItem";
import * as GeoPattern from "geopattern";
import { fromWei } from "lib/util";
import moment = require("moment");
import { Link } from "react-router-dom";
import { IProfileState } from "reducers/profilesReducer";
import * as React from "react";
import ProposalFeedItem from "./ProposalFeedItem";
//import { Link } from "react-router-dom";
import * as css from "./Feed.scss";

interface IProps {
  event: any;
  currentAccountProfile: IProfileState;
  userProfile: IProfileState;
}

const accountTitle = (event: any, userProfile: IProfileState, text: string) => {
  return <span>
    <AccountImage accountAddress={event.user} width={17} />
    <span className={css.accountName}><AccountProfileName accountAddress={event.user} accountProfile={userProfile} daoAvatarAddress={event.dao.id} /></span>
    <span>{text}</span>
  </span>;
};

const daoTitle = (event: any, text = "") => {
  const bgPattern = GeoPattern.generate(event.dao.address + event.dao.name);

  return <span>
    <Link to={"/dao/" + event.dao.address}>
      <b className={css.daoIcon} style={{ backgroundImage: bgPattern.toDataUrl() }}></b>
      <em></em>
      <span>{event.dao.name}</span>
      &nbsp;
    </Link>
    <span>{text}</span>
  </span>;
};

const FeedItem = (props: IProps) => {
  const { event, userProfile } = props;

  let title;
  let content;
  let icon;
  const eventData = JSON.parse(event.data);
  console.log(event);
  switch (event.type) {
    case "NewDAO":
      title = <span>New DAO! {daoTitle(event)}</span>;
      icon = "🎉";
      content = <DaoFeedItem event={event} />;
      break;
    case "NewReputationHolder":
      // TODO
      title = daoTitle(event, "has a new reputation holder");
      icon = <img src="/assets/images/Icon/new-person.svg" />;
      content = <DaoFeedItem event={event} />;
      break;
    case "ProposalStageChange":
      // TODO: dao name and boosted or unboosted?
      title = daoTitle(event, ` - proposal stage changed to ${eventData.stage}`);
      icon = <img src="/assets/images/Icon/info.svg" />;
      content = <ProposalFeedItem event={event} />;
      break;
    case "VoteFlip": {
      const voteFlipForAgainst = eventData.outcome === "Pass" ? "Pass" : "Fail";
      title = `${voteFlipForAgainst} is now in the lead`;
      icon = <img src="/assets/images/Icon/info.svg" />;
      content = <ProposalFeedItem event={event} />;
      break;
    }
    case "NewProposal":
      // TODO: proposer name. also maybe start with DAO name?
      title = accountTitle(event, userProfile, "submitted a new proposal");
      icon = <img src="/assets/images/Icon/circle-plus.svg" />;
      content = <ProposalFeedItem event={event} />;
      break;
    case "Stake": {
      const stakeForAgainst = eventData.outcome === "Pass" ? "Pass" : "Fail";
      title = accountTitle(event, userProfile, `staked on ${stakeForAgainst} with ${fromWei(new BN(eventData.stakeAmount))} GEN`);
      icon = <img src="/assets/images/Icon/v-small-line.svg" />;
      content = <ProposalFeedItem event={event} />;
      break;
    }
    case "Vote": {
      const voteForAgainst = eventData.outcome === "Pass" ? "For" : "Against";
      //title = `${event.user} voted ${voteForAgainst} with ${eventData.reputationAmount} REP`;
      title = accountTitle(event, userProfile, `voted on ${voteForAgainst} with ${fromWei(new BN(eventData.reputationAmount))} REP`);
      icon = <img src="/assets/images/Icon/vote/for-gray.svg" />;
      content = <ProposalFeedItem event={event} />;
      break;
    }
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
