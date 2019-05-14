import { IDAOState, IProposalType } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import { checkMetaMaskAndWarn, getArc } from "arc";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import UserSearchField from "components/Shared/UserSearchField";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import { default as Util } from "lib/util";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import * as css from "../CreateProposal.scss";

interface IStateProps {
  daoAvatarAddress: string;
  handleClose: () => any;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    daoAvatarAddress: ownProps.daoAvatarAddress,
    handleClose: ownProps.handleClose
  };
};

interface IDispatchProps {
  createProposal: typeof arcActions.createProposal;
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  createProposal: arcActions.createProposal,
  showNotification
};

type IProps = IStateProps & IDispatchProps;

interface FormValues {
  beneficiary: string;
  description: string;
  ethReward: number;
  externalToken: string;
  externalTokenReward: number;
  nativeTokenReward: number;
  reputationReward: number;
  title: string;
  url: string;

  [key: string]: any;
}

class CreateContributionReward extends React.Component<IProps, null> {

  constructor(props: IProps) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  public async handleSubmit(values: FormValues, { setSubmitting }: any ) {
    if (!(await checkMetaMaskAndWarn(this.props.showNotification))) { return; }

    if (!values.beneficiary.startsWith("0x")) { values.beneficiary = "0x" + values.beneficiary; }

    const proposalValues = {...values,
      type: IProposalType.ContributionReward,
      ethReward: Util.toWei(Number(values.ethReward)),
      externalTokenReward: Util.toWei(Number(values.externalTokenReward)),
      nativeTokenReward: Util.toWei(Number(values.nativeTokenReward)),
      reputationReward: Util.toWei(Number(values.reputationReward))
    };

    setSubmitting(false);
    await this.props.createProposal(this.props.daoAvatarAddress, proposalValues);
  }

  public render() {
    const {  daoAvatarAddress, handleClose } = this.props;
    const arc = getArc();

    return <Subscribe observable={arc.dao(daoAvatarAddress).state()}>{
      (state: IObservableState<IDAOState>) => {
        if ( state.data !== null ) {
          const dao: IDAOState = state.data;

          // TODO: this is used to check uniqueness of proposalDescriptions,
          // it is disabled at this moment, but should be restored
          // const proposalDescriptions = (dao.proposals as IProposalState[])
          //   .filter((proposal) => !proposalEnded(proposal))
          //   .map((proposal) => proposal.description);
          const proposalDescriptions: string[] = [];

          return (
            <div className={css.contributionReward}>
              <Formik
                initialValues={{
                  beneficiary: "",
                  description: "",
                  ethReward: 0,
                  externalToken: TOKENS["GEN"],
                  externalTokenReward: 0,
                  nativeTokenReward: 0,
                  reputationReward: 0,
                  title: "",
                  url: ""
                } as FormValues}
                validate={(values: FormValues) => {
                  const errors: any = {};

                  const require = (name: string) => {
                    if (!(values as any)[name]) {
                      errors[name] = "Required";
                    }
                  };

                  const nonNegative = (name: string) => {
                    if ((values as any)[name] < 0) {
                      errors[name] = "Please enter a non-negative reward";
                    }
                  };

                  if (values.title.length > 120) {
                    errors.title = "Title is too long (max 120 characters)";
                  }

                  // TODO: do we want this uniqueness check still?
                  if (proposalDescriptions.indexOf(values.description) !== -1) {
                    errors.description = "Must be unique";
                  }

                  if (!arc.web3.utils.isAddress(values.beneficiary)) {
                    errors.beneficiary = "Invalid address";
                  }

                  const pattern = new RegExp("(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})");
                  if (values.url && !pattern.test(values.url)) {
                    errors.url = "Invalid URL";
                  }

                  nonNegative("ethReward");
                  nonNegative("externalTokenReward");
                  nonNegative("nativeTokenReward");

                  require("description");
                  require("title");
                  require("beneficiary");

                  if (!values.ethReward && !values.reputationReward && !values.externalTokenReward && !values.nativeTokenReward) {
                    errors.rewards = "Please select at least some reward";
                  }

                  return errors;
                }}
                onSubmit={this.handleSubmit}
                render={({
                  errors,
                  touched,
                  handleSubmit,
                  isSubmitting,
                  setFieldTouched,
                  setFieldValue
                }: FormikProps<FormValues>) =>
                  <Form noValidate>

                    <label htmlFor="titleInput">
                      Title
                      <ErrorMessage name="title">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      <div className={css.requiredMarker}>*</div>
                    </label>
                    <Field
                      autoFocus
                      id="titleInput"
                      maxLength={120}
                      placeholder="Summarize your proposal"
                      name="title"
                      type="text"
                      className={touched.title && errors.title ? css.error : null}
                    />

                    <label htmlFor="descriptionInput">
                      Description
                      <div className={css.requiredMarker}>*</div>
                      <img className={css.infoTooltip} src="/assets/images/Icon/Info.svg"/>
                      <ErrorMessage name="description">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                    </label>
                    <Field
                      component="textarea"
                      id="descriptionInput"
                      placeholder="Describe your proposal in greater detail"
                      name="description"
                      className={touched.description && errors.description ? css.error : null}
                    />

                    <label htmlFor="urlInput">
                      URL
                      <ErrorMessage name="url">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                    </label>
                    <Field
                      id="urlInput"
                      maxLength={120}
                      placeholder="Description URL"
                      name="url"
                      type="text"
                      className={touched.url && errors.url ? css.error : null}
                    />

                    <div>
                      <div>
                        <label htmlFor="beneficiary">
                          Recipient
                          <ErrorMessage name="beneficiary">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                          <div className={css.requiredMarker}>*</div>
                        </label>
                        <UserSearchField
                          daoAvatarAddress={daoAvatarAddress}
                          name="beneficiary"
                          onBlur={(touched) => { setFieldTouched("beneficiary", touched); }}
                          onChange={(newValue) => { setFieldValue("beneficiary", newValue); }}
                        />
                      </div>

                      <div className={css.reward}>
                        <label htmlFor="ethRewardInput">
                          ETH Reward
                          <ErrorMessage name="ethReward">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                        </label>
                        <Field
                          id="ethRewardInput"
                          placeholder="How much ETH to reward"
                          name="ethReward"
                          type="number"
                          className={touched.ethReward && errors.ethReward ? css.error : null}
                          min={0}
                          step={0.1}
                        />
                      </div>

                      <div className={css.reward}>
                        <label htmlFor="reputationRewardInput">
                          Reputation Reward
                          <ErrorMessage name="reputationReward">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                        </label>
                        <Field
                          id="reputationRewardInput"
                          placeholder="How much reputation to reward"
                          name="reputationReward"
                          type="number"
                          className={touched.reputationReward && errors.reputationReward ? css.error : null}
                          step={0.1}
                        />
                      </div>

                      <div className={css.reward}>
                        <img src="/assets/images/Icon/down.svg" className={css.downV}/>
                        <label htmlFor="externalRewardInput">
                          External Token Reward
                          <ErrorMessage name="externalTokenReward">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                        </label>
                        <Field
                          id="externalTokenRewardInput"
                          placeholder={`How many tokens to reward`}
                          name="externalTokenReward"
                          type="number"
                          className={touched.externalTokenReward && errors.externalTokenReward ? css.error : null}
                          min={0}
                          step={0.1}
                        />
                        <Field
                          id="externalTokenInput"
                          name="externalToken"
                          component="select"
                          className={css.externalTokenSelect}
                        >
                          { Object.keys(TOKENS).map((token) => <option key={token} value={TOKENS[token]}>{token}</option>) }
                        </Field>
                      </div>

                      <div className={css.reward}>
                        <label htmlFor="nativeTokenRewardInput">
                          DAO token ({dao.tokenSymbol}) Reward
                          <ErrorMessage name="nativeTokenReward">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                        </label>
                        <Field
                          id="nativeTokenRewardInput"
                          maxLength={10}
                          placeholder="How many tokens to reward"
                          name="nativeTokenReward"
                          type="number"
                          className={touched.nativeTokenReward && errors.nativeTokenReward ? css.error : null}
                        />
                      </div>

                      {(touched.ethReward || touched.externalTokenReward || touched.reputationReward || touched.nativeTokenReward)
                          && touched.reputationReward && errors.rewards &&
                        <span className={css.errorMessage + " " + css.someReward}><br/> {errors.rewards}</span>
                      }
                    </div>
                    <div className={css.createProposalActions}>
                      <button className={css.exitProposalCreation} type="button" onClick={handleClose}>
                        Cancel
                      </button>
                      <button className={css.submitProposal} type="submit" disabled={isSubmitting}>
                        Submit proposal
                      </button>
                    </div>
                  </Form>
                }
              />
            </div>
          );
        } else {
          return null;
       }
     }
    }</Subscribe>;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateContributionReward);
