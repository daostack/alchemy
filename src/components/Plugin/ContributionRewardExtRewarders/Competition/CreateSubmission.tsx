import { IDAOState, ICompetitionProposalState, Address } from "@daostack/arc.js";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import { isValidUrl, isAddress } from "lib/util";
import * as React from "react";
import TagsSelector from "components/Proposal/Create/PluginForms/TagsSelector";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import MarkdownField from "components/Proposal/Create/PluginForms/MarkdownField";
import UserSearchField from "components/Shared/UserSearchField";
import { ICreateSubmissionOptions } from "./utils";
import * as css from "./Competitions.scss";
import { showNotification } from "reducers/notifications";
import { connect } from "react-redux";
import i18next from "i18next";

interface IDispatchProps {
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  showNotification,
};
import HelpButton from "components/Shared/HelpButton";
import { IFormModalService, CreateFormModalService } from "components/Shared/FormModalService";
import ResetFormButton from "components/Proposal/Create/PluginForms/ResetFormButton";

interface IExternalProps {
  currentAccountAddress: Address;
  daoState: IDAOState;
  proposalState: ICompetitionProposalState;
  handleCancel: () => any;
  handleSubmit: (values: ICreateSubmissionOptions) => any;
}

interface IStateProps {
  tags: Array<string>;
}

type IProps = IExternalProps & IDispatchProps;

interface IFormValues extends ICreateSubmissionOptions {
  [key: string]: any;
}

const defaultValues: IFormValues = Object.freeze({
  beneficiary: "",
  description: "",
  title: "",
  url: "",
  tags: [],
});

class CreateSubmission extends React.Component<IProps, IStateProps> {

  formModalService: IFormModalService<IFormValues>;
  currentFormValues: IFormValues;

  constructor(props: IProps) {
    super(props);
    this.state = { tags: [] };
    this.formModalService = CreateFormModalService(
      "CreateCompetitionSubmission",
      defaultValues,
      () => Object.assign(this.currentFormValues, this.state),
      (formValues: IFormValues, firstTime: boolean) => {
        this.currentFormValues = formValues;
        if (firstTime) { this.state = { tags: formValues.tags }; }
        else { this.setState({ tags: formValues.tags }); }
      },
      this.props.showNotification);
  }

  componentWillUnmount() {
    this.formModalService.saveCurrentValues();
  }

  public handleSubmit = async (values: IFormValues, { setSubmitting }: any): Promise<void> => {
    if (values.beneficiary && !values.beneficiary.startsWith("0x")) { values.beneficiary = "0x" + values.beneficiary; }
    const submissionValues: ICreateSubmissionOptions = {
      ...values,
      tags: this.state.tags,
    };

    setSubmitting(false);
    this.props.handleSubmit(submissionValues);
  }

  private onTagsChange = (tags: string[]): void => {
    this.setState({ tags });
  }

  public render(): RenderOutput {
    const { handleCancel, proposalState } = this.props;

    return (
      <div className={css.createSubmissionForm}>
        <h2 className={css.header}>
          <div className={css.content}>+ New Submission <div className={css.proposalTitle}>{proposalState.title ? <span> | {proposalState.title}</span> : ""}</div></div>
        </h2>

        <Formik
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          initialValues={this.currentFormValues}
          // eslint-disable-next-line react/jsx-no-bind
          validate={(values: IFormValues): void => {
            const errors: any = {};

            this.currentFormValues = values;

            const require = (name: string): void => {
              if (!(values as any)[name]) {
                errors[name] = "Required";
              }
            };

            if (values.title.length > 120) {
              errors.title = "Title is too long (max 120 characters)";
            }

            if (values.beneficiary && !isAddress(values.beneficiary)) {
              errors.beneficiary = "Invalid address";
            }

            if (!isValidUrl(values.url)) {
              errors.url = "Invalid URL";
            }

            require("description");
            require("title");

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
            resetForm,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            setFieldTouched,
            setFieldValue,
          }: FormikProps<IFormValues>) =>
            <Form noValidate>
              <TrainingTooltip overlay="The title is the header of the submission and will be the first visible information about your suggestion" placement="right">
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
                placeholder="Summarize your submission"
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
                placeholder="Describe your submission in greater detail"
                name="description"
                className={touched.description && errors.description ? css.error : null}
              />

              <TrainingTooltip overlay="Add some tags to give context for your submission" placement="right">
                <label className={css.tagSelectorLabel}>
                  Tags
                </label>
              </TrainingTooltip>

              <div className={css.tagSelectorContainer}>
                <TagsSelector onChange={this.onTagsChange} tags={this.state.tags}></TagsSelector>
              </div>

              <TrainingTooltip overlay="Link to the fully detailed description of your submission" placement="right">
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

              <div>
                <TrainingTooltip overlay="Ethereum Address or Alchemy Username to receive rewards, if not you" placement="right">
                  <label htmlFor="beneficiary">
                    Recipient, if not you
                    <ErrorMessage name="beneficiary">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                </TrainingTooltip>
                <UserSearchField
                  daoAvatarAddress={this.props.daoState.address}
                  name="beneficiary"
                  // eslint-disable-next-line react/jsx-no-bind
                  onBlur={(touched) => { setFieldTouched("beneficiary", touched); }}
                  // eslint-disable-next-line react/jsx-no-bind
                  onChange={(newValue) => { this.currentFormValues.beneficiary = newValue; setFieldValue("beneficiary", newValue); }}
                  value={this.currentFormValues.beneficiary}
                  placeholder={this.props.currentAccountAddress}
                />
              </div>

              <div className={css.createProposalActions}>
                <TrainingTooltip overlay={i18next.t("Export Proposal Tooltip")} placement="top">
                  <button id="export-proposal" className={css.exportProposal} type="button" onClick={this.formModalService.sendFormValuesToClipboard}>
                    <img src="/assets/images/Icon/share-blue.svg" />
                  </button>
                </TrainingTooltip>
                <button className={css.exitProposalCreation} type="button" onClick={handleCancel}>
                  Cancel
                </button>

                <ResetFormButton
                  resetToDefaults={this.formModalService.resetFormToDefaults(resetForm)}
                  isSubmitting={isSubmitting}
                ></ResetFormButton>

                <TrainingTooltip overlay="Once the submission is submitted it cannot be edited or deleted" placement="top">
                  <button className={css.submitProposal} type="submit" disabled={isSubmitting}>
                    Submit submission
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

export default connect(null, mapDispatchToProps)(CreateSubmission);
