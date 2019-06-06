// const BN = require("bn.js");
import { IProposalType, Scheme } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import { checkMetaMaskAndWarn } from "arc";
import * as classNames from "classnames";
import { ErrorMessage, Field, FieldArray, Form, Formik, FormikErrors, FormikProps, FormikTouched } from "formik";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { Action, GenericSchemeInfo, GenericSchemeRegistry} from "../../../genericSchemeRegistry";
import * as css from "../CreateProposal.scss";

interface IStateProps {
  daoAvatarAddress: string;
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
  genericSchemeInfo: GenericSchemeInfo;
}

class CreateDutchXProposalContainer extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);

    const genericSchemeRegistry = new GenericSchemeRegistry();
    const genericSchemeInfo = genericSchemeRegistry.genericSchemeInfo("dxDAO");
    const actions = genericSchemeInfo.actions();
    this.state = {
      actions,
      currentAction:  actions[0],
      genericSchemeInfo
    };
  }

  public async handleSubmit(values: FormValues, { setSubmitting }: any ) {
    if (!(await checkMetaMaskAndWarn(this.props.showNotification))) { return; }

    const currentAction = this.state.currentAction;

    const callValues = [];
    for (let input of currentAction.abi.inputs) {
      callValues.push(values[input.name]);
    }
    let callData: string = "";
    try {
      callData = this.state.genericSchemeInfo.encodeABI(currentAction, callValues);
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
    this.setState({ currentAction: this.state.genericSchemeInfo.action(tab) });
  }

  public renderField(field: { name: string, type: string, label: string}, values: FormValues, touched: FormikTouched<FormValues>, errors: FormikErrors<FormValues>) {
    let type = "string";
    switch (field.type) {
      case "uint256":
        type = "number";
        break;
      case "bool":
        type = "checkbox";
        break;
      default:
        if (field.type.includes("[]")) {
          return <FieldArray name={field.name} render={(arrayHelpers) => (
            <div className={css.addToken}>
              {values[field.name] && values[field.name].length > 0 ? (
                values[field.name].map((value: any, index: number) => (
                  <div key={field.name + "_" + index} className={css.tokenField}>
                    {this.renderField({name: `${field.name}.${index}`, type: field.type.slice(0, -2), label: ""}, values, touched, errors)}
                    <button
                      className={css.addSubtract}
                      type="button"
                      onClick={() => arrayHelpers.remove(index)} // remove an item from the list
                    >
                      -
                    </button>
                    <button
                      className={css.addSubtract}
                      type="button"
                      onClick={() => arrayHelpers.insert(index, "")} // insert an empty string at a position
                    >
                      +
                    </button>
                  </div>
                ))
              ) : (
                <button className={css.addTokenButton} type="button" onClick={() => arrayHelpers.push("")}>
                  {/* show this when user has removed all items from the list */}
                  Add {field.label}
                </button>
              )}
            </div>
            )}
          />;
        }
        break;
    }

    return <Field
      id={field.name}
      data-test-id={field.name}
      placeholder={`${field.name} --- type is: ${field.type}`}
      name={field.name}
      type={type}
      className={touched[field.name] && errors[field.name] ? css.error : null}
    />;
  }

  public render() {
    const { handleClose } = this.props;

    const actions = this.state.actions;
    const currentAction = this.state.currentAction;

    const initialFormValues: FormValues = {
      description: "",
      title: "",
      url: ""
    };

    actions.forEach((action) => action.abi.inputs.forEach((input: any) => {
      switch (input.type) {
        case "uint256":
          initialFormValues[input.name] = "";
          break;
        case "address":
        case "string":
          initialFormValues[input.name] = "";
          break;
        case "bool":
          initialFormValues[input.name] = false;
          break;
        case "address[]":
          initialFormValues[input.name] = [];
          break;
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
              }

              return errors;
            }}
            onSubmit={this.handleSubmit.bind(this)}
            render={({
              errors,
              touched,
              handleSubmit,
              isSubmitting,
              setFieldTouched,
              setFieldValue,
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
                      currentAction.getFields().map((field: { name: string, type: string, label: string}) => {
                        // TODO: show different field depending on field.type

                        return (
                          <div key={field.name}>
                            <label htmlFor={field.name}>
                              { field.label }
                              <ErrorMessage name={field.name}>{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                              <div className={css.requiredMarker}>*</div>
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

export default connect(mapStateToProps, mapDispatchToProps)(CreateDutchXProposalContainer);
