import { IDAOState, Address, IProposalState } from "@daostack/client";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import { isValidUrl } from "lib/util";
import * as React from "react";
import TagsSelector from "components/Proposal/Create/SchemeForms/TagsSelector";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import MarkdownField from "components/Proposal/Create/SchemeForms/MarkdownField";

import UserSearchField from "components/Shared/UserSearchField";
import * as css from "./Competitions.scss";

export interface ISubmitValues {
  recipient: Address;
  description: string;
  title: string;
  url: string;
  tags: Array<string>;
}

interface IExternalProps {
  daoState: IDAOState;
  proposalState: IProposalState;
  handleCancel: () => any;
  handleSubmit: (values: ISubmitValues) => any;
}

interface IStateProps {
  tags: Array<string>;
}

type IProps = IExternalProps;

interface IFormValues extends ISubmitValues {
  [key: string]: any;
}

export default class CreateSuggestion extends React.Component<IProps, IStateProps> {

  constructor(props: IProps) {
    super(props);
    this.state = { 
      tags: new Array<string>(),
    };
  }

  public handleSubmit = async (values: IFormValues, { setSubmitting }: any ): Promise<void> => {
    if (!values.recipient.startsWith("0x")) { values.recipient = "0x" + values.recipient; }

    const solutionValues = {...values,
      tags: this.state.tags,
    };

    setSubmitting(false);
    this.props.handleSubmit(solutionValues);
  }

  private onTagsChange = (tags: string[]): void => {
    this.setState({tags});
  }

  private fnDescription = (<span>Short description of the submission.<ul><li>What are you proposing to do?</li><li>Why is it important?</li><li>How much will it cost the DAO?</li><li>When do you plan to deliver the work?</li></ul></span>);

  public render(): RenderOutput {
    const { handleCancel, proposalState } = this.props;

    return (
      <div className={css.createSolutionForm}>
        <h2 className={css.header}>
          <div className={css.content}>+ New Solution<div className={css.proposalTitle}>{proposalState.title ? <span> | {proposalState.title}</span> : "" }</div></div>
        </h2>

        <Formik
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          initialValues={{
            recipient: "",
            description: "",
            title: "",
            url: "",
          } as IFormValues}
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


            if (!isValidUrl(values.url)) {
              errors.url = "Invalid URL";
            }

            require("description");
            require("title");
            require("recipient");

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
          }: FormikProps<IFormValues>) =>
            <Form noValidate>
              <TrainingTooltip overlay="The title is the header of the solution and will be the first visible information about your suggestion" placement="right">
                <label htmlFor="titleInput">
                Title
                  <ErrorMessage name="title">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  <div className={css.requiredMarker}>*</div>
                </label>
              </TrainingTooltip>
              <Field
                autoFocus
                id="titleInput"
                maxLength={120}
                placeholder="Summarize your solution"
                name="title"
                type="text"
                className={touched.title && errors.title ? css.error : null}
              />

              <TrainingTooltip overlay={this.fnDescription} placement="right">
                <label htmlFor="descriptionInput">
                Description
                  <div className={css.requiredMarker}>*</div>
                  <img className={css.infoTooltip} src="/assets/images/Icon/Info.svg"/>
                  <ErrorMessage name="description">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                </label>
              </TrainingTooltip>
              <Field
                component={MarkdownField}
                onChange={(value: any) => { setFieldValue("description", value); }}
                id="descriptionInput"
                placeholder="Describe your solution in greater detail"
                name="description"
                className={touched.description && errors.description ? css.error : null}
              />

              <TrainingTooltip overlay="Add some tags to give context for your solution" placement="right">
                <label className={css.tagSelectorLabel}>
                Tags
                </label>
              </TrainingTooltip>

              <div className={css.tagSelectorContainer}>
                <TagsSelector onChange={this.onTagsChange}></TagsSelector>
              </div>

              <TrainingTooltip overlay="Link to the fully detailed description of your solution" placement="right">
                <label htmlFor="urlInput">
                URL
                  <ErrorMessage name="url">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
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

              <div>
                <TrainingTooltip overlay="Ethereum Address or Alchemy Username to receive rewards" placement="right">
                  <label htmlFor="recipient">
                  Recipient
                    <ErrorMessage name="recipient">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                    <div className={css.requiredMarker}>*</div>
                  </label>
                </TrainingTooltip>
                <UserSearchField
                  daoAvatarAddress={this.props.daoState.address}
                  name="recipient"
                  onBlur={(touched) => { setFieldTouched("recipient", touched); }}
                  onChange={(newValue) => { setFieldValue("recipient", newValue); }}
                />
              </div>

              <div className={css.createProposalActions}>
                <button className={css.exitProposalCreation} type="button" onClick={handleCancel}>
                  Cancel
                </button>
                <TrainingTooltip overlay="Once the solution is submitted it cannot be edited or deleted" placement="top">
                  <button className={css.submitProposal} type="submit" disabled={isSubmitting}>
                  Submit solution
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
