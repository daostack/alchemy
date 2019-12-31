import { toggleFollow } from "actions/profilesActions";
import { enableWalletProvider } from "arc";
import classNames from "classnames";
import ThreeboxModal from "components/Shared/ThreeboxModal";
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
  currentAccountAddress: string;
  currentAccountProfile: IProfileState;
  threeBox: any;
}

type IProps = IDispatchProps & IExternalProps & IStateProps;

interface IState {
  pendingFollow: boolean;
  showThreeboxModal: boolean;
}

const mapDispatchToProps = {
  showNotification,
  toggleFollow,
};

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ...ownProps,
    currentAccountAddress: state.web3.currentAccountAddress,
    currentAccountProfile: state.profiles[state.web3.currentAccountAddress],
    threeBox: state.profiles.threeBox,
  };
};

class FollowButton extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      pendingFollow: false,
      showThreeboxModal: false,
    };
  }

  public doFollow = async () => {
    this.setState({ pendingFollow: true });

    const { toggleFollow, currentAccountAddress } = this.props;
    await toggleFollow(currentAccountAddress, this.props.type, this.props.id);
    this.setState({ pendingFollow: false });
  }

  private openThreeboxModal = async (e: any) => {
    e.preventDefault();
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    // If they already have a saved threeBox from this session
    //  or 3box has cached their signature and doesnt need it again
    //  or they have checked the box not to see threebox interstitial again then just do the follow
    if (this.props.threeBox || parseInt(localStorage.getItem("serialized3id_" + this.props.currentAccountAddress)) || parseInt(localStorage.getItem("dontShowThreeboxModal"))) {
      await this.doFollow();
    } else {
      this.setState({ showThreeboxModal: true });
    }
  }

  private closeThreeboxModal = (_e: any): void => {
    this.setState({ showThreeboxModal: false });
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
          onClick={this.openThreeboxModal}
          className={buttonClass}
          data-test-id="follow-button"
        >
          <div className={css.spinner}></div>
          <span className={css.followText}>{isFollowing ? "Following" : "Follow"}</span>
          <span className={css.unfollowText}>Unfollow</span>
          {this.state.showThreeboxModal ?
            <ThreeboxModal action={this.doFollow} closeHandler={this.closeThreeboxModal} />
            : ""}
        </button>
      </Tooltip>
    );
  }

}

export default connect(mapStateToProps, mapDispatchToProps)(FollowButton);
