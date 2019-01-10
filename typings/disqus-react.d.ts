declare module "disqus-react" {
  export class DiscussionEmbed extends React.Component<DiscussionEmbedProps, null> {
    constructor(props: DiscussionEmbedProps);
  }

  interface DiscussionEmbedProps {
    shortname: string;
    config: DiscussionEmbedConfig;
  }

  interface DiscussionEmbedConfig {
    url: string;
    identifier: string;
    title?: string;
  }

  export class CommentCount extends React.Component<CommentCountProps, null> {}

  interface CommentCountProps {
    shortname: string;
    config: DiscussionEmbedConfig;
  }
}
