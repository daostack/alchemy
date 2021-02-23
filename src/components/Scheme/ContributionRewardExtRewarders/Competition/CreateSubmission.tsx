import { IDAOState, IProposalState, Address } from "@daostack/arc.js";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import { isValidUrl, getNetworkByDAOAddress, getArcByDAOAddress} from "lib/util";
import * as React from "react";
import TagsSelector from "components/Proposal/Create/SchemeForms/TagsSelector";
import MarkdownField from "components/Proposal/Create/SchemeForms/MarkdownField";
import { getArc } from "arc";
import UserSearchField from "components/Shared/UserSearchField";
import { ICreateSubmissionOptions } from "./utils";
import * as css from "./Competitions.scss";
import { exportUrl, importUrlValues } from "lib/proposalUtils";
import { showNotification, NotificationStatus } from "@store/notifications/notifications.reducer";
import { connect } from "react-redux";

interface IDispatchProps {
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  showNotification,
};
import HelpButton from "components/Shared/HelpButton";

interface IExternalProps {
  currentAccountAddress: Address;
  daoState: IDAOState;
  proposalState: IProposalState;
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

class CreateSubmission extends React.Component<IProps, IStateProps> {

  private initialFormValues: IFormValues;

  constructor(props: IProps) {
    super(props);

    this.initialFormValues = importUrlValues<IFormValues>({
      beneficiary: "",
      description: "",
      title: "",
      url: "",
      tags: [],
    });
    this.state = {
      tags: this.initialFormValues.tags,
    };
  }

  // Exports data from form to a shareable url.
  public exportFormValues(values: IFormValues) {
    exportUrl({ ...values, ...this.state });
    this.props.showNotification(NotificationStatus.Success, "Exportable url is now in clipboard :)");
  }

  public handleSubmit = async (values: IFormValues, { setSubmitting }: any ): Promise<void> => {
    if (values.beneficiary && !values.beneficiary.startsWith("0x")) { values.beneficiary = "0x" + values.beneficiary; }
    const submissionValues: ICreateSubmissionOptions = {...values,
      tags: this.state.tags,
    };

    setSubmitting(false);
    this.props.handleSubmit(submissionValues);
  }

  private onTagsChange = (tags: string[]): void => {
    this.setState({tags});
  }

  public render(): RenderOutput {
    const { handleCancel, proposalState } = this.props;
    const arc = getArc(getNetworkByDAOAddress(this.props.daoState.dao.id));

    return (
      <div className={css.createSubmissionForm}>
        <h2 className={css.header}>
          <div className={css.content}>+ New Submission <div className={css.proposalTitle}>{proposalState.title ? <span> | {proposalState.title}</span> : "" }</div></div>
        </h2>

        <Formik
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          initialValues={this.initialFormValues}
          // eslint-disable-next-line react/jsx-no-bind
          validate={(values: IFormValues): void => {
            const errors: any = {};

            const require = (name: string): void => {
              if (!(values as any)[name]) {
                errors[name] = "Required";
              }
            };

            if (values.title.length > 120) {
              errors.title = "Title is too long (max 120 characters)";
            }

            if (values.beneficiary && !arc.web3.utils.isAddress(values.beneficiary)) {
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            setFieldTouched,
            setFieldValue,
            values,
          }: FormikProps<IFormValues>) =>
            <Form noValidate>
              <label htmlFor="titleInput">
                <div className={css.requiredMarker}>*</div>
              Title
                <ErrorMessage name="title">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
              </label>
              <Field
                autoFocus
                id="titleInput"
                maxLength={120}
                placeholder="Summarize your submission"
                name="title"
                type="text"
                className={touched.title && errors.title ? css.error : null}
              />

              <label htmlFor="descriptionInput">
                <div className={css.proposalDescriptionLabelText}>
                  <div className={css.requiredMarker}>*</div>
                  <div className={css.body}>Description</div><HelpButton text={HelpButton.helpTextProposalDescription} />
                </div>
                <ErrorMessage name="description">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
              </label>
              <Field
                component={MarkdownField}
                onChange={(value: any) => { setFieldValue("description", value); }}
                id="descriptionInput"
                placeholder="Describe your submission in greater detail"
                name="description"
                className={touched.description && errors.description ? css.error : null}
              />
              <label className={css.tagSelectorLabel}>
              Tags
              </label>
              <div className={css.tagSelectorContainer}>
                <TagsSelector onChange={this.onTagsChange} tags={this.state.tags} arc={getArcByDAOAddress(this.props.daoState.address)}></TagsSelector>
              </div>
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
                <label htmlFor="beneficiary">
                  Recipient, if not you
                  <ErrorMessage name="beneficiary">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                </label>
                <UserSearchField
                  daoAvatarAddress={this.props.daoState.address}
                  name="beneficiary"
                  onBlur={(touched) => { setFieldTouched("beneficiary", touched); }}
                  onChange={(newValue) => { setFieldValue("beneficiary", newValue); }}
                  defaultValue={this.initialFormValues.beneficiary}
                  placeholder={this.props.currentAccountAddress}
                />
              </div>

              <div className={css.createProposalActions}>
                <button id="export-proposal" className={css.exportProposal} type="button" onClick={() => this.exportFormValues(values)}>
                  <img src="/assets/images/Icon/share-blue.svg" />
                </button>
                <button className={css.exitProposalCreation} type="button" onClick={handleCancel}>
                  Cancel
                </button>
                <button className={css.submitProposal} type="submit" disabled={isSubmitting}>
                  Submit submission
                </button>
              </div>
            </Form>
          }
        />
      </div>
    );
  }
}

export default connect(null, mapDispatchToProps)(CreateSubmission);
