import * as Arc from "@daostack/arc.js";
import promisify = require("es6-promisify");
import * as ethUtil from 'ethereumjs-util';
import * as sigUtil from 'eth-sig-util';
import { Formik, Field, FormikBag } from 'formik';
import * as React from "react";
import { connect, Dispatch } from "react-redux";

import * as profileActions from "actions/profilesActions";
import { IRootState } from "reducers";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import Util from "lib/util";

import * as css from "./Account.scss";

interface IStateProps {
  accountAddress: string;
  currentAccountProfile?: IProfileState;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    accountAddress: state.web3.ethAccountAddress,
    currentAccountProfile: state.profiles[state.web3.ethAccountAddress]
  };
};

interface IDispatchProps {
  showNotification: typeof showNotification;
  updateProfile: typeof profileActions.updateProfile;
}

const mapDispatchToProps = {
  showNotification,
  updateProfile: profileActions.updateProfile
};

type IProps = IStateProps & IDispatchProps;

interface FormValues {
  description: string;
  githubURL: string;
  name: string;
}

class AccountProfileContainer extends React.Component<IProps, null> {

  public copyAddress = () => {
    const { showNotification, accountAddress } = this.props;
    Util.copyToClipboard(accountAddress);
    showNotification(NotificationStatus.Success, `Copied to clipboard!`);
  }

  public async handleSubmit(values: FormValues, { props, setSubmitting, setErrors }: any ) {
    const { accountAddress, updateProfile } = this.props;

    const web3 = await Arc.Utils.getWeb3();
    const text = "Please sign in to Alchemy";
    const msg = ethUtil.bufferToHex(Buffer.from(text, 'utf8'));
    const fromAddress = this.props.accountAddress;

    let signature = localStorage.getItem("signature");
    if (!signature) {
      const method = 'personal_sign';
      const sendAsync = promisify(web3.currentProvider.sendAsync);
      const params = [msg, fromAddress];
      const result = await sendAsync({ method, params, fromAddress });
      signature = result.result;
      localStorage.setItem("signature", signature);
    }

    const recoveredAddress = sigUtil.recoverPersonalSignature({ data: msg, sig: signature });

    if (recoveredAddress == this.props.accountAddress) {
      await updateProfile(accountAddress, values.name, values.description, signature);
    } else {
      console.error("Signing in failed, please ensure you are logged in to MetaMask with an address that you own");
    }
    setSubmitting(false);
  }

  public render() {
    const { accountAddress, currentAccountProfile } = this.props;

    return (
      typeof(currentAccountProfile) === 'undefined' ? "Loading..." :
      <Formik
        initialValues={{
          description: currentAccountProfile ? currentAccountProfile.description || "" : "",
          githubURL: currentAccountProfile ? currentAccountProfile.githubURL || "" : "",
          name: currentAccountProfile ? currentAccountProfile.name || "" : ""
        } as FormValues}
        validate={(values: FormValues) => {
          const { name } = values;
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
        }) =>
          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="nameInput">
              Real Name:&nbsp;
              {touched.name && errors.name && <span className={css.errorMessage}>{errors.name}</span>}
            </label>
            <Field
              autoFocus
              id="nameInput"
              placeholder="e.g. John Doe"
              name='name'
              type="text"
              className={touched.name && errors.name ? css.error : null}
            />

            <label htmlFor="descriptionInput">
              Personal Description:&nbsp;
              {touched.description && errors.description && <span className={css.errorMessage}>{errors.description}</span>}
            </label>
            <Field
              autoFocus
              id="descriptionInput"
              placeholder="e.g. I love cheese"
              name='description'
              type="text"
              className={touched.description && errors.description ? css.error : null}
            />

            <div className={css.alignCenter}>
              <button className={css.submitButton} type="submit" disabled={isSubmitting}>
                <img className={css.sendIcon} src="/assets/images/Icon/Send.svg"/>
                <img className={css.loading} src="/assets/images/Icon/Loading-black.svg"/>
                Save Profile
              </button>
            </div>
          </form>
        }
      />
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountProfileContainer);
