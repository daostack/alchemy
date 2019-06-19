// const BN = require("bn.js");
import { IProposalType, Scheme } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import { checkMetaMaskAndWarn, getArc } from "arc";
import BN = require("bn.js");
import * as classNames from "classnames";
import { ErrorMessage, Field, FieldArray, Form, Formik, FormikErrors, FormikProps, FormikTouched } from "formik";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { Action, GenericSchemeInfo, IFieldSpec } from "../../../genericSchemeRegistry";
import * as css from "../CreateProposal.scss";

interface IStateProps {
  daoAvatarAddress: string;
  genericSchemeInfo: GenericSchemeInfo;
  handleClose: () => any;
  scheme: Scheme;
}

const mapStateToProps = (state: IRootState, ownProps: IStateProps) => {
  return ownProps;
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
  description: string;
  title: string;
  url: string;
  [key: string]: any; // TODO: "allowSyntheticDefaultImports": true in tsconfig.json should render this unecessary. But it is needed anyway
}

interface IState {
  actions: Action[];
  currentAction: Action;
}

class CreateKnownSchemeProposalContainer extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);

    if (!props.genericSchemeInfo) {
      throw Error("GenericSchemeInfo should be provided");
    }

    const actions = props.genericSchemeInfo.actions();
    this.state = {
      actions,
      currentAction:  actions[0]
    };
  }

  public async handleSubmit(values: FormValues, { setSubmitting }: any ) {
    if (!(await checkMetaMaskAndWarn(this.props.showNotification))) { return; }

    const currentAction = this.state.currentAction;

    const callValues = [];
    for (let field of currentAction.getFields()) {
      if (field.type === "bool") {
        values[field.name] = parseInt(values[field.name], 10) === 1;
      }
      if (field.decimals) {
        values[field.name] = (new BN(values[field.name]).mul(new BN(10).pow(new BN(field.decimals)))).toString();
      }
      callValues.push(values[field.name]);
    }
    let callData: string = "";
    try {
      callData = this.props.genericSchemeInfo.encodeABI(currentAction, callValues);
    } catch (err) {
      // TODO: show notification, not an alert, and close the form
      alert(err.message);
      showNotification(NotificationStatus.Failure, err.message);
      this.props.handleClose();
      return;
    }
    setSubmitting(false);

    const proposalValues = {
      ...values,
      callData,
      dao: this.props.daoAvatarAddress,
      scheme: this.props.scheme.address,
      type: IProposalType.GenericScheme,
      value: 0, // amount of eth to send with the call
    };

    try {
      await this.props.createProposal(proposalValues);
    } catch (err) {
      alert(err.message);
      throw err;
    }
    this.props.handleClose();
  }

  public handleTabClick = (tab: string) => (e: any) => {
    this.setState({ currentAction: this.props.genericSchemeInfo.action(tab) });
  }

  public renderField(field: IFieldSpec, values: FormValues, touched: FormikTouched<FormValues>, errors: FormikErrors<FormValues>) {
    let type = "string";
    switch (field.type) {
      case "uint256":
        type = "number";
        break;
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
        break;
      default:
        if (field.type.includes("[]")) {
          return <FieldArray name={field.name} render={(arrayHelpers) => (
            <div className={css.arrayFieldContainer}>
              {values[field.name] && values[field.name].length > 0 ? (
                values[field.name].map((value: any, index: number) => (
                  <div key={field.name + "_" + index} className={css.arrayField}>
                    {this.renderField({name: `${field.name}.${index}`, type: field.type.slice(0, -2), label: ""}, values, touched, errors)}
                    <button
                      className={css.removeItemButton}
                      type="button"
                      onClick={() => arrayHelpers.remove(index)} // remove an item from the list
                    >
                      -
                    </button>
                  </div>
                ))
              ) : ""}
              <button className={css.addItemButton} type="button" onClick={() => arrayHelpers.push("")}>
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
      placeholder=""
      name={field.name}
      type={type}
      className={touched[field.name] && errors[field.name] ? css.error : null}
    />;
  }

  public render() {
    const { handleClose } = this.props;
    const arc = getArc();

    const actions = this.state.actions;
    const currentAction = this.state.currentAction;

    const initialFormValues: FormValues = {
      description: "",
      title: "",
      url: ""
    };

    actions.forEach((action) => action.getFields().forEach((field: IFieldSpec) => {
      if (typeof(field.defaultValue) !== "undefined") {
        initialFormValues[field.name] = field.defaultValue;
      } else {
        switch (field.type) {
          case "uint256":
            initialFormValues[field.name] = "";
            break;
          case "address":
          case "string":
            initialFormValues[field.name] = "";
            break;
          case "bool":
            initialFormValues[field.name] = 0;
            break;
          case "address[]":
            initialFormValues[field.name] = [""];
            break;
        }
      }
    }));

    return (
      <div className={css.createWrapperWithSidebar}>
        <div className={css.sidebar}>
          { actions.map((action) =>
            <button
              key={action.id}
              className={classNames({
                [css.tab]: true,
                [css.selected]: currentAction.id === action.id
              })}
              onClick={this.handleTabClick(action.id)}>
              <span></span>
              { action.label }
            </button>
          )}
        </div>

        <div className={css.formWrapper}>
          <Formik
            initialValues={initialFormValues}
            validate={(values: FormValues) => {
              const errors: any = {};

              const valueIsRequired = (name: string) => {
                const value = values[name];
                if (!value || (Array.isArray(value) && value.length === 0)) {
                  errors[name] = "Required";
                }
              };

              valueIsRequired("description");
              valueIsRequired("title");

              if (values.title.length > 120) {
                errors.title = "Title is too long (max 120 characters)";
              }

              const urlPattern = new RegExp("(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})");
              if (values.url && !urlPattern.test(values.url)) {
                errors.url = "Invalid URL";
              }

              for (let input of this.state.currentAction.abi.inputs) {
                if (input.type !== "bool") {
                  valueIsRequired(input.name);
                }

                if (input.type === "address[]") {
                  for (let value of values[input.name]) {
                    if (!arc.web3.utils.isAddress(value)) {
                      errors[input.name] = "Invalid address";
                    }
                  }
                }
              }

              return errors;
            }}
            onSubmit={this.handleSubmit.bind(this)}
            render={({
              errors,
              touched,
              isSubmitting,
              values
            }: FormikProps<FormValues>) => {
              return (
                <Form noValidate>
                  <label htmlFor="titleInput">
                    Title
                    <ErrorMessage name="title">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
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
                    <ErrorMessage name="description">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
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
                    <ErrorMessage name="url">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    id="urlInput"
                    maxLength={120}
                    placeholder="Description URL"
                    name="url"
                    type="text"
                    className={touched.url && errors.url ? css.error : null}
                  />

                  <div key={currentAction.id}
                     className={classNames({
                        [css.tab]: true,
                        [css.selected]: this.state.currentAction.id === currentAction.id
                      })
                    }
                  >
                    {
                      currentAction.getFields().map((field: IFieldSpec) => {
                        return (
                          <div key={field.name}>
                            <label htmlFor={field.name}>
                              { field.label }
                              <ErrorMessage name={field.name}>{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                              {field.type !== "bool" ? <div className={css.requiredMarker}>*</div> : ""}
                            </label>

                            {this.renderField(field, values, touched, errors)}
                          </div>
                        );
                      })
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
              );
            }}
          />
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateKnownSchemeProposalContainer);
