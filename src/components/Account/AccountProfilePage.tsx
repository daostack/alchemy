import { promisify } from "util";
import { IDAOState, IMemberState } from "@daostack/client";
import * as profileActions from "actions/profilesActions";
import { enableWeb3ProviderAndWarn, getArc, getWeb3Provider } from "arc";

import BN = require("bn.js");
import AccountImage from "components/Account/AccountImage";
import OAuthLogin from "components/Account/OAuthLogin";
import Reputation from "components/Account/Reputation";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import DaoSidebar from "components/Dao/DaoSidebar";
import * as sigUtil from "eth-sig-util";
import * as ethUtil from "ethereumjs-util";
import { Field, Formik, FormikProps } from "formik";
import { copyToClipboard, formatTokens } from "lib/util";
import * as queryString from "query-string";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { IRootState } from "reducers";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import { combineLatest, of } from "rxjs";
import * as io from "socket.io-client";
import * as css from "./Account.scss";

const socket = io(process.env.API_URL);

interface IStateProps extends RouteComponentProps<any> {
  detailView?: boolean;
  accountAddress: string;
  accountInfo?: IMemberState;
  accountProfile?: IProfileState;
  currentAccountAddress: string;
  dao: IDAOState;
  ethBalance: BN;
  genBalance: BN;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  const accountAddress = ownProps.accountAddress ? ownProps.accountAddress.toLowerCase() : null;

  return {
    accountAddress,
    accountInfo: ownProps.accountInfo,
    accountProfile: state.profiles[accountAddress],
    currentAccountAddress: state.web3.currentAccountAddress,
    dao: ownProps.dao,
    ethBalance: ownProps.ethBalance,
    genBalance: ownProps.genBalance,
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
  verifySocialAccount: profileActions.verifySocialAccount,
};

type IProps = IStateProps & IDispatchProps;

interface IFormValues {
  description: string;
  name: string;
}

class AccountProfilePage extends React.Component<IProps, null> {

  constructor(props: IProps) {
    super(props);
  }

  public async componentWillMount(): Promise<void> {
    const { accountAddress, getProfile } = this.props;

    getProfile(accountAddress);
  }

  public copyAddress = (e: any): void => {
    const { showNotification, accountAddress } = this.props;
    copyToClipboard(accountAddress);
    showNotification(NotificationStatus.Success, "Copied to clipboard!");
    e.preventDefault();
  }

  public async handleSubmit(values: IFormValues, { _props, setSubmitting, _setErrors }: any): Promise<void> {
    const { accountAddress, currentAccountAddress, showNotification, updateProfile } = this.props;

    if (!(await enableWeb3ProviderAndWarn(this.props.showNotification.bind(this)))) { return; }

    const web3Provider = await getWeb3Provider();
    try {

      const timestamp = new Date().getTime().toString();
      const text = ("Please sign this message to confirm your request to update your profile to name '" +
        values.name + "' and description '" + values.description +
        "'. There's no gas cost to you. Timestamp:" + timestamp);
      const msg = ethUtil.bufferToHex(Buffer.from(text, "utf8"));

      const method = "personal_sign";

      // Create promise-based version of send
      const send = promisify(web3Provider.sendAsync);
      const params = [msg, currentAccountAddress];
      const result = await send({ method, params, from: currentAccountAddress });
      if (result.error) {
        console.error("Signing canceled, data was not saved");
        showNotification(NotificationStatus.Failure, "Saving profile was canceled");
        setSubmitting(false);
        return;
      }
      const signature = result.result;

      const recoveredAddress: string = sigUtil.recoverPersonalSignature({ data: msg, sig: signature });
      if (recoveredAddress.toLowerCase() === accountAddress) {
        await updateProfile(accountAddress, values.name, values.description, timestamp, signature);
      } else {
        showNotification(NotificationStatus.Failure, "Saving profile failed, please try again");
      }
    } catch (error) {
      if (web3Provider.isSafe) {
        console.log(error.message);
        showNotification(NotificationStatus.Failure, "We're very sorry, but Gnosis Safe does not support message signing :-(");
      } else {
        showNotification(NotificationStatus.Failure, error.message);
      }
    }
    setSubmitting(false);
  }

  public onOAuthSuccess(account: IProfileState) {
    this.props.verifySocialAccount(this.props.accountAddress, account);
  }

  public render(): any {
    const { accountAddress, accountInfo, accountProfile,
      currentAccountAddress, dao, ethBalance, genBalance } = this.props;

    const editing = currentAccountAddress && accountAddress === currentAccountAddress;

    return (
      <div className={css.profileWrapper}>
        <BreadcrumbsItem to={`/profile/${accountAddress}`}>
          {editing ? (accountProfile && accountProfile.name ? "Edit Profile" : "Set Profile") : "View Profile"}
        </BreadcrumbsItem>

        {dao ? <DaoSidebar {...this.props} dao={dao} /> : ""}

        <div className={css.profileContainer} data-test-id="profile-container">
          { editing && (!accountProfile || !accountProfile.name) ? <div className={css.setupProfile}>In order to evoke a sense of trust and reduce risk of scams, we invite you to create a user profile which will be associated with your current Ethereum address.<br/><br/></div> : ""}
          { typeof(accountProfile) === "undefined" ? "Loading..." :
            <Formik
              enableReinitialize
              // eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
              initialValues={{
                description: accountProfile ? accountProfile.description || "" : "",
                name: accountProfile ? accountProfile.name || "" : "",
              } as IFormValues}
              validate={(values: IFormValues): void => {
                // const { name } = values;
                const errors: any = {};

                const require = (name: string): any => {
                  if (!(values as any)[name]) {
                    errors[name] = "Required";
                  }
                };

                require("name");

                return errors;
              }}
              onSubmit={this.handleSubmit.bind(this)}
              render={({
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                values,
                errors,
                touched,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                handleChange,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                handleBlur,
                handleSubmit,
                isSubmitting,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                isValid,
              }: FormikProps<IFormValues>) =>
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
                        {editing ?
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
                        {editing ?
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
                                <img className={css.loading} src="/assets/images/Icon/Loading-black.svg" />
                                SUBMIT
                              </button>
                            </div>
                          </div>

                          : <div>{accountProfile.description}</div>
                        }
                      </div>
                    </div>
                    {!editing && Object.keys(accountProfile.socialURLs).length === 0 ? " " :
                      <div className={css.socialLogins}>
                        {editing
                          ? <div className={css.socialProof}>
                            <strong><img src="/assets/images/Icon/Alert-yellow.svg" /> Prove it&apos;s you by linking your social accounts</strong>
                            <p>Authenticate your identity by linking your social accounts. Once linked, your social accounts will display in your profile page, and server as proof that you are who you say you are.</p>
                          </div>
                          : " "
                        }

                        <h3>Social Verification</h3>
                        <OAuthLogin editing={editing} provider="twitter" accountAddress={accountAddress} onSuccess={this.onOAuthSuccess.bind(this)} profile={accountProfile} socket={socket} />
                        <OAuthLogin editing={editing} provider="github" accountAddress={accountAddress} onSuccess={this.onOAuthSuccess.bind(this)} profile={accountProfile} socket={socket} />
                      </div>
                    }
                    <div className={css.otherInfoContainer}>
                      <div className={css.tokens}>
                        {accountInfo
                          ? <div><strong>Rep. Score</strong><br /><Reputation reputation={accountInfo.reputation} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /> </div>
                          : ""}
                        <div><strong>GEN:</strong><br /><span>{formatTokens(genBalance)}</span></div>
                        -                        <div><strong>ETH:</strong><br /><span>{formatTokens(ethBalance)}</span></div>
                      </div>
                      <div>
                        <strong>ETH Address:</strong><br />
                        <span>{accountAddress.substr(0, 20)}...</span>
                        <button className={css.copyButton} onClick={this.copyAddress}><img src="/assets/images/Icon/Copy-black.svg" /></button>
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

const ConnectedAccountProfilePage = connect(mapStateToProps, mapDispatchToProps)(AccountProfilePage);

export default (props: RouteComponentProps<any>) => {
  const arc = getArc();
  const queryValues = queryString.parse(props.location.search);
  const daoAvatarAddress = queryValues.daoAvatarAddress as string;
  const accountAddress = props.match.params.accountAddress;

  const observable = combineLatest(
    daoAvatarAddress ? arc.dao(daoAvatarAddress).state() : of(null),
    daoAvatarAddress ? arc.dao(daoAvatarAddress).member(accountAddress).state() : of(null),
    arc.ethBalance(accountAddress),
    arc.GENToken().balanceOf(accountAddress)
  );

  return <Subscribe observable={observable}>{
    (state: IObservableState<[IDAOState, IMemberState, BN, BN]>) => {
      if (state.error) {
        return <div>{state.error.message}</div>;
      } else if (state.data) {
        const dao = state.data[0];
        return <ConnectedAccountProfilePage dao={dao} accountAddress={accountAddress} accountInfo={state.data[1]} {...props} ethBalance={state.data[2]} genBalance={state.data[3]} />;
      } else {
        return <div>Loading...</div>;
      }
    }
  }</Subscribe>;

};
