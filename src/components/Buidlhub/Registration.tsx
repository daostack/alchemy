import * as css from "./Registration.scss";
import * as React from "react";
import {connect} from "react-redux";
import { IRootState } from "@store";
import cn from "classnames";
import BuidlhubClient, {IBuidlhubClient} from "./BuidlhubClient";

type IExternalProps = {
  wallet: string;
};

type IProps = IExternalProps;

interface IStateProps {
  wallet: string;
}

interface IState {
  sending: boolean;
  error: string;
  email: string;
  dirty: boolean;
  registered: boolean;
}

class Registration extends React.Component<IProps, IState> {
  state = {
    sending: false,
    error: "",
    email: "",
    dirty: false,
    registered: false,
  }

  private sendToBHub = async (email: string) => {

    this.setState({
      sending: true,
    }, async () => {
      try {
        if (this.props.wallet && email) {
          const client: IBuidlhubClient = new BuidlhubClient();
          const r = await client.register({
            email,
            walletAddress: this.props.wallet,
          });

          if (r.data.error) {
            this.setState({
              sending: false,
              error: r.data.error,
            });
          } else {
            this.setState({
              sending: false,
              registered: true,
            });
          }
        } else {
          this.setState({
            error: "Missing required parameters",
            sending: false,
          });
        }
      } catch (e) {
        this.setState({
          sending: false,
          error: e.message,
        });
      }
    });
  }

  private emailChanged = (val: string) => {
    this.setState({
      dirty: true,
      email: val,
    });
  }

  private keyUp = (e: any) => {
    if (e.keyCode === 13 && this.state.email.length > 0) {
      this.sendToBHub(this.state.email);
    }
  }


  render() {



    const disabled = this.state.email.length === 0;
    return (
      <div className={css.bhubRegContainer}>
        <div className={css.bhubIcon}>
          <img src="/assets/images/daostack-bhub-logo.png" width="200"/>
        </div>
        <div className={css.description}>
                    BUIDLHub will send a daily summary of proposals made in DAOs you
                    follow or those where you have reputation. Provide your email below
                    to start the process.
        </div>

        {
          !this.state.sending && !this.state.registered &&
                    <EmailInput sendToBHub={this.sendToBHub}
                      onChange={this.emailChanged}
                      onKeyUp={this.keyUp}
                      email={this.state.email}
                      disabled={disabled} />
        }
        {
          this.state.sending &&
                    <div style={{width: "100%"}}>
                      <i className={cn("fa fa-spinner fa-spin")} />
                      <span style={{paddingLeft: "10px"}}>loading...</span>
                    </div>
        }
        {
          this.state.registered &&
                    <div className={css.success}>
                      <i className={cn("fa fa-check")} />
                      <span className={css.message}>
                            Thank you! Check your inbox for a message from BUIDLHub.
                            You must complete the process described in the email to receive
                            proposal notifications.
                      </span>
                    </div>
        }
        {
          this.state.error.length > 0 &&
                    <div className={css.error}>
                      {this.state.error}
                    </div>
        }


      </div>
    );
  }
}

const EmailInput = (props: any) => {
  const bClass = props.disabled?css.sendButtonDisabled : css.sendButton;
  return (

    <div className={css.inputWrapper}>
      <input className={css.emailInput}
        type="text"
        placeholder="email"
        onChange={e => props.onChange(e.target.value)}
        value={props.email}
        onKeyUp={props.onKeyUp} />

      <div className={css.sendButtonWrapper}>

        <button className={bClass}
          disabled={props.disabled}
          onClick={() => props.sendToBHub(props.email)}>Send</button>

      </div>
    </div>
  );
};

const s2p = (state: IRootState): IStateProps => {

  return {
    wallet: state.web3.currentAccountAddress,
  };
};

export default connect(s2p)(Registration);

