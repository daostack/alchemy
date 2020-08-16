
import * as React from "react";
import { connect } from "react-redux";
import { IPluginState, IProposalCreateOptionsTokenTrade } from "@daostack/arc.js";
import { enableWalletProvider } from "arc";

import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";

import { NotificationStatus, showNotification } from "reducers/notifications";
import * as arcActions from "actions/arcActions";

import Analytics from "lib/analytics";
import { isValidUrl, supportedTokens } from "lib/util";
import { exportUrl } from "lib/proposalUtils";

import TagsSelector from "components/Proposal/Create/PluginForms/TagsSelector";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import * as css from "../CreateProposal.scss";
import MarkdownField from "./MarkdownField";
import HelpButton from "components/Shared/HelpButton";
import { SelectField } from "./CreateContributionRewardProposal";
import i18next from "i18next";
import { IFormModalService, CreateFormModalService } from "components/Shared/FormModalService";
import { IRootState } from "reducers";

interface IExternalProps {
  daoAvatarAddress: string;
  handleClose: () => any;
  pluginState: IPluginState;
}

interface IDispatchProps {
  createProposal: typeof arcActions.createProposal;
  showNotification: typeof showNotification;
}

const mapStateToProps = (state: IRootState, ownProps: IExternalProps) => {
  return ownProps;
};

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
  tokens: {
    value: string;
    label: string;
  }[]
}

const setInitialFormValues = (): IFormValues => {
  return Object.freeze({
    description: "",
    title: "",
    url: "",
    tags: [],
    sendTokenAddress: "",
    sendTokenAmount: 0,
    receiveTokenAddress: "",
    receiveTokenAmount: 0,
  });
};

class CreateTokenTradeProposal extends React.Component<IProps, IState> {

  formModalService: IFormModalService<IFormValues>;
  currentFormValues: IFormValues;

  constructor(props: IProps) {
    super(props);

    const tokens = Object.keys(supportedTokens()).map((tokenAddress) => {
      const token = supportedTokens()[tokenAddress];
      return { value: tokenAddress, label: token["symbol"] };
    });

    this.state = { tags: [], tokens: [] };

    this.formModalService = CreateFormModalService(
      "CreateTokenTradeProposal",
      setInitialFormValues(),
      () => Object.assign(this.currentFormValues, this.state),
      (formValues: IFormValues, firstTime: boolean) => {
        this.currentFormValues = formValues;
        if (firstTime) { this.state = { tags: formValues.tags, tokens }; }
        else { this.setState({ tags: formValues.tags, tokens }); }
      },
      this.props.showNotification);
  }

  componentWillUnmount() {
    this.formModalService.saveCurrentValues();
  }

  private handleSubmit = async (values: IFormValues, { setSubmitting }: any ): Promise<void> => {
    console.log(values)
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

    return (
      <div className={css.containerNoSidebar}>

        <Formik
          initialValues={this.currentFormValues}
          // eslint-disable-next-line react/jsx-no-bind
          validate={(values: IFormValues) => {

            this.currentFormValues = values;

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
                <TrainingTooltip overlay={i18next.t("Title Tooltip")} placement="right">
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
                  placeholder={i18next.t("Title Placeholder")}
                  name="title"
                  type="text"
                  className={touched.title && errors.title ? css.error : null}
                />

                <TrainingTooltip overlay={i18next.t("Description Tooltip")} placement="right">
                  <label htmlFor="descriptionInput">
                    <div className={css.proposalDescriptionLabelText}>
                      <div className={css.requiredMarker}>*</div>
                      <div className={css.body}>Description</div><HelpButton text={i18next.t("Help Button Tooltip")} />
                    </div>
                    <ErrorMessage name="description">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                </TrainingTooltip>
                <Field
                  component={MarkdownField}
                  onChange={(value: any) => { setFieldValue("description", value); }}
                  id="descriptionInput"
                  placeholder={i18next.t("Description Placeholder")}
                  name="description"
                  className={touched.description && errors.description ? css.error : null}
                />

                <TrainingTooltip overlay={i18next.t("Tags Tooltip")} placement="right">
                  <label className={css.tagSelectorLabel}>
                    Tags
                  </label>
                </TrainingTooltip>

                <div className={css.tagSelectorContainer}>
                  <TagsSelector onChange={this.onTagsChange} tags={this.state.tags}></TagsSelector>
                </div>

                <TrainingTooltip overlay={i18next.t("URL Tooltip")} placement="right">
                  <label htmlFor="urlInput">
                    URL
                    <ErrorMessage name="url">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                </TrainingTooltip>
                <Field
                  id="urlInput"
                  maxLength={120}
                  placeholder={i18next.t("URL Placeholder")}
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
                        placeholder={i18next.t("Send tokens amount placeholder")}
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
                        placeholder={i18next.t("Receive tokens amount placeholder")}
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
                        options={this.state.tokens}
                      />
                    </div>
                  </div>
                </div>

                <div className={css.createProposalActions}>
                  <TrainingTooltip overlay={i18next.t("Export Proposal Tooltip")} placement="top">
                    <button id="export-proposal" className={css.exportProposal} type="button" onClick={() => this.exportFormValues(values)}>
                      <img src="/assets/images/Icon/share-blue.svg" />
                    </button>
                  </TrainingTooltip>
                  <button className={css.exitProposalCreation} type="button" onClick={handleClose}>
                      Cancel
                  </button>
                  <TrainingTooltip overlay={i18next.t("Submit Proposal Tooltip")} placement="top">
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

export default connect(mapStateToProps, mapDispatchToProps)(CreateTokenTradeProposal);
