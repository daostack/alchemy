import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import classNames = require("classnames");
import * as React from "react";

import { IProfileState } from "reducers/profilesReducer";

import * as css from "./Account.scss";

interface IProps {
  accountAddress: string;
  className?: string;
  editing: boolean;
  onSuccess?: (profileData: IProfileState) => any;
  profile: IProfileState;
  provider: "github" | "facebook" | "twitter";
  socket?: any;
}

interface IState {
  disabled: boolean;
}

export default class OAuthLogin extends React.Component<IProps, IState> {
  public popup: Window;

  constructor(props: IProps) {
    super(props);

    this.state = {
      disabled: false,
    };
  }

  public componentDidMount() {
    const { onSuccess, provider, socket } = this.props;

    if (socket) {
      socket.on(provider, (account: any) => {
        this.popup.close();
        onSuccess(account);
      });
    }
  }

  // Routinely checks the popup to re-enable the login button
  // if the user closes the popup without authenticating.
  // Also checks if somehow the socket failed to close the popup and closes it if done
  public checkPopup() {
    const check = setInterval(() => {
      const { popup } = this;
      if (!popup || popup.closed || popup.closed === undefined) {
        clearInterval(check);
        this.setState({ disabled: false});
      }
    }, 1000);
  }

  // Launches the popup by making a request to the server and then
  // passes along the socket id so it can be used to send back user
  // data to the appropriate socket on the connected client.
  public openPopup() {
    const { accountAddress, provider, socket } = this.props;
    const width = 600; const height = 600;
    const left = (window.innerWidth / 2) - (width / 2);
    const top = (window.innerHeight / 2) - (height / 2);
    const url = `${process.env.API_URL}/auth/${provider}?ethereumAccountAddress=${accountAddress}&socketId=${socket.id}`;

    return window.open(url, "",
      `toolbar=no, location=no, directories=no, status=no, menubar=no,
      scrollbars=no, resizable=no, copyhistory=no, width=${width},
      height=${height}, top=${top}, left=${left}`
    );
  }

  // Kicks off the processes of opening the popup on the server and listening
  // to the popup. It also disables the login button so the user can not
  // attempt to login to the provider twice.
  public startAuth = (e: any) => {
    if (!this.state.disabled) {
      e.preventDefault();
      this.popup = this.openPopup();
      this.checkPopup();
      this.setState({disabled: true});
    }
  }

  public render(): RenderOutput {
    const { className, editing, profile, provider } = this.props;
    const { disabled } = this.state;

    const buttonClass = classNames({
      [css.socialButton]: true,
      [className]: !!className,
    });

    return (
      <div className={buttonClass}>
        {profile && profile.socialURLs[provider]
          ? <a href={profile.socialURLs[provider]} className={css.socialButtonAuthenticated} target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={["fab", provider]} className={css.icon} />
          </a>
          : (editing
            ? <div>
              <button
                onClick={this.startAuth}
                disabled={disabled}
              >
                <FontAwesomeIcon icon={["fab", provider]} className={css.icon}/>
              </button>
            </div>
            : ""
          )
        }
      </div>
    );
  }

}
