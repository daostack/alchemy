import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link, RouteComponentProps } from "react-router-dom";

import * as profileActions from "actions/profilesActions";
import { IProfileState } from "reducers/profilesReducer";

import * as css from "./Account.scss";

interface IProps {
  accountAddress: string;
  editing: boolean;
  onSuccess: (profileData: IProfileState) => any,
  profile: IProfileState;
  provider: 'github' | 'facebook' | 'twitter';
  socket: any;
}

interface IState {
  disabled: boolean;
}

export default class OAuthLogin extends React.Component<IProps, IState> {
  popup: Window;

  constructor(props: IProps) {
    super(props);

    this.state = {
      disabled: false
    };
  }

  componentDidMount() {
    const { onSuccess, provider, socket } = this.props

    socket.on(provider, (account: any) => {
      //this.popup.close();
      onSuccess(account);
    })
  }

  // Routinely checks the popup to re-enable the login button
  // if the user closes the popup without authenticating.
  // Also checks if somehow the socket failed to close the popup and closes it if done
  checkPopup() {
    const check = setInterval(() => {
      const { popup } = this;
      if (!popup || popup.closed || popup.closed === undefined) {
        clearInterval(check);
        this.setState({ disabled: false});
      }
    }, 1000)
  }

  // Launches the popup by making a request to the server and then
  // passes along the socket id so it can be used to send back user
  // data to the appropriate socket on the connected client.
  openPopup() {
    const { accountAddress, provider, socket } = this.props;
    const width = 600, height = 600;
    const left = (window.innerWidth / 2) - (width / 2);
    const top = (window.innerHeight / 2) - (height / 2);
    const url = `${process.env.API_URL}/auth/${provider}?ethereumAccountAddress=${accountAddress}&socketId=${socket.id}`;

    return window.open(url, '',
      `toolbar=no, location=no, directories=no, status=no, menubar=no,
      scrollbars=no, resizable=no, copyhistory=no, width=${width},
      height=${height}, top=${top}, left=${left}`
    );
  }

  // Kicks off the processes of opening the popup on the server and listening
  // to the popup. It also disables the login button so the user can not
  // attempt to login to the provider twice.
  startAuth(e: any) {
    if (!this.state.disabled) {
      e.preventDefault();
      this.popup = this.openPopup();
      this.checkPopup();
      this.setState({disabled: true});
    }
  }

  render() {
    const { editing, profile, provider } = this.props;
    const { disabled } = this.state;

    return (
      <div className={css.socialButton}>
        {profile && profile.socialURLs[provider]
          ? <a href={profile.socialURLs[provider]} className={css.socialButtonAuthenticated} target='_blank'>
              <FontAwesomeIcon icon={['fab', provider]} className={css.icon} />
            </a>
          : (editing
              ? <div>
                  <button
                    onClick={this.startAuth.bind(this)}
                    disabled={disabled}
                  >
                    <FontAwesomeIcon icon={['fab', provider]} className={css.icon}/>
                  </button>
                </div>
              : ""
            )
        }
      </div>
    )
  }

}