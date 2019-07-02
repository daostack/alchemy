import { IDAOState, Scheme } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import { checkMetaMaskAndWarn, getArc } from "arc";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import Analytics from "lib/analytics";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import * as css from "../CreateProposal.scss";
import MarkdownField from "./MarkdownField";

interface IContainerProps {
  scheme: Scheme;
}

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

type IProps = IContainerProps & IStateProps & IDispatchProps;

interface FormValues {
  description: string;
  callData: string;
  title: string;
  url: string;
  value: number;
}

class CreateGenericScheme extends React.Component<IProps, null> {

  constructor(props: IProps) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  public async handleSubmit(values: FormValues, { setSubmitting }: any ) {
    if (!(await checkMetaMaskAndWarn(this.props.showNotification))) { return; }
    const proposalValues = {...values,
      scheme: this.props.scheme.address,
      dao: this.props.daoAvatarAddress
    };

    setSubmitting(false);
    await this.props.createProposal(proposalValues);

    Analytics.track("Submit Proposal", {
      "DAO Address": this.props.daoAvatarAddress,
      "Proposal Title": values.title,
      "Scheme Address": this.props.scheme.address,
      "Scheme Name": this.props.scheme.name
    });

    this.props.handleClose();
  }

  public render() {
    const {  daoAvatarAddress, handleClose } = this.props;
    const arc = getArc();

    return <Subscribe observable={arc.dao(daoAvatarAddress).state()}>{
      (state: IObservableState<IDAOState>) => {
        if ( state.data !== null ) {
          return (
            <div className={css.contributionReward}>
              <Formik
                initialValues={{
                  callData: "",
                  title: "",
                  url: "",
                  value: 0
                } as FormValues}
                validate={(values: FormValues) => {
                  const errors: any = {};

                  const require = (name: string) => {
                    if (!(values as any)[name]) {
                      errors[name] = "Required";
                    }
                  };

                  const nonEmpty = (name: string) => {
                    if (!(values as any)[name].toString()) {
                      errors[name] = "Required";
                    }
                  };

                  const nonNegative = (name: string) => {
                    if ((values as any)[name] < 0) {
                      errors[name] = "Please enter a non-negative value";
                    }
                  };

                  if (values.title.length > 120) {
                    errors.title = "Title is too long (max 120 characters)";
                  }

                  const pattern = new RegExp("(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})");
                  if (values.url && !pattern.test(values.url)) {
                    errors.url = "Invalid URL";
                  }

                  const bytesPattern = new RegExp("0x[0-9a-e]+", "i");
                  if (values.callData && !bytesPattern.test(values.callData)) {
                    errors.callData = "Invalid encoded function call data";
                  }

                  require("callData");
                  nonEmpty("value");
                  nonNegative("value");

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
                      component={MarkdownField}
                      onChange={(value: any) => { setFieldValue("description", value); }}
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
                        <label htmlFor="callData">
                          Encoded function call data
                          <ErrorMessage name="callData">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                          <div className={css.requiredMarker}>*</div>
                        </label>
                         <Field
                          id="callDataInput"
                          component="textarea"
                          placeholder="The encoded function call data of the contract function call"
                          name="callData"
                          className={touched.callData && errors.callData ? css.error : null}
                        />
                      </div>

                      <div>
                        <label htmlFor="value">
                          ETH Value
                          <ErrorMessage name="value">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                          <div className={css.requiredMarker}>*</div>
                        </label>
                        <Field
                          id="valueInput"
                          placeholder="How much ETH to transfer with the call"
                          name="value"
                          type="number"
                          className={touched.value && errors.value ? css.error : null}
                          min={0}
                          step={0.1}
                        />
                      </div>
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

export default connect(mapStateToProps, mapDispatchToProps)(CreateGenericScheme);
