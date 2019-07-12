import { IProposalType, Scheme } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import { checkWeb3ProviderAndWarn, getArc } from "arc";
import * as classNames from "classnames";
import Loading from "components/Shared/Loading";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import { schemeNameAndAddress } from "lib/util";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import * as css from "../CreateProposal.scss";
import MarkdownField from "./MarkdownField";

interface IContainerProps {
  scheme: Scheme;
}

interface IStateProps {
  daoAvatarAddress: string;
  handleClose: () => any;
  schemes?: Scheme[];
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

type IProps = IContainerProps & IStateProps & IDispatchProps;

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
    if (!(await checkWeb3ProviderAndWarn(this.props.showNotification))) { return; }

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
    let proposalType;
    if (this.state.currentTab  === "removeScheme") {
      proposalType = IProposalType.SchemeRegistrarRemove;
    } else if (this.state.currentTab === "addScheme") {
      proposalType = IProposalType.SchemeRegistrarAdd;
    } else {
      proposalType = IProposalType.SchemeRegistrarEdit;
   }
    const proposalValues = {
      ...values,
      dao: this.props.daoAvatarAddress,
      type: proposalType,
      parametersHash: values.parametersHash,
      permissions: "0x" + permissions.toString(16).padStart(8, "0"),
      scheme: this.props.scheme.address,
      schemeToRegister: currentTab === "addScheme" ? values.schemeToAdd :
              currentTab === "editScheme" ? values.schemeToEdit :
              values.schemeToRemove
    };

    setSubmitting(false);
    await this.props.createProposal(proposalValues);
    this.props.handleClose();
  }

  public handleTabClick = (tab: string) => (e: any) => {
    this.setState({ currentTab: tab });
  }

  public render() {
    const { handleClose, schemes } = this.props;
    // "schemes" are the schemes registered in this DAO
    const currentTab = this.state.currentTab;

    const arc = getArc();

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
      [css.formWrapper]: true,
      [css.addScheme]: currentTab === "addScheme",
      [css.removeScheme]: currentTab === "removeScheme",
      [css.editScheme]: currentTab === "editScheme"
    });

    return (
      <div className={css.createWrapperWithSidebar}>
        <div className={css.sidebar}>
          <button className={addSchemeButtonClass} onClick={this.handleTabClick("addScheme")} data-test-id="tab-AddScheme">
            <span></span>
            Add Scheme
          </button>
          <button className={editSchemeButtonClass} onClick={this.handleTabClick("editScheme")} data-test-id="tab-EditScheme">
            <span></span>
            Edit Scheme
          </button>
          <button className={removeSchemeButtonClass} onClick={this.handleTabClick("removeScheme")} data-test-id="tab-RemoveScheme">
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
              isSubmitting,
              setFieldValue
            }: FormikProps<FormValues>) => {
              return (
                <Form noValidate>
                  { (currentTab === "addScheme") ?
                  <div className={css.description}>Propose to add a new scheme to the DAO. If this scheme is a universal scheme, you must also supply its param hash configuration.</div> :
                    (currentTab === "editScheme") ?
                  <div className={css.description}>Propose to edit a schemes’ param hash configuration.</div> :
                    (currentTab === "removeScheme") ?
                  <div className={css.description}>Propose to remove a scheme from the DAO.</div> : ""
                  }
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
                    component={MarkdownField}
                    onChange={(value: any) => { setFieldValue("description", value); }}
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
                        placeholder="Enter scheme address"
                        name="schemeToAdd"
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
                        {schemes.map((scheme, i) => {
                          return <option key={`edit_scheme_${scheme.address}`} value={scheme.address}>{schemeNameAndAddress(scheme.address)}</option>;
                        })}
                      </Field>
                    </div>

                    <div className={css.parametersHash}>
                      <label htmlFor="parametersHashInput">
                        Parameters Hash
                        <ErrorMessage name="parametersHash">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                        <div className={css.requiredMarker}>*</div>
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
                        {schemes.map((scheme, i) => {
                          return <option key={`remove_scheme_${scheme.address}`} value={scheme.address}>{schemeNameAndAddress(scheme.address)}</option>;
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
              );
            }}
          />
        </div>
      </div>
    );
  }
}

const ConnectedCreateSchemeRegistrarProposalContainer = connect(mapStateToProps, mapDispatchToProps)(CreateSchemeRegistrarProposalContainer);

export default(props: IContainerProps & IStateProps) => {
  const arc = getArc();
  const observable = arc.dao(props.daoAvatarAddress).schemes();
  return <Subscribe observable={observable}>{
    (state: IObservableState<Scheme[]>): any => {
      if (state.isLoading) {
        return  <div className={css.loading}><Loading/></div>;
      } else if (state.error) {
        throw state.error;
      } else {
        return <ConnectedCreateSchemeRegistrarProposalContainer {...props} schemes={state.data} />;
      }
    }
  }</Subscribe>;
};
