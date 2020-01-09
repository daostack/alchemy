import { toggleFollow } from "actions/profilesActions";
import { enableWalletProvider } from "arc";
import classNames from "classnames";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { connect } from "react-redux";
import { showNotification } from "reducers/notifications";
import { IRootState } from "reducers";
import { FollowType, IProfileState } from "reducers/profilesReducer";

import * as css from "./FollowButton.scss";

interface IExternalProps {
  id: string;
  type: FollowType;
  style?: "default" | "white" | "bigButton";
}

interface IDispatchProps {
  showNotification: typeof showNotification;
  toggleFollow: typeof toggleFollow;
}

interface IStateProps {
  currentAccountProfile: IProfileState;
}

type IProps = IDispatchProps & IExternalProps & IStateProps;

interface IState {
  pendingFollow: boolean;
}

const mapDispatchToProps = {
  showNotification,
  toggleFollow,
};

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ...ownProps,
    currentAccountProfile: state.profiles[state.web3.currentAccountAddress],
  };
};

class FollowButton extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      pendingFollow: false,
    };
  }

  public handleClick = async (e: any) => {
    e.preventDefault();
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }
    this.setState({ pendingFollow: true });

    const { toggleFollow, currentAccountProfile } = this.props;
    await toggleFollow(currentAccountProfile.ethereumAccountAddress, this.props.type, this.props.id);
    this.setState({ pendingFollow: false });
  }

  public render() {
    const { currentAccountProfile, id, type, style } = this.props;

    const isFollowing = currentAccountProfile && currentAccountProfile.follows && currentAccountProfile.follows[type].includes(id);

    const buttonClass = classNames({
      [css.followButton]: true,
      [css.bigButton]: style === "bigButton",
      [css.white]: style === "white",
      [css.isFollowing]: isFollowing,
      [css.pending]: this.state.pendingFollow,
    });

    return (
      <Tooltip placement="bottom" trigger={["hover"]} overlay={isFollowing ? "Stop following updates from this " + type.slice(0, -1) : "Follow updates from this " + type.slice(0, -1)}>
        <button
          onClick={this.handleClick}
          className={buttonClass}
          data-test-id="follow-button"
        >
          <div className={css.spinner}></div>
          <span className={css.followText}>{isFollowing ? "Following" : "Follow"}</span>
          <span className={css.unfollowText}>Unfollow</span>
        </button>
      </Tooltip>
    );
  }

}

export default connect(mapStateToProps, mapDispatchToProps)(FollowButton);
