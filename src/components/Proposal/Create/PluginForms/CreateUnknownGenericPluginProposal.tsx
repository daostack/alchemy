import { IPluginState } from "@daostack/arc.js";
import { createProposal } from "actions/arcActions";
import { enableWalletProvider } from "arc";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import Analytics from "lib/analytics";
import * as React from "react";
import { connect } from "react-redux";
import { showNotification, NotificationStatus } from "reducers/notifications";
import { baseTokenName, isValidUrl } from "lib/util";
import { exportUrl, importUrlValues } from "lib/proposalUtils";
import TagsSelector from "components/Proposal/Create/PluginForms/TagsSelector";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import * as css from "../CreateProposal.scss";
import MarkdownField from "./MarkdownField";
import HelpButton from "components/Shared/HelpButton";
import i18next from "i18next";

interface IExternalProps {
  daoAvatarAddress: string;
  handleClose: () => any;
  pluginState: IPluginState;
}

interface IDispatchProps {
  createProposal: typeof createProposal;
  showNotification: typeof showNotification;
}

interface IStateProps {
  tags: Array<string>;
}

type IProps = IExternalProps & IDispatchProps;

const mapDispatchToProps = {
  createProposal,
  showNotification,
};

interface IFormValues {
  description: string;
  callData: string;
  title: string;
  url: string;
  value: number;
  [key: string]: any;
}

class CreateGenericPlugin extends React.Component<IProps, IStateProps> {

  initialFormValues: IFormValues;

  constructor(props: IProps) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.initialFormValues = importUrlValues<IFormValues>({
      description: "",
      callData: "",
      title: "",
      url: "",
      value: 0,
      tags: [],
    });
    this.state = {
      tags: this.initialFormValues.tags,
    };
  }

  public async handleSubmit(values: IFormValues, { setSubmitting }: any ): Promise<void> {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    const proposalValues = {...values,
      dao: this.props.daoAvatarAddress,
      plugin: this.props.pluginState.address,
      tags: this.state.tags,
    };

    setSubmitting(false);
    await this.props.createProposal(proposalValues);

    Analytics.track("Submit Proposal", {
      "DAO Address": this.props.daoAvatarAddress,
      "Proposal Title": values.title,
      "Plugin Address": this.props.pluginState.address,
      "Plugin Name": this.props.pluginState.name,
    });

    this.props.handleClose();
  }

  // Exports data from form to a shareable url.
  public exportFormValues(values: IFormValues) {
    exportUrl({ ...values, ...this.state });
    this.props.showNotification(NotificationStatus.Success, i18next.t("In Clipboard"));
  }

  private onTagsChange = (tags: any[]): void => {
    this.setState({tags});
  }

  public render(): RenderOutput {
    const { handleClose } = this.props;

    return (
      <div className={css.containerNoSidebar}>
        <Formik
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          initialValues={this.initialFormValues}
          // eslint-disable-next-line react/jsx-no-bind
          validate={(values: IFormValues): void => {
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

            if (!isValidUrl(values.url)) {
              errors.url = "Invalid URL";
            }

            const bytesPattern = new RegExp("0x[0-9a-f]+", "i");
            if (values.callData && !bytesPattern.test(values.callData)) {
              errors.callData = "Invalid encoded function call data";
            }

            require("callData");
            require("title");
            require("description");
            require("value");
            nonEmpty("value");
            nonNegative("value");

            return errors;
          }}
          onSubmit={this.handleSubmit}
          // eslint-disable-next-line react/jsx-no-bind
          render={({
            errors,
            touched,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            handleSubmit,
            isSubmitting,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            setFieldTouched,
            setFieldValue,
            values,
          }: FormikProps<IFormValues>) =>
            <Form noValidate>
              <TrainingTooltip overlay={i18next.t("Title Tooltip")} placement="right">
                <label htmlFor="titleInput">
                  <div className={css.requiredMarker}>*</div>
                Title
                  <ErrorMessage name="title">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
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
                  <ErrorMessage name="description">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                </label>
              </TrainingTooltip>
              <Field
                component={MarkdownField}
                // eslint-disable-next-line react/jsx-no-bind
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
                <TagsSelector onChange={this.onTagsChange}></TagsSelector>
              </div>

              <TrainingTooltip overlay={i18next.t("URL Tooltip")} placement="right">
                <label htmlFor="urlInput">
                URL
                  <ErrorMessage name="url">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
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

              <div className={css.encodedData}>
                <div>
                  <label htmlFor="callData">
                    <div className={css.requiredMarker}>*</div>
                    Encoded function call data
                    <ErrorMessage name="callData">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
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
                    <div className={css.requiredMarker}>*</div>
                    {baseTokenName()} Value
                    <ErrorMessage name="value">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    id="valueInput"
                    placeholder={`How much ${baseTokenName()} to transfer with the call`}
                    name="value"
                    type="number"
                    className={touched.value && errors.value ? css.error : null}
                    min={0}
                    step={0.1}
                  />
                </div>
              </div>

              <div className={css.createProposalActions}>
                <TrainingTooltip overlay={i18next.t("Export Proposal Tooltip")} placement="top">
                  {/* eslint-disable-next-line react/jsx-no-bind */}
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
          }
        />
      </div>
    );
  }
}

export default connect(null, mapDispatchToProps)(CreateGenericPlugin);
