import * as Arc from "@daostack/arc.js";
import promisify = require("es6-promisify");
import * as sigUtil from 'eth-sig-util';
import * as ethUtil from 'ethereumjs-util';
import { Field, Formik, FormikBag, FormikProps } from 'formik';
import * as queryString from 'query-string';
import * as React from "react";
import { BreadcrumbsItem } from 'react-breadcrumbs-dynamic';
import { connect, Dispatch } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";
import * as io from 'socket.io-client';

import * as profileActions from "actions/profilesActions";
import Util from "lib/util";
import { IRootState } from "reducers";
import { IAccountState } from "reducers/arcReducer";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";

import AccountImage from "components/Account/AccountImage";
import OAuthLogin from 'components/Account/OAuthLogin';
import ReputationView from "components/Account/ReputationView";
import DaoSidebar from "components/ViewDao/DaoSidebar";

import * as css from "./Account.scss";

import { IDAOState } from '@daostack/client'
import { arc } from 'arc'
import Subscribe, { IObservableState } from "components/Shared/Subscribe"
const socket = io(process.env.API_URL);

interface IStateProps extends RouteComponentProps<any> {
  accountAddress: string;
  accountInfo?: IAccountState;
  accountProfile?: IProfileState;
  currentAccountAddress: string;
  dao: IDAOState;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  const queryValues = queryString.parse(ownProps.location.search);

  return {
    accountAddress: ownProps.match.params.accountAddress,
    accountInfo: state.arc.accounts[ownProps.match.params.accountAddress + "-" + queryValues.daoAvatarAddress],
    accountProfile: state.profiles[ownProps.match.params.accountAddress],
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
    const { accountAddress, dao, getProfile } = this.props;

    getProfile(accountAddress);

    const ethBalance = await Util.getBalance(accountAddress);

    let votingMachineInstance: Arc.GenesisProtocolWrapper;
    if (dao) {
      const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
      const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(dao.address)).votingMachineAddress;
      votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);
    } else {
      votingMachineInstance = await Arc.GenesisProtocolFactory.deployed();
    }
    const stakingTokenAddress = await votingMachineInstance.contract.stakingToken();
    const stakingToken = await (await Arc.Utils.requireContract("StandardToken")).at(stakingTokenAddress) as any;
    const genBalance = await stakingToken.balanceOf(accountAddress);

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

    const web3 = await Arc.Utils.getWeb3();
    const timestamp = new Date().getTime().toString();
    const text = "Please sign this message to confirm your request to update your profile to name '" + values.name + "' and description '" + values.description + "'. There's no gas cost to you. Timestamp:" + timestamp;
    const msg = ethUtil.bufferToHex(Buffer.from(text, 'utf8'));
    const fromAddress = this.props.accountAddress;

    const method = 'personal_sign';
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

    const hasProfile = accountProfile && accountProfile.name;
    const editing = accountAddress == currentAccountAddress;

    return (
      <div className={css.profileWrapper}>
        <BreadcrumbsItem to={null}>{ editing ? (accountProfile && accountProfile.name ? "Edit Profile" : "Set Profile") : "View Profile"}</BreadcrumbsItem>

        { dao ? <DaoSidebar address={dao.address} /> : ""}

        <div className={css.profileContainer} data-test-id="profile-container">
          { editing && (!accountProfile || !accountProfile.name) ? <div>In order to evoke a sense of trust and reduce risk of scams, we invite you to create a user profile which will be associated with your current Ethereum address.<br/><br/></div> : ""}
          { typeof(accountProfile) === 'undefined' ? "Loading..." :
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
                    errors[name] = 'Required';
                  }
                };

                require('name');

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
                    <div className={css.userAvatarContainer}>
                      <AccountImage accountAddress={accountAddress} />
                    </div>
                    <div className={css.profileDataContainer}>
                      <label htmlFor="nameInput">
                        Real Name:&nbsp;
                      </label>
                      { editing ?
                        <div>
                          <Field
                            autoFocus
                            id="nameInput"
                            placeholder="e.g. John Doe"
                            name='name'
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
                        Personal Description:&nbsp;
                      </label>
                      { editing ?
                        <div>
                          <Field
                            id="descriptionInput"
                            placeholder="Tell the DAO a bit about yourself"
                            name='description'
                            component="textarea"
                            maxLength="150"
                            rows="7"
                            className={touched.description && errors.description ? css.error : null}
                          />
                          <div className={css.charLimit}>Limit 150 characters</div>
                        </div>
                        : <div>{accountProfile.description}</div>
                      }
                    </div>
                    <div className={css.otherInfoContainer}>
                      <div className={css.tokens}>
                        {accountInfo
                           ? <div><strong>Rep. Score</strong><br/><ReputationView reputation={accountInfo.reputation} totalReputation={dao.reputationTotalSupply} daoName={dao.name}/> </div>
                           : ""}
                        <div><strong>GEN:</strong><br/><span>{genCount ? genCount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "-"}</span></div>
                        <div><strong>ETH:</strong><br/><span>{ethCount ? ethCount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "-"}</span></div>
                      </div>
                      <div>
                        <strong>ETH Address:</strong><br/>
                        <span>{accountAddress.substr(0, 20)}...</span>
                        <button className={css.copyButton} onClick={this.copyAddress}><img src="/assets/images/Icon/Copy-black.svg"/></button>
                      </div>
                      {editing
                        ? <div>
                            <strong>Prove it's you by linking your social accounts:</strong>
                            <p>Authenticate your identity by linking your social accounts. Once linked, your social accounts will display in your profile page, and server as proof that you are who you say you are.</p>
                          </div>
                        : <div><strong>Social accounts:</strong></div>
                      }
                      {!editing && Object.keys(accountProfile.socialURLs).length == 0 ? "None connected" :
                        <div>
                          <OAuthLogin editing={editing} provider='facebook' accountAddress={accountAddress} onSuccess={this.onOAuthSuccess.bind(this)} profile={accountProfile} socket={socket} />
                          <OAuthLogin editing={editing} provider='twitter' accountAddress={accountAddress} onSuccess={this.onOAuthSuccess.bind(this)} profile={accountProfile} socket={socket} />
                          <OAuthLogin editing={editing} provider='github' accountAddress={accountAddress} onSuccess={this.onOAuthSuccess.bind(this)} profile={accountProfile} socket={socket} />
                        </div>
                      }
                    </div>
                  </div>
                  { editing ?
                    <div className={css.alignCenter}>
                      <button className={css.submitButton} type="submit" disabled={isSubmitting}>
                        <img className={css.loading} src="/assets/images/Icon/Loading-black.svg"/>
                        SUBMIT
                      </button>
                    </div>
                    : ""
                  }
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
  const queryValues = queryString.parse(props.location.search)
  const address = queryValues.daoAvatarAddress as string
  if (address) {

    return <Subscribe observable={arc.dao(address).state}>{
      (state: IObservableState<IDAOState>) => {
        const dao = state.data
        if (state.error) {
          return <div>{state.error.message}</div>
        } else if (dao) {
          return <ConnectedAccountProfileContainer dao={dao} {...props} />
        } else {
          return <div>Loading... xx</div>
        }
      }
    }</Subscribe>
  } else {
    return <ConnectedAccountProfileContainer {...props} />
  }
}
