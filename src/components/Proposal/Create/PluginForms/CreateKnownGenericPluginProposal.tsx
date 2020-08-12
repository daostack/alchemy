
import * as React from "react";
import { connect } from "react-redux";
import { IPluginState, IProposalCreateOptionsGS } from "@daostack/arc.js";
import { enableWalletProvider } from "arc";
import { isHexString } from "ethers/utils";

import { ErrorMessage, Field, FieldArray, Form, Formik, FormikErrors, FormikProps, FormikTouched } from "formik";
import * as classNames from "classnames";
import Interweave from "interweave";

import { Action, ActionField, GenericPluginInfo } from "genericPluginRegistry";

import { IRootState } from "reducers";
import { NotificationStatus, showNotification } from "reducers/notifications";
import * as arcActions from "actions/arcActions";

import Analytics from "lib/analytics";
import { isValidUrl, isAddress } from "lib/util";

import TagsSelector from "components/Proposal/Create/PluginForms/TagsSelector";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import * as css from "../CreateProposal.scss";
import MarkdownField from "./MarkdownField";
import HelpButton from "components/Shared/HelpButton";
import i18next from "i18next";
import { IFormModalService, CreateFormModalService } from "components/Shared/FormModalService";
import ResetFormButton from "components/Proposal/Create/PluginForms/ResetFormButton";

const BN = require("bn.js");

interface IExternalProps {
  daoAvatarAddress: string;
  genericPluginInfo: GenericPluginInfo;
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

  [key: string]: any;
}

interface IState {
  actions: Action[];
  currentAction: Action;
  tags: Array<string>;
}

const setInitialFormValues = (props: IProps): IFormValues => {

  const defaultValues: IFormValues = {
    description: "",
    title: "",
    url: "",
    currentActionId: "",
    tags: [],
  };

  const actions = props.genericPluginInfo.actions();
  const daoAvatarAddress = props.daoAvatarAddress;
  actions.forEach((action) => action.getFields().forEach((field: ActionField) => {
    if (typeof (field.defaultValue) !== "undefined") {
      if (field.defaultValue === "_avatar") {
        defaultValues[field.name] = daoAvatarAddress;
      } else {
        defaultValues[field.name] = field.defaultValue;
      }
    } else {
      switch (field.type) {
        case "uint64":
        case "uint256":
        case "bytes32":
        case "bytes":
        case "address":
        case "string":
          defaultValues[field.name] = "";
          break;
        case "bool":
          defaultValues[field.name] = 0;
          break;
        case "address[]":
          defaultValues[field.name] = [""];
          break;
      }
    }
  }));
  return Object.freeze(defaultValues);
};

class CreateKnownPluginProposal extends React.Component<IProps, IState> {

  formModalService: IFormModalService<IFormValues>;
  currentFormValues: IFormValues;

  constructor(props: IProps) {
    super(props);

    if (!props.genericPluginInfo) {
      throw Error("GenericPluginInfo should be provided");
    }

    const actions = props.genericPluginInfo.actions();
    this.state = {
      actions: props.genericPluginInfo.actions(),
      currentAction: actions[0],
      tags: [],
    };
    this.formModalService = CreateFormModalService(
      "CreateKnownGenericPluginProposal",
      setInitialFormValues(this.props),
      () => Object.assign(this.currentFormValues,
        { currentActionId: this.state.currentAction.id },
        this.state),
      (formValues: IFormValues, firstTime: boolean) => {
        this.currentFormValues = formValues;
        if (firstTime) { Object.assign(this.state,
          {
            currentAction: formValues.currentActionId ?
              this.state.actions.find(action => action.id === formValues.currentActionId) : this.state.currentAction,
            tags: formValues.tags,
          }); }
        else { this.setState({ tags: formValues.tags }); }
      },
      this.props.showNotification);
  }

  componentWillUnmount() {
    this.formModalService.saveCurrentValues();
  }

  private async getBountyEth(values: IFormValues): Promise<any> {
    const currentAction = this.state.currentAction;
    let ethToSend = new BN(0);

    // Search for payable feilds in Standard Bounties, add to send as ETH
    for (const field of currentAction.getFields()) {
      if (["_depositAmount", "_amount"].includes(field.name)) {
        ethToSend = ethToSend.add(new BN(values[field.name]));
      }
    }
    return ethToSend;
  }


  private handleSubmit = async (values: IFormValues, { setSubmitting }: any): Promise<void> => {

    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    const currentAction = this.state.currentAction;
    const callValues = [];

    for (const field of currentAction.getFields()) {
      const callValue = field.callValue(values[field.name]);
      values[field.name] = callValue;
      callValues.push(callValue);
    }

    let callData = "";
    try {
      callData = this.props.genericPluginInfo.encodeABI(currentAction, callValues);
    } catch (err) {
      showNotification(NotificationStatus.Failure, err.message);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);

    let ethValue = new BN(0);

    if (this.props.genericPluginInfo.specs.name === "Standard Bounties") {
      const calcBountEth = await this.getBountyEth(values);
      ethValue = ethValue.add(calcBountEth);
    }

    const proposalValues: IProposalCreateOptionsGS = {
      ...values,
      callData,
      dao: this.props.daoAvatarAddress,
      plugin: this.props.pluginState.address,
      tags: this.state.tags,
      type: "GenericScheme",
      value: ethValue.toString(), // amount of eth to send with the call
    };

    try {
      await this.props.createProposal(proposalValues);
    } catch (err) {
      showNotification(NotificationStatus.Failure, err.message);
      throw err;
    }

    Analytics.track("Submit Proposal", {
      "DAO Address": this.props.daoAvatarAddress,
      "Proposal Title": values.title,
      "Plugin Address": this.props.pluginState.address,
      "Plugin Name": this.props.pluginState.name,
    });

    this.props.handleClose();
  }

  public handleTabClick = (tab: string) => (_e: any) => {
    this.setState({ currentAction: this.props.genericPluginInfo.action(tab) });
  }

  public renderField(field: ActionField, values: IFormValues, touched: FormikTouched<IFormValues>, errors: FormikErrors<IFormValues>) {
    const type = "string";
    switch (field.type) {
      case "bool":
        return <div className={css.radioButtons}>
          <Field
            id={field.name + "_true"}
            name={field.name}
            checked={parseInt(values[field.name], 10) === 1}
            type="radio"
            value={1}
          />
          <label htmlFor={field.name + "_true"}>
            {field.labelTrue}
          </label>

          <Field
            id={field.name + "_false"}
            name={field.name}
            checked={parseInt(values[field.name], 10) === 0}
            type="radio"
            value={0}
          />
          <label htmlFor={field.name + "_false"}>
            {field.labelFalse}
          </label>
        </div>;
      default:
        if (field.type.includes("[]")) {
          // eslint-disable-next-line react/jsx-no-bind
          return <FieldArray name={field.name} render={(arrayHelpers) => (
            <div className={css.arrayFieldContainer}>
              {values[field.name] && values[field.name].length > 0 ? (
                values[field.name].map((value: any, index: number) => (
                  <div key={field.name + "_" + index} className={css.arrayField}>
                    {this.renderField(
                      new ActionField({ name: `${field.name}.${index}`, type: field.type.slice(0, -2), label: "", placeholder: field.placeholder }),
                      values,
                      touched,
                      errors
                    )}
                    <button
                      className={css.removeItemButton}
                      type="button"
                      // eslint-disable-next-line react/jsx-no-bind
                      onClick={() => arrayHelpers.remove(index)} // remove an item from the list
                    >
                      -
                    </button>
                  </div>
                ))
              ) : ""}
              {/* eslint-disable-next-line react/jsx-no-bind */}
              <button className={css.addItemButton} data-test-id={field.name + ".add"} type="button" onClick={() => arrayHelpers.push("")}>
                Add {field.label}
              </button>
            </div>
          )}
          />;
        }
        break;
    }

    return <Field
      id={field.name}
      data-test-id={field.name}
      placeholder={field.placeholder}
      name={field.name}
      type={type}
      className={touched[field.name] && errors[field.name] ? css.error : null}
    />;
  }

  private onTagsChange = (tags: any[]): void => {
    this.setState({ tags });
  }

  public render(): RenderOutput {
    const { handleClose } = this.props;

    const actions = this.state.actions;
    const currentAction = this.state.currentAction;

    return (
      <div className={css.containerWithSidebar}>
        <div className={css.sidebar}>
          {actions.map((action) =>
            <button
              data-test-id={"action-tab-" + action.id}
              key={action.id}
              className={classNames({
                [css.tab]: true,
                [css.selected]: currentAction.id === action.id,
              })}
              onClick={this.handleTabClick(action.id)}>
              <span></span>
              {action.label}
            </button>
          )}
        </div>

        <div className={css.contentWrapper}>
          <Formik
            initialValues={this.currentFormValues}
            // eslint-disable-next-line react/jsx-no-bind
            validate={(values: IFormValues): void => {
              const errors: any = {};

              this.currentFormValues = values;

              const valueIsRequired = (name: string) => {
                const value = values[name];
                if (value === 0) {
                  return;
                }
                if (!value || (Array.isArray(value) && value.length === 0)) {
                  errors[name] = "Required";
                }
              };

              valueIsRequired("description");
              valueIsRequired("title");

              if (values.title.length > 120) {
                errors.title = "Title is too long (max 120 characters)";
              }

              if (!isValidUrl(values.url)) {
                errors.url = "Invalid URL";
              }

              for (const field of this.state.currentAction.getFields()) {
                if (field.type !== "bool" && !field.optional) {
                  valueIsRequired(field.name);
                }

                // Check if value can be interpreted correctly for this particular field
                let value = values[field.name];
                try {
                  value = field.callValue(value);
                } catch (error) {
                  if (error.message === "Assertion failed") {
                    // thank you BN.js for your helpful error messages
                    errors[field.name] = "Invalid number value";
                  } else {
                    errors[field.name] = error.message;
                  }
                }

                if (field.type === "address") {
                  if (!isAddress(value)) {
                    errors[field.name] = "Invalid address";
                  }
                }

                if (field.type.includes("bytes")) {
                  if (!isHexString(value)) {
                    errors[field.name] = "Must be a hex value";
                  }
                }

                if (field.type === "address[]") {
                  for (const i of value) {
                    if (!isAddress(i)) {
                      errors[field.name] = "Invalid address";
                    }
                  }
                }

                if (field.type === "uint256") {
                  if (/^\d+$/.test(value) === false) {
                    errors[field.name] = "Must contain only digits";
                  }
                }
              }
              return errors;
            }}
            onSubmit={this.handleSubmit}
            // eslint-disable-next-line react/jsx-no-bind
            render={({
              errors,
              touched,
              isSubmitting,
              resetForm,
              setFieldValue,
              values,
            }: FormikProps<IFormValues>) => {
              return (
                <Form noValidate>
                  <label className={css.description}>What to Expect</label>
                  <div className={css.description}>
                    <Interweave content={currentAction.description} />
                  </div>
                  <label htmlFor="titleInput">
                    <div className={css.requiredMarker}>*</div>
                      Title
                    <ErrorMessage name="title">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
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
                    // eslint-disable-next-line react/jsx-no-bind
                    onChange={(value: any) => { setFieldValue("description", value); }}
                    id="descriptionInput"
                    placeholder={i18next.t("Description Placeholder")}
                    name="description"
                    className={touched.description && errors.description ? css.error : null}
                  />

                  <label className={css.tagSelectorLabel}>
                    Tags
                  </label>

                  <div className={css.tagSelectorContainer}>
                    <TagsSelector onChange={this.onTagsChange} tags={this.state.tags}></TagsSelector>
                  </div>

                  <label htmlFor="urlInput">
                    URL
                    <ErrorMessage name="url">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    id="urlInput"
                    maxLength={120}
                    placeholder={i18next.t("URL Placeholder")}
                    name="url"
                    type="text"
                    className={touched.url && errors.url ? css.error : null}
                  />

                  <div key={currentAction.id}
                    className={classNames({
                      [css.tab]: true,
                      [css.selected]: this.state.currentAction.id === currentAction.id,
                    })
                    }
                  >
                    {
                      currentAction.getFields().map((field: ActionField) => {
                        return (
                          <div key={field.name}>
                            <label htmlFor={field.name}>
                              {field.type !== "bool" && !field.optional ? <div className={css.requiredMarker}>*</div> : ""}
                              {field.label}
                              <ErrorMessage name={field.name}>{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                            </label>
                            {this.renderField(field, values, touched, errors)}
                          </div>
                        );
                      })
                    }
                  </div>

                  <div className={css.createProposalActions}>
                    <TrainingTooltip overlay={i18next.t("Export Proposal Tooltip")} placement="top">
                      <button id="export-proposal" className={css.exportProposal} type="button" onClick={this.formModalService.sendFormValuesToClipboard}>
                        <img src="/assets/images/Icon/share-blue.svg" />
                      </button>
                    </TrainingTooltip>
                    <button className={css.exitProposalCreation} type="button" onClick={handleClose}>
                      Cancel
                    </button>

                    <ResetFormButton
                      resetToDefaults={this.formModalService.resetFormToDefaults(resetForm)}
                      isSubmitting={isSubmitting}
                    ></ResetFormButton>

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
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateKnownPluginProposal);
