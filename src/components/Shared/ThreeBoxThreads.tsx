import { Address, IDAOState } from "@daostack/arc.js";
import { threeboxLogin, joinThread, getThread, getPosts, subcribeToThread, addPost } from "actions/profilesActions";
import { enableWalletProvider, getAccountIsEnabled } from "arc";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import HelpButton from "components/Shared/HelpButton";
import MarkdownInput from "components/Shared/MarkdownInput";
import ProposalDescription from "components/Shared/ProposalDescription";
import { EnumButtonSpec } from "components/Shared/SimpleMessagePopup";
import i18next from "i18next";
import { SortService, SortOrder } from "lib/sortService";
import { waitUntilTrue, formatFriendlyDateForLocalTimezone, showSimpleMessage } from "lib/util";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { showNotification, NotificationStatus } from "reducers/notifications";
import { IProfilesState, I3BoxThreadPost, I3BoxThread } from "reducers/profilesReducer";
import * as css from "./ThreeboxThreads.scss";

type IExternalProps = {
  currentAccountAddress: Address;
  daoState: IDAOState;
  threadId: string;
};

interface IDispatchProps {
  threeboxLogin: typeof threeboxLogin;
  showNotification: typeof showNotification;
}

interface IExternalStateProps {
  profiles: IProfilesState;
  threeBox: any;
}

interface IStateProps {
  threeboxPosts?: Array<I3BoxThreadPost>;
  joinedThread?: I3BoxThread;
  joiningThread?: boolean;
  hasCommentInput?: boolean;
}

const mapDispatchToProps = {
  threeboxLogin,
  showNotification,
};

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IExternalStateProps => {
  return {
    ...ownProps,
    profiles: state.profiles,
    threeBox: state.profiles.threeBox,
  };
};

type IProps = IExternalProps & IDispatchProps & IExternalStateProps;

class ThreeBoxThreads extends React.Component<IProps, IStateProps> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      threeboxPosts: null,
      joinedThread: null,
      joiningThread: false,
      hasCommentInput: false,
    };
  }

  private commentInput: string;

  private get3BoxThread(join = false): Promise<I3BoxThread | null> {
    if (join) {
      return joinThread(this.props.threadId, this.props.currentAccountAddress, this.props.profiles);
    } else {
      return getThread(this.props.threadId);
    }
  }

  private getPosts = async (thread: I3BoxThread) => {
    return (await getPosts(thread)).sort((a, b) => { return SortService.evaluateDateTime(a.createDate, b.createDate, SortOrder.DESC); });
  }

  private startDiscussion = async () => {
    let joining = false;
    try {
      if (!this.state.joinedThread) {
        joining = true;
        this.setState({ joiningThread: true });
        await waitUntilTrue(() => this.state.joiningThread, 10000);
        if (!await enableWalletProvider({ showNotification: this.props.showNotification })) {
          return;
        } else {
          await waitUntilTrue(() => !!this.props.currentAccountAddress && getAccountIsEnabled(), 15000);
          await this.props.threeboxLogin(this.props.currentAccountAddress);
          await waitUntilTrue(() => !!this.props.profiles.threeBoxSpace, 30000);
          const thread = await this.get3BoxThread(true);
          if (thread) {
            subcribeToThread(thread, this.handleNewPosts);
            this.setState({ joinedThread: thread }); // so we can see our new posts when we post them
          } else {
            showNotification(NotificationStatus.Failure, "Unable to join the conversation");
          }
        }
      }
    } catch (ex) {
      showNotification(NotificationStatus.Failure, `Unable to join the conversation: ${ex?.message ?? "unknown error"}`);
    } finally {
      if (joining) {
        this.setState({ joiningThread: false });
      }
    }
  }

  private handleCommentInput = (markdown: string): void => {
    this.commentInput = markdown;
    this.setState({ hasCommentInput: !!this.commentInput.length });
  }

  private submitPost = async () => {
    if (this.commentInput?.trim()) {
      if (!await enableWalletProvider({ showNotification: this.props.showNotification })) {
        return;
      } else {
        await waitUntilTrue(() => !!this.props.currentAccountAddress && getAccountIsEnabled(), 60000);
        await this.props.threeboxLogin(this.props.currentAccountAddress);
        await waitUntilTrue(() => !!this.props.profiles.threeBoxSpace, 60000);
        addPost(this.state.joinedThread, this.commentInput.trim());
      }
    }
  }

  private deleteComment = (post: I3BoxThreadPost) => {
    this.state.joinedThread.deletePost(post.postId);
  }

  private deleteCommentConfirmation = (post: I3BoxThreadPost): void => {
    showSimpleMessage(
      {
        body: <>{i18next.t("Delete3BoxPostConfirmation")}</>,
        buttonSpec: EnumButtonSpec.YesNo,
        submitHandler: () => this.deleteComment(post),
        title: i18next.t("Delete3BoxPost"),
        width: "280px",
      }
    );
  }

  private handleNewPosts = async () => {
    const posts = await this.getPosts(this.state.joinedThread);
    this.setState({ threeboxPosts: posts });
  }

  public async componentDidMount(): Promise<void> {
    const thread = await this.get3BoxThread();
    if (thread) {
      // subcribeToThread(thread, this.handleNewPosts);
      const posts = await this.getPosts(thread);
      this.setState({ threeboxPosts: posts });
    } else {
      // sp at least we know we're done setting up
      this.setState({ threeboxPosts: [] });
    }
  }

  static getDerivedStateFromProps(props: IProps, state: IStateProps): Partial<IStateProps> {
    /**
     * handle logouts
     */
    return (state.joinedThread && !props.profiles.threeBox) ?
      { joinedThread: null, hasCommentInput: false, joiningThread: false } : null;
  }

  public render(): JSX.Element {
    const daoState = this.props.daoState;

    return (
      <div className={css.container}>
        <div className={css.startDiscussionButton}>
          {!this.state.joinedThread && (this.state.threeboxPosts !== null) ?
            <Tooltip placement="top" trigger={["hover"]} overlay={i18next.t(this.state.threeboxPosts?.length ? "Enable3BoxInteractions" : "CreateFirst3BoxPost")}>
              <a onClick={this.startDiscussion}>{i18next.t(this.state.threeboxPosts?.length ? "JoinTheConversation" : "StartAConversation")}{this.state.joiningThread ? <img className={css.loading} src="/assets/images/Icon/buttonLoadingWhite.gif" /> : ""}</a>
            </Tooltip>
            : ""
          }
        </div>

        {this.state.joinedThread ?
          <div className={css.threeboxCommentInput}>
            <HelpButton text={i18next.t("CommentHelpText")}></HelpButton>
            <div className={css.commentsInput}>
              <MarkdownInput onChange={this.handleCommentInput}></MarkdownInput>
            </div>
            <a className={`${css.submitComments} ${this.state.hasCommentInput ? "" : css.disabled}`} onClick={this.submitPost}>{i18next.t("Submit3BoxPost")}</a>
          </div> : ""
        }
        {this.state.threeboxPosts?.length ?
          <div className={css.threeboxposts}>
            {this.state.threeboxPosts.map((post, index) => {
              return (<div key={index} className={css.threeboxpost}>
                <div className={css.column1}>
                  <AccountPopup accountAddress={post.author} daoState={daoState} width={38} />
                </div>
                <div className={css.column2}>
                  <div className={css.info}>
                    <div className={css.author}><AccountProfileName accountAddress={post.author} accountProfile={this.props.profiles[post.author]} daoAvatarAddress={daoState.address} /></div>
                    <div className={css.createdOn}>{formatFriendlyDateForLocalTimezone(post.createDate)}</div>
                    {(this.state.joinedThread && (post.author.toLowerCase() === this.props.currentAccountAddress)) ?
                      <Tooltip placement="top" trigger={["hover"]} overlay={i18next.t("Delete3BoxPost")}>
                        { // eslint-disable-next-line react/jsx-no-bind
                          <div className={css.deletePost} onClick={() => this.deleteCommentConfirmation(post)}><img src="/assets/images/Icon/delete.svg" /></div>
                        }
                      </Tooltip>
                      : ""}
                  </div>
                  <div className={css.message}>{<ProposalDescription description={post.message} />}</div>
                </div>
              </div>);
            })
            }
          </div> :
          // eslint-disable-next-line no-constant-condition
          (this.state.threeboxPosts === null) ?
            <div className={css.awaitingPosts}><img className={css.loading} src="/assets/images/Icon/buttonLoadingBlue.gif" /><div className={css.body}>Fetching Conversations...</div></div>
            : ""
        }
      </div>);
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ThreeBoxThreads);
