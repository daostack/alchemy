import { IProposalType, Queue } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import { checkNetworkAndWarn, getArc } from "arc";
import * as classNames from "classnames";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import { knownSchemes, schemeName } from "lib/util";
import * as css from "../CreateProposal.scss";

interface IStateProps {
  daoAvatarAddress: string;
  handleClose: () => any;
  queues?: Queue[];
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
  otherScheme: string;
  parametersHash: string;
  permissions: {
    registerSchemes: boolean;
    changeConstraints: boolean;
    upgradeController: boolean;
    genericCall: boolean;
  };
  schemeToAdd: string;
  schemeToEdit: string;
  schemeToRemove: string;
  title: string;
  url: string;

  [key: string]: any;
}

interface IState {
  currentTab: string;
}

class CreateSchemeRegistrarProposalContainer extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);

    this.state = { currentTab: "addScheme" };
  }

  public async handleSubmit(values: FormValues, { setSubmitting }: any ) {
    if (!(await checkNetworkAndWarn(this.props.showNotification))) { return; }

    let permissions = 1;
    if (values.permissions.registerSchemes) {
      permissions += 2;
    }
    if (values.permissions.changeConstraints) {
      permissions += 4;
    }
    if (values.permissions.upgradeController) {
      permissions += 8;
    }
    if (values.permissions.genericCall) {
      permissions += 16;
    }

    const currentTab = this.state.currentTab;
    const proposalValues = {...values,
      type: this.state.currentTab === "removeScheme" ? IProposalType.SchemeRegistrarProposeToRemove : IProposalType.SchemeRegistrarPropose,
      parametersHash: values.parametersHash,
      permissions: "0x" + permissions.toString(16).padStart(8, "0"),
      scheme: currentTab === "addScheme" ? (values.schemeToAdd === "Other" ? values.otherScheme : values.schemeToAdd) :
              currentTab === "editScheme" ? values.schemeToEdit :
              values.schemeToRemove
    };

    setSubmitting(false);
    await this.props.createProposal(this.props.daoAvatarAddress, proposalValues);
  }

  public handleTabClick = (tab: string) => (e: any) => {
    this.setState({ currentTab: tab });
  }

  public render() {
    const { handleClose, queues } = this.props;
    const currentTab = this.state.currentTab;

    const arc = getArc();

    const unregisteredSchemeAddresses = Object.keys(knownSchemes()).filter((address) => !queues.find((queue) => queue.scheme.toLowerCase() === address.toLowerCase()));

    const addSchemeButtonClass = classNames({
      [css.addSchemeButton]: true,
      [css.selected]: currentTab === "addScheme"
    });
    const editSchemeButtonClass = classNames({
      [css.selected]: currentTab === "editScheme"
    });
    const removeSchemeButtonClass = classNames({
      [css.selected]: currentTab === "removeScheme"
    });

    const schemeRegistrarFormClass = classNames({
      [css.schemeRegistrarForm]: true,
      [css.addScheme]: currentTab === "addScheme",
      [css.removeScheme]: currentTab === "removeScheme",
      [css.editScheme]: currentTab === "editScheme"
    });

    return (
      <div className={css.schemeRegistrar}>
        <div className={css.schemeRegistrarSidebar}>
          <button className={addSchemeButtonClass} onClick={this.handleTabClick("addScheme")}>
            <span></span>
            Add Scheme
          </button>
          <button className={editSchemeButtonClass} onClick={this.handleTabClick("editScheme")}>
            <span></span>
            Edit Scheme
          </button>
          <button className={removeSchemeButtonClass} onClick={this.handleTabClick("removeScheme")}>
            <span></span>
            Remove Scheme
          </button>
        </div>

        <div className={schemeRegistrarFormClass}>
          <Formik
            initialValues={{
              description: "",
              otherScheme: "",
              parametersHash: "",
              permissions: {
                registerSchemes: false,
                changeConstraints: false,
                upgradeController: false,
                genericCall: false
              },
              schemeToAdd: unregisteredSchemeAddresses ? unregisteredSchemeAddresses[0] : "Other",
              title: "",
              url: ""
            } as FormValues}
            validate={(values: FormValues) => {
              const errors: any = {};

              const require = (name: string) => {
                if (!(values as any)[name]) {
                  errors[name] = "Required";
                }
              };

              require("description");
              require("title");

              if (values.title.length > 120) {
                errors.title = "Title is too long (max 120 characters)";
              }

              if (currentTab === "addScheme") {
                require("schemeToAdd");
                require("parametersHash");
              } else if (currentTab === "editScheme") {
                require("schemeToEdit");
                require("parametersHash");
              } else if (currentTab === "removeScheme") {
                require("schemeToRemove");
              }

              if (currentTab === "addScheme" && values.otherScheme && !arc.web3.utils.isAddress(values.otherScheme)) {
                errors.otherScheme = "Invalid address";
              }

              const parametersHashPattern = /0x([\da-f]){64}/i;
              if (currentTab !== "removeScheme" && values.parametersHash && !parametersHashPattern.test(values.parametersHash)) {
                errors.parametersHash = "Invalid parameters hash";
              }

              const urlPattern = new RegExp("(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})");
              if (values.url && !urlPattern.test(values.url)) {
                errors.url = "Invalid URL";
              }

              return errors;
            }}
            onSubmit={this.handleSubmit}
            render={({
              errors,
              touched,
              handleSubmit,
              isSubmitting,
              setFieldTouched,
              setFieldValue,
              values
            }: FormikProps<FormValues>) =>
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

                <div className={css.addEditSchemeFields}>
                  <div className={css.addSchemeSelectContainer}>
                    <label htmlFor="schemeToAddInput">
                      Scheme
                      <ErrorMessage name="schemeToAdd">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      <div className={css.requiredMarker}>*</div>
                    </label>
                    <Field
                      id="schemeToAddInput"
                      name="schemeToAdd"
                      component="select"
                      className={css.schemeSelect}
                    >
                      {unregisteredSchemeAddresses.map((address) => {
                        return <option key={`add_scheme_${address}`} value={address}>{schemeName(address)}</option>;
                      })}
                      <option value="Other">Other</option>
                    </Field>
                    <ErrorMessage name="otherScheme">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                    <Field
                      id="otherSchemeInput"
                      placeholder="Enter scheme address"
                      name="otherScheme"
                      className={(touched.otherScheme && errors.otherScheme ? css.error : null) + " " + css.otherScheme}
                    />
                  </div>

                  <div className={css.editSchemeSelectContainer}>
                    <label htmlFor="schemeToEditInput">
                      Scheme
                      <ErrorMessage name="schemeToEdit">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      <div className={css.requiredMarker}>*</div>
                    </label>
                    <Field
                      id="schemeToEditInput"
                      name="schemeToEdit"
                      component="select"
                      className={css.schemeSelect}
                      defaultValue=""
                    >
                      <option value="">Select a scheme...</option>
                      {queues.map((queue, i) => {
                        return <option key={`edit_scheme_${queue.scheme}`} value={queue.scheme}>{schemeName(queue.scheme)}</option>;
                      })}
                    </Field>
                  </div>

                  <div className={css.parametersHash}>
                    <label htmlFor="parametersHashInput">
                      Parameters Hash
                      <ErrorMessage name="parametersHash">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                    </label>
                    <Field
                      id="parametersHashInput"
                      placeholder="e.g. 0x0000000000000000000000000000000000000000000000000000000000001234"
                      name="parametersHash"
                      className={touched.parametersHash && errors.parametersHash ? css.error : null}
                    />
                  </div>
                  <div className={css.permissions}>
                    <div className={css.permissionsLabel}>
                      Permissions
                    </div>
                    <div className={css.permissionCheckbox}>
                      <Field id="registerOtherSchemesInput" type="checkbox" name="permissions.registerSchemes" />
                      <label htmlFor="registerOtherSchemesInput">
                        Register other schemes
                      </label>
                    </div>

                    <div className={css.permissionCheckbox}>
                      <Field id="changeConstraintsInput" type="checkbox" name="permissions.changeConstraints" />
                      <label htmlFor="changeConstraintsInput">
                        Add/remove global constraints
                      </label>
                    </div>

                    <div className={css.permissionCheckbox}>
                      <Field id="upgradeControllerInput" type="checkbox" name="permissions.upgradeController" />
                      <label htmlFor="upgradeControllerInput">
                        Upgrade the controller
                      </label>
                    </div>

                    <div className={css.permissionCheckbox}>
                      <Field id="genericCallInput" type="checkbox" name="permissions.genericCall" />
                      <label htmlFor="genericCallInput">
                        Call genericCall on behalf of
                      </label>
                    </div>
                  </div>
                </div>

                <div className={css.removeSchemeFields}>
                  <div className={css.removeSchemeSelectContainer}>
                    <label htmlFor="schemeToRemoveInput">
                      Scheme
                      <ErrorMessage name="schemeToRemove">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      <div className={css.requiredMarker}>*</div>
                    </label>
                    <Field
                      id="schemeToRemoveInput"
                      name="schemeToRemove"
                      component="select"
                      className={css.schemeSelect}
                      defaultValue=""
                    >
                      <option value="">Select a scheme...</option>
                      {queues.map((queue, i) => {
                        return <option key={`remove_scheme_${queue.scheme}`} value={queue.scheme}>{schemeName(queue.scheme)}</option>;
                      })}
                    </Field>
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
      </div>
    );
  }
}

const ConnectedCreateSchemeRegistrarProposalContainer = connect(mapStateToProps, mapDispatchToProps)(CreateSchemeRegistrarProposalContainer);

export default(props: IStateProps) => {
  const arc = getArc();
  const observable = arc.dao(props.daoAvatarAddress).queues();
  return <Subscribe observable={observable}>{
    (state: IObservableState<Queue[]>): any => {
      if (state.isLoading) {
        return  <div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>;
      } else if (state.error) {
        throw state.error;
      } else {
        return <ConnectedCreateSchemeRegistrarProposalContainer {...props} queues={state.data} />;
      }
    }
  }</Subscribe>;
};
