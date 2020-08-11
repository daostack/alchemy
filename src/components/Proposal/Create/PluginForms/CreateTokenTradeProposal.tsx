
import * as React from "react";
import { connect } from "react-redux";
import { IPluginState, IProposalCreateOptionsTokenTrade } from "@daostack/arc.js";
import { enableWalletProvider } from "arc";

import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";

import { IRootState } from "reducers";
import { NotificationStatus, showNotification } from "reducers/notifications";
import * as arcActions from "actions/arcActions";

import Analytics from "lib/analytics";
import { isValidUrl, supportedTokens } from "lib/util";
import { exportUrl, importUrlValues } from "lib/proposalUtils";

import TagsSelector from "components/Proposal/Create/PluginForms/TagsSelector";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import * as css from "../CreateProposal.scss";
import MarkdownField from "./MarkdownField";
import HelpButton from "components/Shared/HelpButton";
import { SelectField } from "./CreateContributionRewardProposal";

interface IExternalProps {
  daoAvatarAddress: string;
  handleClose: () => any;
  pluginState: IPluginState;
}

const mapStateToProps = (state: IRootState, ownProps: IExternalProps) => {
  return ownProps;
};

interface IDispatchProps {
  createProposal: typeof arcActions.createProposal;
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  createProposal: arcActions.createProposal,
  showNotification,
};

type IProps = IExternalProps & IDispatchProps;

interface IFormValues {
  description: string;
  title: string;
  url: string;
  tags: Array<string>;
  sendTokenAddress: string,
  sendTokenAmount: number,
  receiveTokenAddress: string,
  receiveTokenAmount: number,
}

interface IState {
  tags: Array<string>;
}

class CreateKnownPluginProposal extends React.Component<IProps, IState> {

  initialFormValues: IFormValues;

  constructor(props: IProps) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);

    this.initialFormValues = importUrlValues<IFormValues>({
      description: "",
      title: "",
      url: "",
      tags: [],
      sendTokenAddress: "",
      sendTokenAmount: 0,
      receiveTokenAddress: "",
      receiveTokenAmount: 0,
    });

    this.state = {
      tags: this.initialFormValues.tags,
    };
  }

  public async handleSubmit(values: IFormValues, { setSubmitting }: any ): Promise<void> {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    const proposalOptions: IProposalCreateOptionsTokenTrade = {
      dao: this.props.daoAvatarAddress,
      descriptionHash: values.description,
      title: values.title,
      tags: this.state.tags,
      plugin: this.props.pluginState.address,
      url: values.url,
      sendTokenAddress: values.sendTokenAddress,
      sendTokenAmount: values.sendTokenAmount,
      receiveTokenAddress: values.receiveTokenAddress,
      receiveTokenAmount: values.receiveTokenAmount,
    };

    setSubmitting(false);

    await this.props.createProposal(proposalOptions);

    Analytics.track("Submit Proposal", {
      "DAO Address": this.props.daoAvatarAddress,
      "Proposal Title": values.title,
      "Plugin Address": this.props.pluginState.address,
      "Plugin Name": this.props.pluginState.name,
    });

    this.props.handleClose();
  }

  private onTagsChange = (tags: any[]): void => {
    this.setState({tags});
  }

  public exportFormValues(values: IFormValues) {
    values = {
      ...values,
      ...this.state,
    };
    exportUrl(values);
    this.props.showNotification(NotificationStatus.Success, "Exportable url is now in clipboard :)");
  }

  public render(): RenderOutput {
    const { handleClose } = this.props;

    const fnDescription = () => (<span>Short description of the proposal.<ul><li>What are you proposing to do?</li><li>Why is it important?</li><li>How much will it cost the DAO?</li></ul></span>);

    return (
      <div className={css.containerNoSidebar}>

        <Formik
          initialValues={this.initialFormValues}
          // eslint-disable-next-line react/jsx-no-bind
          validate={(values: IFormValues) => {
            const errors: any = {};

            const require = (name: string) => {
              if (!(values as any)[name]) {
                errors[name] = "Required";
              }
            };

            require("description");
            require("title");
            require("sendTokenAddress");
            require("sendTokenAmount");
            require("receiveTokenAddress");
            require("receiveTokenAmount");

            if (values.title.length > 120) {
              errors.title = "Title is too long (max 120 characters)";
            }

            if (!isValidUrl(values.url)) {
              errors.url = "Invalid URL";
            }

            return errors;
          }}
          onSubmit={this.handleSubmit}
          // eslint-disable-next-line react/jsx-no-bind
          render={({
            errors,
            touched,
            isSubmitting,
            setFieldValue,
            values,
          }: FormikProps<IFormValues>) => {
            return (
              <Form noValidate>
                <label className={css.description}>What to Expect</label>
                <div className={css.description}>Propose to trade tokens with the DAO.</div>
                <TrainingTooltip overlay="The title is the header of the proposal card and will be the first visible information about your proposal" placement="right">
                  <label htmlFor="titleInput">
                    <div className={css.requiredMarker}>*</div>
                    Title
                    <ErrorMessage name="title">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                </TrainingTooltip>
                <Field
                  autoFocus
                  id="titleInput"
                  maxLength={120}
                  placeholder="Summarize your proposal"
                  name="title"
                  type="text"
                  className={touched.title && errors.title ? css.error : null}
                />

                <TrainingTooltip overlay={fnDescription} placement="right">
                  <label htmlFor="descriptionInput">
                    <div className={css.proposalDescriptionLabelText}>
                      <div className={css.requiredMarker}>*</div>
                      <div className={css.body}>Description</div><HelpButton text={HelpButton.helpTextProposalDescription} />
                    </div>
                    <ErrorMessage name="description">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                </TrainingTooltip>
                <Field
                  component={MarkdownField}
                  onChange={(value: any) => { setFieldValue("description", value); }}
                  id="descriptionInput"
                  placeholder="Describe your proposal in greater detail"
                  name="description"
                  className={touched.description && errors.description ? css.error : null}
                />

                <TrainingTooltip overlay="Add some tags to give context about your proposal e.g. idea, signal, bounty, research, etc" placement="right">
                  <label className={css.tagSelectorLabel}>
                    Tags
                  </label>
                </TrainingTooltip>

                <div className={css.tagSelectorContainer}>
                  <TagsSelector onChange={this.onTagsChange} tags={this.state.tags}></TagsSelector>
                </div>

                <TrainingTooltip overlay="Link to the fully detailed description of your proposal" placement="right">
                  <label htmlFor="urlInput">
                    URL
                    <ErrorMessage name="url">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                </TrainingTooltip>
                <Field
                  id="urlInput"
                  maxLength={120}
                  placeholder="Description URL"
                  name="url"
                  type="text"
                  className={touched.url && errors.url ? css.error : null}
                />

                <div className={css.reward}>
                  <label htmlFor="sendTokenAmountInput">
                    Send token amount
                    <ErrorMessage name="sendTokenAmount">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <div className={css.externalTokenInput}>
                    <div className={css.amount}>
                      <Field
                        id="sendTokenAmountInput"
                        placeholder={"How many tokens to send"}
                        name="sendTokenAmount"
                        type="number"
                        className={touched.sendTokenAmount && errors.sendTokenAmount ? css.error : null}
                        min={0}
                        step={1}
                      />
                    </div>
                    <div className={css.select}>
                      <Field
                        id="sendTokenAddress"
                        name="sendTokenAddress"
                        component={SelectField}
                        options={Object.keys(supportedTokens()).map((tokenAddress) => {
                          const token = supportedTokens()[tokenAddress];
                          return { value: tokenAddress, label: token["symbol"] };
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className={css.reward}>
                  <label htmlFor="receiveTokenAmountInput">
                    Receive token amount
                    <ErrorMessage name="receiveTokenAmount">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <div className={css.externalTokenInput}>
                    <div className={css.amount}>
                      <Field
                        id="receiveTokenAmountInput"
                        placeholder={"How many tokens to receive"}
                        name="receiveTokenAmount"
                        type="number"
                        className={touched.receiveTokenAmount && errors.receiveTokenAmount ? css.error : null}
                        min={0}
                        step={1}
                      />
                    </div>
                    <div className={css.select}>
                      <Field
                        id="receiveTokenAddress"
                        name="receiveTokenAddress"
                        component={SelectField}
                        options={Object.keys(supportedTokens()).map((tokenAddress) => {
                          const token = supportedTokens()[tokenAddress];
                          return { value: tokenAddress, label: token["symbol"] };
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className={css.createProposalActions}>
                  <TrainingTooltip overlay="Export proposal" placement="top">
                    <button id="export-proposal" className={css.exportProposal} type="button" onClick={() => this.exportFormValues(values)}>
                      <img src="/assets/images/Icon/share-blue.svg" />
                    </button>
                  </TrainingTooltip>
                  <button className={css.exitProposalCreation} type="button" onClick={handleClose}>
                      Cancel
                  </button>
                  <TrainingTooltip overlay="Once the proposal is submitted it cannot be edited or deleted" placement="top">
                    <button className={css.submitProposal} type="submit" disabled={isSubmitting}>
                        Submit proposal
                    </button>
                  </TrainingTooltip>
                </div>
              </Form>
            );
          }}
        />
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateKnownPluginProposal);
