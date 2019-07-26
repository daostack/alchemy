import { Address, ISchemeState, ReputationFromTokenScheme, Scheme } from "@daostack/client";
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
  scheme: Scheme;
  schemeState: ISchemeState;
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

  constructor(props: IProps) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  public async handleSubmit(values: IFormValues, { _props, setSubmitting, _setErrors }: any): Promise<void> {
    if (!(await checkWeb3ProviderAndWarn(this.props.showNotification.bind(this)))) { return; }

    const reputationFromTokenScheme = this.props.scheme.ReputationFromToken as ReputationFromTokenScheme;
    // TODO: get the address from the form
    const addressToRedeem = values.accountAddress;
    // send the transaction and get notifications
    reputationFromTokenScheme.redeem(addressToRedeem).subscribe((next) => console.log(next));
  }

  public render() {
    const { currentAccountAddress, daoAvatarAddress, schemeState } = this.props;
    const arc = getArc();

    return (
      <div className={schemeCss.schemeContainer}>
        <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/scheme/${schemeState.id}`}>{schemeName(schemeState, schemeState.address)}</BreadcrumbsItem>

        <Sticky enabled top={50} innerZ={10000}>
          <h2 className={schemeCss.schemeName}>
            {schemeName(schemeState, schemeState.address)}
          </h2>
        </Sticky>

        <div className={schemeCss.schemeRedemptionContainer}>
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
                <div className={schemeCss.fields}>
                  <h3>100 Rep to redeem </h3>
                  <b>Which account would you like to receive the reputation?</b>
                  <div>
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
                  </div>
                  <div>
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
                  </div>
                  <div className={schemeCss.redemptionAddress}>
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
                  </div>
                </div>
                <div className={schemeCss.redemptionButton}>
                  <button type="submit" disabled={isSubmitting}>
                    <img src="/assets/images/Icon/Execute.svg"/> Redeem
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
