import { Address, ISchemeState, Scheme, Token } from "@daostack/client";
import * as queryString from "query-string";
import { RouteComponentProps } from "react-router-dom";
import { NotificationStatus } from "reducers/notifications";
import { redeemReputationFromToken } from "actions/arcActions";
import { enableWeb3ProviderAndWarn, getArc } from "arc";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import { schemeName, fromWei } from "lib/util";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as Sticky from "react-stickynode";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import * as schemeCss from "./Scheme.scss";
import * as css from "./ReputationFromToken.scss";

import BN = require("bn.js");

interface IExternalProps extends RouteComponentProps<any> {
  daoAvatarAddress: Address;
  scheme: Scheme;
  schemeState: ISchemeState;
}

interface IStateProps {
  currentAccountAddress: Address;
}

interface IDispatchProps {
  redeemReputationFromToken: typeof redeemReputationFromToken;
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  redeemReputationFromToken,
  showNotification,
};

type IProps = IExternalProps & IStateProps & IDispatchProps;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {...ownProps,
    currentAccountAddress: state.web3.currentAccountAddress,
  };
};

interface IState {
  redemptionAmount: BN;
  alreadyRedeemed: boolean;
  privateKey: string;
  redeemerAddress: Address;
}

interface IFormValues {
  accountAddress: string;
}

class ReputationFromToken extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    let redeemerAddress: Address;
    const queryValues = queryString.parse(this.props.location.search);
    let pk = queryValues["pk"] as string;
    if (pk) {
      const arc = getArc();
      if (!pk.startsWith("0x")) {
        pk = `0x${pk}`;
      }
      try {
        redeemerAddress = arc.web3.eth.accounts.privateKeyToAccount(pk).address;
      } catch(err) {
        throw Error(`Invalide private key: ${pk}`);
      }
    } else {
      redeemerAddress = this.props.currentAccountAddress;
    }


    this.state = {
      redemptionAmount: null,
      alreadyRedeemed: false,
      privateKey: pk,
      redeemerAddress,
    };
  }

  private async _loadReputationBalance() {
    const redeemerAddress = this.state.redeemerAddress;
    if (redeemerAddress) {
      const state = await this.props.scheme.fetchStaticState();
      const schemeAddress = state.address;
      const schemeContract = await this.props.scheme.context.getContract(schemeAddress);
      const tokenContractAddress = await schemeContract.methods.tokenContract().call();
      const arc = getArc();
      const tokenContract = new Token(tokenContractAddress, arc);
      const balance = new BN(await tokenContract.contract().methods.balanceOf(redeemerAddress).call());
      // const redemptionAmount = (await this.props.scheme.ReputationFromToken.redemptionAmount(this.props.currentAccountAddress)) });
      const alreadyRedeemed = await schemeContract.methods.redeems(redeemerAddress).call();
      let redemptionAmount;
      if (alreadyRedeemed) {
        redemptionAmount = new BN(0);
      } else {
        redemptionAmount = balance;
      }
      this.setState({
        redemptionAmount,
        alreadyRedeemed,
      });
    } else {
      this.setState({
        redemptionAmount: new BN(0),
        alreadyRedeemed: false,
      });
    }
  }

  public async componentDidMount() {
    await this._loadReputationBalance();
  }

  public async componentDidUpdate(prevProps: IProps) {
    if (!this.state.privateKey && this.props.currentAccountAddress !== prevProps.currentAccountAddress) {
      this.setState({
        redeemerAddress: this.props.currentAccountAddress,
      });
      await this._loadReputationBalance();
    }
  }

  public async handleSubmit(values: IFormValues, { _props, setSubmitting, _setErrors }: any): Promise<void> {
    // only connect to wallet if we do not have a private key to sign with
    if (!this.state.privateKey && !(await enableWeb3ProviderAndWarn(this.props.showNotification.bind(this)))) {
      setSubmitting(false);
      return;
    }

    const state = await this.props.scheme.fetchStaticState();
    const schemeAddress = state.address;
    const schemeContract = await this.props.scheme.context.getContract(schemeAddress);
    const alreadyRedeemed = await schemeContract.methods.redeems(this.state.redeemerAddress).call();
    if (alreadyRedeemed) {
      this.props.showNotification.bind(this)(NotificationStatus.Failure, `Reputation for the account ${values.accountAddress} was already redeemed`);
    } else {
      this.props.redeemReputationFromToken(this.props.scheme, values.accountAddress, this.state.privateKey);
    }
    setSubmitting(false);
  }

  public render() {
    const { daoAvatarAddress, schemeState } = this.props;
    const redeemerAddress = this.state.redeemerAddress;

    const arc = getArc();

    return (
      <div className={schemeCss.schemeContainer}>
        <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/scheme/${schemeState.id}`}>{schemeName(schemeState, schemeState.address)}</BreadcrumbsItem>

        <Sticky enabled top={50} innerZ={10000}>
          <h2 className={schemeCss.schemeName}>
            {schemeName(schemeState, schemeState.address)}
          </h2>
        </Sticky>
        { this.state.alreadyRedeemed ? <div>Reputation for account {redeemerAddress} has already been redeemed</div> : <div />  }
        <div className={schemeCss.schemeRedemptionContainer}>
          <Formik
            // eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
            initialValues={{
              accountAddress: "",
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
            }: FormikProps<IFormValues>) => {
              return <Form noValidate>
                <div className={schemeCss.fields}>
                  <h3>{ this.state.redemptionAmount ? fromWei(this.state.redemptionAmount) : "..." } Rep to redeem </h3>
                  <b>Redeem reputation to which account?</b>
                  <div className={schemeCss.redemptionAddress}>
                    <label htmlFor="accountAddressInput">
                      <ErrorMessage name="accountAddress">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                    </label>
                    <Field
                      id="accountAddressInput"
                      maxLength={120}
                      placeholder="Account address"
                      name="accountAddress"
                      className={touched.accountAddress && errors.accountAddress ? css.error : null}
                    />
                  </div>
                  <b>⚠️ After redemption, reputation is not transferable</b>
                </div>
                <div className={schemeCss.redemptionButton}>
                  <button type="submit"
                    disabled={false}
                  >
                    <img src="/assets/images/Icon/redeem.svg"/> Redeem
                  </button>
                </div>
              </Form>;
            }}
          />
        </div>
      </div>
    );
  }
}

const ConnectedReputationFromToken = connect(mapStateToProps, mapDispatchToProps)(ReputationFromToken);

export default ConnectedReputationFromToken;
