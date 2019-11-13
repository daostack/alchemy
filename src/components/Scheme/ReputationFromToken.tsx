import { promisify } from "util";
import { Address, ISchemeState, Token } from "@daostack/client";
import axios from "axios";
import { getWeb3Provider, getArcSettings } from "arc";
import * as ethABI from "ethereumjs-abi";
import * as queryString from "query-string";
import { RouteComponentProps } from "react-router-dom";
import { NotificationStatus } from "reducers/notifications";
import { redeemReputationFromToken } from "actions/arcActions";
import { enableWalletProvider, getArc } from "arc";
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
  useTxSenderService: boolean;
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
      const schemeState = this.props.schemeState;
      const schemeAddress = schemeState.address;
      const arc = getArc();
      const schemeContract = await arc.getContract(schemeAddress);
      const tokenContractAddress = await schemeContract.methods.tokenContract().call();
      const tokenContract = new Token(tokenContractAddress, arc);
      const balance = new BN(await tokenContract.contract().methods.balanceOf(redeemerAddress).call());
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
    if (!this.state.privateKey &&
      !await enableWalletProvider({ showNotification: this.props.showNotification })) {
      setSubmitting(false);
      return;
    }

    const schemeState = this.props.schemeState;
    const schemeAddress = schemeState.address;
    const arc = getArc();
    const schemeContract = await arc.getContract(schemeAddress);
    const alreadyRedeemed = await schemeContract.methods.redeems(this.state.redeemerAddress).call();
    if (alreadyRedeemed) {
      this.props.showNotification(NotificationStatus.Failure, `Reputation for the account ${this.state.redeemerAddress} was already redeemed`);
    } else if (values.useTxSenderService === true) {
      // construct the message to sign
      // const signatureType = 1
      const messageToSign = "0x"+ ethABI.soliditySHA3(
        ["address","address"],
        [schemeAddress, values.accountAddress]
      ).toString("hex");

      // console.log(`Sign this message of type ${signatureType}: ${messageToSign}`)
      // const text = `Please sign this message to confirm your request to redeem reputation.
      //     There's no gas cost to you.`
      const method = "personal_sign";

      // Create promise-based version of send
      const web3Provider = await getWeb3Provider();
      const send = promisify(web3Provider.sendAsync);
      const params = [messageToSign, this.props.currentAccountAddress];
      let result;

      try {
        result = await send({ method, params, from: this.props.currentAccountAddress });
      } catch(err) {
        this.props.showNotification(NotificationStatus.Failure, "The redemption was canceled");
        setSubmitting(false);
        return;
      }
      if (result.error) {
        this.props.showNotification(NotificationStatus.Failure, "The redemption was canceled");
        setSubmitting(false);
        return;
      }
      let signature = result.result;
      const signature1 =  signature.substring(0, signature.length-2);
      const v = signature.substring(signature.length-2, signature.length);
      if (v === "00") {
        signature = signature1+"1b";
      } else {
        signature = signature1+"1c";
      }
      const signatureType = 1;
      // const scheme = arc.scheme(schemeState.id);
      // const reputationFromTokenScheme = scheme.ReputationFromToken as ReputationFromTokenScheme;
      const contract =  arc.getContract(schemeState.address);

      // send the transaction and get notifications
      if (contract) {
        // more information on this service is here: https://github.com/dOrgTech/TxPayerService
        const txServiceUrl = getArcSettings().txSenderServiceUrl;
        const data = {
          to: schemeState.address,
          methodAbi: {
            "constant": false,
            "inputs": [
              {
                "internalType": "address",
                "name": "_beneficiary",
                "type": "address",
              },
              {
                "internalType": "uint256",
                "name": "_signatureType",
                "type": "uint256",
              },
              {
                "internalType": "bytes",
                "name": "_signature",
                "type": "bytes",
              },
            ],
            "name": "redeemWithSignature",
            "outputs": [
              {
                "internalType": "uint256",
                "name": "",
                "type": "uint256",
              },
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function",
          },
          parameters: [values.accountAddress.toLowerCase(), signatureType, signature],
        };
        try {
          this.props.showNotification(NotificationStatus.Success, "Sending the transaction to the payment service -- please be patient");
          const response = await axios(txServiceUrl, {
            method: "post",
            data,
          });
          console.log(response);
          if (response.data.status !== 200) {
            this.props.showNotification(NotificationStatus.Failure, `An error occurred on the transaction service: ${response.data.status}: ${response.data.message}`);
          } else {
            this.props.showNotification(NotificationStatus.Success, `You've successfully redeemed rep to ${values.accountAddress}`);
          }
        } catch(err) {
          console.log(err.message);
          this.props.showNotification(NotificationStatus.Failure, `${err.message}}`);
        }
        // const tx = await contract.methods.redeemWithSignature(values.accountAddress.toLowerCase(), signatureType, signature).send(
        //   {from: this.props.currentAccountAddress}
        // )
      } else {
        throw Error("Scheme not found!?!");
      }
      // return (await _testSetup.reputationFromToken.redeemWithSignature(_beneficiary,signatureType,signature
      // ,{from:_fromAccount}));
    } else {
      const scheme = arc.scheme(schemeState.id);
      this.props.redeemReputationFromToken(scheme, values.accountAddress, this.state.privateKey, this.state.redeemerAddress);
    }
    setSubmitting(false);
  }

  public render(): RenderOutput {
    const { daoAvatarAddress, schemeState, currentAccountAddress } = this.props;
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
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            initialValues={{
              accountAddress: currentAccountAddress,
              useTxSenderService: false,
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
              setFieldValue,
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
                    onClick={(_e)=>{
                      setFieldValue("useTxSenderService",false);
                    }}
                  >
                    <img src="/assets/images/Icon/redeem.svg"/> Redeem
                  </button>
                </div>
                {  getArcSettings().txSenderServiceUrl ?
                  <div className={schemeCss.redemptionButton}>
                    <div>Or try our new experimental feature:</div>
                    <button type="submit"
                      disabled={false}
                      onClick={(_e)=>{
                        setFieldValue("useTxSenderService",true);
                      }}
                    >
                      <img src="/assets/images/Icon/redeem.svg"/> Redeem w/o paying gas
                    </button>
                  </div>
                  : null }
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
