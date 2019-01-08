import * as React from "react";
import Tooltip from "rc-tooltip";
import { IDaoState, IProposalState } from "reducers/arcReducer";

interface IProps {
  proposal: IProposalState;
}

const activeHashtags: {[hashtag: string]: {[tooltip: string]: string}} = {
  "#heading": {
    "tooltip": "The most recent executed proposal with the #heading tag becomes the DAO's heading."
  },
  "#idea": {
    "tooltip": "Executed proposals with the #idea tag appear in Proposal Ideas."
  }
};

export default class HashtaggedTitle extends React.Component<IProps, null> {
  public render() {
    const { proposal } = this.props;

    let title = proposal.title;
    let titleSplits: number[][] = [];
    let hashtags: string[] = [];

    function findHashtagSplits(title: string, index: number) {
      let match = title.match(/\B\#\w+\b/);
      if (!!match) {
        hashtags.push(match[0].toLowerCase());
        titleSplits.push([index + match.index, index + match.index + match[0].length]);
        findHashtagSplits(
          title.slice(match.index + match[0].length),
          index + match.index + match[0].length
        );
      }
    }

    findHashtagSplits(title, 0);

    if (hashtags.length === 0) {
      return (
        <div>{title}</div>
      )
    }

    interface ITooltipProps {
      [key: string]: any;
    }
    const tooltips: ITooltipProps = {};

    hashtags.map((hashtag, i) => {
      if (hashtag in activeHashtags) {
        tooltips[`${i}+${proposal.proposalId}`] = activeHashtags[hashtag].tooltip;
      }
    });

    const hashtagStyle = {
      fontStyle: 'italic',
      display: 'inline-block',
      color: 'rgba(0, 0, 0, .5)'
    };

    const hashtagSegmentStyle = {
      display: 'inline-block',
      paddingRight: '0.3ch'
    };

    return (
      <div>
        {title.slice(0, titleSplits[0][0])}
        {titleSplits.map((split, i) => {
          if (tooltips[`${i}+${proposal.proposalId}`]) {
            if (!!titleSplits[i + 1]) {
              return (
                <div key={title.slice(split[0], titleSplits[i + 1][0])} style={hashtagSegmentStyle}>
                  <Tooltip overlay={tooltips[`${i}+${proposal.proposalId}`]} placement="top">
                    <div style={hashtagStyle}>
                      {title.slice(split[0], split[1])}
                    </div>
                  </Tooltip>
                  {title.slice(split[1], titleSplits[i + 1][0])}
                </div>
              );
            }
            return (
              <div key={title.slice(split[0])} style={hashtagSegmentStyle}>
                <Tooltip overlay={tooltips[`${i}+${proposal.proposalId}`]} placement="top">
                  <div style={hashtagStyle}>
                    {title.slice(split[0], split[1])}
                  </div>
                </Tooltip>
                {title.slice(split[1])}
              </div>
            );
          }
          if (!!titleSplits[i + 1]) {
            return (
              <div key={title.slice(split[0], titleSplits[i + 1][0])} style={hashtagSegmentStyle}>
                  <div style={hashtagStyle}>
                    {title.slice(split[0], split[1])}
                  </div>
                {title.slice(split[1], titleSplits[i + 1][0])}
              </div>
            );
          }
          return (
            <div key={title.slice(split[0])} style={hashtagSegmentStyle}>
                <div style={hashtagStyle}>
                  {title.slice(split[0], split[1])}
                </div>
              {title.slice(split[1])}
            </div>
          );
        })}
      </div>
    );
  }
}
