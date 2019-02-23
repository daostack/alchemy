import promisify = require("es6-promisify");
import * as sigUtil from "eth-sig-util";
import * as ethUtil from "ethereumjs-util";
import { Field, Formik, FormikProps } from "formik";
import * as queryString from "query-string";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { combineLatest } from "rxjs";
import { first } from "rxjs/operators";
import * as io from "socket.io-client";

import * as classNames from "classnames";

import * as profileActions from "actions/profilesActions";
import Util from "lib/util";
import { IRootState } from "reducers";
import { IAccountState } from "reducers/arcReducer";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";

import AccountImage from "components/Account/AccountImage";
import OAuthLogin from "components/Account/OAuthLogin";
import ReputationView from "components/Account/ReputationView";
import DaoSidebar from "components/ViewDao/DaoSidebar";

import * as css from "./Account.scss";

import { IDAOState, IMemberState } from "@daostack/client";
import { getArc } from "arc";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";

const socket = io(process.env.API_URL);

interface IStateProps extends RouteComponentProps<any> {
  detailView?: boolean;
  accountAddress: string;
  accountInfo?: IMemberState;
  accountProfile?: IProfileState;
  currentAccountAddress: string;
  dao: IDAOState;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  const queryValues = queryString.parse(ownProps.location.search);

  return {
    accountAddress: ownProps.accountAddress,
    accountInfo: ownProps.accountInfo,
    accountProfile: state.profiles[ownProps.accountAddress],
    currentAccountAddress: state.web3.ethAccountAddress,
    dao: ownProps.dao
  };
};

interface IDispatchProps {
  showNotification: typeof showNotification;
  getProfile: typeof profileActions.getProfile;
  updateProfile: typeof profileActions.updateProfile;
  verifySocialAccount: typeof profileActions.verifySocialAccount;
}

const mapDispatchToProps = {
  showNotification,
  getProfile: profileActions.getProfile,
  updateProfile: profileActions.updateProfile,
  verifySocialAccount: profileActions.verifySocialAccount
};

type IProps = IStateProps & IDispatchProps;

interface IState {
  genCount: number;
  ethCount: number;
}

interface FormValues {
  description: string;
  name: string;
}

class AccountProfileContainer extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      ethCount: null,
      genCount: null
    };
  }

  public async componentWillMount() {
    const { accountAddress, getProfile } = this.props;

    getProfile(accountAddress);

    // TODO: refactor the below: we should subscribe to the Member object and get a updates of token balances as well
    const ethBalance = await Util.getBalance(accountAddress);
    const arc = getArc();
    const stakingToken = arc.GENToken();
    const genBalance = await stakingToken.balanceOf(accountAddress).pipe(first()).toPromise();

    this.setState({ ethCount: Util.fromWei(ethBalance), genCount: Util.fromWei(genBalance)});
  }

  public copyAddress = (e: any) => {
    const { showNotification, accountAddress } = this.props;
    Util.copyToClipboard(accountAddress);
    showNotification(NotificationStatus.Success, `Copied to clipboard!`);
    e.preventDefault();
  }

  public async handleSubmit(values: FormValues, { props, setSubmitting, setErrors }: any ) {
    const { accountAddress, showNotification, updateProfile } = this.props;

    const web3 = await Util.getWeb3();
    const timestamp = new Date().getTime().toString();
    const text = "Please sign this message to confirm your request to update your profile to name '" + values.name + "' and description '" + values.description + "'. There's no gas cost to you. Timestamp:" + timestamp;
    const msg = ethUtil.bufferToHex(Buffer.from(text, "utf8"));
    const fromAddress = this.props.accountAddress;

    const method = "personal_sign";
    // TODO: do we need promisify here? web3 1.0 supports promises natively
    // and if we can do without, we can drop the dependency on es6-promises
    const sendAsync = promisify(web3.currentProvider.sendAsync);
    const params = [msg, fromAddress];
    const result = await sendAsync({ method, params, fromAddress });
    if (result.error) {
      console.error("Signing canceled, data was not saved");
      showNotification(NotificationStatus.Failure, `Saving profile was canceled`);
      setSubmitting(false);
      return;
    }
    const signature = result.result;

    const recoveredAddress = sigUtil.recoverPersonalSignature({ data: msg, sig: signature });

    if (recoveredAddress == this.props.accountAddress) {
      await updateProfile(accountAddress, values.name, values.description, timestamp, signature);
    } else {
      console.error("Signing failed");
      showNotification(NotificationStatus.Failure, `Saving profile failed, please try again`);
    }
    setSubmitting(false);
  }

  public onOAuthSuccess(account: IProfileState) {
    this.props.verifySocialAccount(this.props.accountAddress, account);
  }

  public render() {
    const { accountAddress, accountInfo, accountProfile, currentAccountAddress, dao } = this.props;
    const { ethCount, genCount } = this.state;

    const editing = currentAccountAddress && accountAddress.toLowerCase() === currentAccountAddress.toLowerCase();

    return (
      <div className={css.profileWrapper}>
        <BreadcrumbsItem to={null}>{ editing ? (accountProfile && accountProfile.name ? "Edit Profile" : "Set Profile") : "View Profile"}</BreadcrumbsItem>

        { dao ? <DaoSidebar address={dao.address} /> : ""}

        <div className={css.profileContainer} data-test-id="profile-container">
          { editing && (!accountProfile || !accountProfile.name) ? <div>In order to evoke a sense of trust and reduce risk of scams, we invite you to create a user profile which will be associated with your current Ethereum address.<br/><br/></div> : ""}
          { typeof(accountProfile) === "undefined" ? "Loading..." :
            <Formik
              enableReinitialize={true}
              initialValues={{
                description: accountProfile ? accountProfile.description || "" : "",
                name: accountProfile ? accountProfile.name || "" : ""
              } as FormValues}
              validate={(values: FormValues) => {
                // const { name } = values;
                const errors: any = {};

                const require = (name: string) => {
                  if (!(values as any)[name]) {
                    errors[name] = "Required";
                  }
                };

                require("name");

                return errors;
              }}
              onSubmit={this.handleSubmit.bind(this)}
              render={({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
                handleSubmit,
                isSubmitting,
                isValid,
              }: FormikProps<FormValues>) =>
                <form onSubmit={handleSubmit} noValidate>
                  <div className={css.profileContent}>
                    <div className={css.profileDataContainer}>
                      <div className={css.userAvatarContainer}>
                        <AccountImage accountAddress={accountAddress} />
                      </div>
                      <div className={css.profileData}>
                        <label htmlFor="nameInput">
                          Name:&nbsp;
                        </label>
                        { editing ?
                          <div>
                            <Field
                              autoFocus
                              id="nameInput"
                              placeholder="e.g. John Doe"
                              name="name"
                              type="text"
                              maxLength="35"
                              className={touched.name && errors.name ? css.error : null}
                            />
                            {touched.name && errors.name && <span className={css.errorMessage}>{errors.name}</span>}
                          </div>
                          : <div>{accountProfile.name}</div>
                        }
                        <br />
                        <label htmlFor="descriptionInput">
                          Description:&nbsp;
                        </label>
                        { editing ?
                          <div>
                            <div>
                              <Field
                                id="descriptionInput"
                                placeholder="Tell the DAO a bit about yourself"
                                name="description"
                                component="textarea"
                                maxLength="150"
                                rows="7"
                                className={touched.description && errors.description ? css.error : null}
                              />
                              <div className={css.charLimit}>Limit 150 characters</div>
                            </div>
                            <div className={css.saveProfile}>
                              <button className={css.submitButton} type="submit" disabled={isSubmitting}>
                                <img className={css.loading} src="/assets/images/Icon/Loading-black.svg"/>
                                SUBMIT
                              </button>
                            </div>
                          </div>

                          : <div>{accountProfile.description}</div>
                        }
                      </div>
                    </div>

                    {editing
                      ? <div className={css.socialProof}>
                          <strong>Prove it's you by linking your social accounts:</strong>
                          <p>Authenticate your identity by linking your social accounts. Once linked, your social accounts will display in your profile page, and server as proof that you are who you say you are.</p>
                        </div>
                      : <div><strong>Social accounts:</strong></div>
                    }
                    {!editing && Object.keys(accountProfile.socialURLs).length == 0 ? "None connected" :
                      <div className={css.socialProof}>
                        <OAuthLogin editing={editing} provider="facebook" accountAddress={accountAddress} onSuccess={this.onOAuthSuccess.bind(this)} profile={accountProfile} socket={socket} />
                        <OAuthLogin editing={editing} provider="twitter" accountAddress={accountAddress} onSuccess={this.onOAuthSuccess.bind(this)} profile={accountProfile} socket={socket} />
                        <OAuthLogin editing={editing} provider="github" accountAddress={accountAddress} onSuccess={this.onOAuthSuccess.bind(this)} profile={accountProfile} socket={socket} />
                      </div>
                    }
                    <div className={css.otherInfoContainer}>
                      <div className={css.tokens}>
                        {accountInfo
                           ? <div><strong>Rep. Score</strong><br/><ReputationView reputation={accountInfo.reputation} totalReputation={dao.reputationTotalSupply} daoName={dao.name}/> </div>
                           : ""}
                      </div>
                      <div>
                        <strong>ETH Address:</strong><br/>
                        <span>{accountAddress.substr(0, 20)}...</span>
                        <button className={css.copyButton} onClick={this.copyAddress}><img src="/assets/images/Icon/Copy-black.svg"/></button>
                      </div>
                    </div>
                  </div>
                </form>
              }
            />
          }
        </div>
      </div>
    );
  }
}

const ConnectedAccountProfileContainer = connect(mapStateToProps, mapDispatchToProps)(AccountProfileContainer);

export default (props: RouteComponentProps<any>) => {
  const arc = getArc();
  const queryValues = queryString.parse(props.location.search);
  const daoAvatarAddress = queryValues.daoAvatarAddress as string;

  if (daoAvatarAddress) {
    const observable = combineLatest(
      arc.dao(daoAvatarAddress).state,
      arc.dao(daoAvatarAddress).member(props.match.params.accountAddress).state
    );

    return <Subscribe observable={observable}>{
      (state: IObservableState<[IDAOState, IMemberState]>) => {
        if (state.error) {
          return <div>{state.error.message}</div>;
        } else if (state.data) {
          const dao = state.data[0];
          return <ConnectedAccountProfileContainer dao={dao} accountAddress={props.match.params.accountAddress} accountInfo={state.data[1]} {...props} />;
        } else {
          return <div>Loading... xx</div>;
        }
      }
    }</Subscribe>;
  } else {
    return <ConnectedAccountProfileContainer accountAddress={props.match.params.accountAddress} {...props} />;
  }
};
