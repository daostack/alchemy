import { Address, ISchemeState, } from "@daostack/client";
import { checkWeb3ProviderAndWarn, getArc } from "arc";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import { schemeName} from "lib/util";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as Sticky from "react-stickynode";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import * as schemeCss from "./Scheme.scss";
import * as css from "./FixedReputationAllocationScheme.scss";

interface IStateProps {
  currentAccountAddress: Address;
  daoAvatarAddress: Address;
  scheme: ISchemeState;
}

interface IDispatchProps {
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  showNotification,
};

type IProps = IStateProps & IDispatchProps;

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {...ownProps,
    currentAccountAddress: state.web3.currentAccountAddress
  };
};

interface IFormValues {
  thisAccount: boolean;
  accountAddress: string;
}

class FixedReputationAllocationScheme extends React.Component<IProps, null> {

  public async handleSubmit(values: IFormValues, { _props, setSubmitting, _setErrors }: any): Promise<void> {
    if (!(await checkWeb3ProviderAndWarn(this.props.showNotification.bind(this)))) { return; }

    // TODO: some call in the subgraph?
  }

  public render() {
    const { currentAccountAddress, daoAvatarAddress, scheme } = this.props;
    const arc = getArc();

    return (
      <div className={schemeCss.schemeContainer}>
        <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/scheme/${scheme.id}`}>{schemeName(scheme, scheme.address)}</BreadcrumbsItem>

        <Sticky enabled top={50} innerZ={10000}>
          <h2 className={schemeCss.schemeName}>
            {schemeName(scheme, scheme.address)}
          </h2>
        </Sticky>

        <div>
          <h3>100 Rep to redeem </h3>
          <b>Which account would you like to receive the reputation?</b>
          <Formik
            // eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
            initialValues={{
              thisAccount : true,
              accountAddress: currentAccountAddress,
            } as IFormValues}

            validate={(values: IFormValues): void => {
              const errors: any = {};

              const require = (name: string) => {
                if (!(values as any)[name]) {
                  errors[name] = "Required";
                }
              };

              require("accountAddress");

              if (!arc.web3.utils.isAddress(values.accountAddress)) {
                errors.otherScheme = "Invalid address";
              }

              return errors;
            }}

            onSubmit={this.handleSubmit}

            render={({
              errors,
              touched,
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              handleSubmit,
              isSubmitting,
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              setFieldTouched,
              setFieldValue,
              values
            }: FormikProps<IFormValues>) =>
              <Form noValidate>
                <Field
                  id="thisAccountTrue"
                  name="thisAcount"
                  checked={values.thisAccount}
                  onChange={(ev: any) => { setFieldValue('accountAddress', currentAccountAddress, false)}}
                  type="radio"
                  value={true}
                />
                <label htmlFor="thisAccountTrue">
                  This Account
                </label>

                <Field
                  id="thisAccountFalse"
                  name="thisAccount"
                  checked={!values.thisAccount}
                  onChange={(ev: any) => { setFieldValue('accountAddress', "", false)}}
                  type="radio"
                  value={false}
                />
                <label htmlFor="thisAccountFalse">
                  Other Account
                </label>

                <label htmlFor="accountAddressInput">
                  Address
                  <ErrorMessage name="accountAddress">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                </label>
                <Field
                  id="accountAddressInput"
                  maxLength={120}
                  disabled={values.thisAccount}
                  placeholder=""
                  name="accountAddress"
                  className={touched.accountAddress && errors.accountAddress ? css.error : null}
                />

                <div>
                  <button type="submit" disabled={isSubmitting}>
                    Redeem
                  </button>
                </div>
              </Form>
            }
          />
        </div>
      </div>
    );
  }
}

const ConnectedFixedReputationAllocationScheme = connect(mapStateToProps, mapDispatchToProps)(FixedReputationAllocationScheme);
export default ConnectedFixedReputationAllocationScheme;


