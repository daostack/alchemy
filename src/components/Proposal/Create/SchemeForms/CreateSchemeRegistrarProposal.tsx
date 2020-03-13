/* eslint-disable no-bitwise */
import { enableWalletProvider, getArc } from "arc";

import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import TagsSelector from "components/Proposal/Create/SchemeForms/TagsSelector";
import TrainingTooltip from "components/Shared/TrainingTooltip";

import { createProposal } from "actions/arcActions";
import { showNotification, NotificationStatus } from "reducers/notifications";
import Analytics from "lib/analytics";
import { isValidUrl } from "lib/util";
import { GetSchemeIsActiveActions, getSchemeIsActive, REQUIRED_SCHEME_PERMISSIONS, schemeNameAndAddress, SchemePermissions } from "lib/schemeUtils";
import { exportUrl, importUrlValues } from "lib/proposalUtils";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import classNames from "classnames";
import { IProposalType, ISchemeState, Scheme } from "@daostack/client";
import { connect } from "react-redux";
import * as React from "react";
import * as css from "../CreateProposal.scss";
import MarkdownField from "./MarkdownField";


interface IExternalProps {
  daoAvatarAddress: string;
  handleClose: () => any;
  scheme: ISchemeState;
}

interface IDispatchProps {
  createProposal: typeof createProposal;
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  createProposal,
  showNotification,
};

type IProps = IExternalProps & IDispatchProps & ISubscriptionProps<Scheme[]>;

interface IFormValues {
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
  tags: Array<string>;
  requiredPermissions: number;
}

class CreateSchemeRegistrarProposal extends React.Component<IProps, IState> {

  initialFormValues: IFormValues;

  constructor(props: IProps) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.initialFormValues = importUrlValues<IFormValues>({
      description: "",
      otherScheme: "",
      schemeToAdd: "",
      schemeToEdit: "",
      schemeToRemove: "",
      parametersHash: "",
      permissions: {
        registerSchemes: false,
        changeConstraints: false,
        upgradeController: false,
        genericCall: false,
      },
      title: "",
      url: "",
      currentTab: "addScheme",
      tags: [],
    });
    this.state = {
      currentTab: this.initialFormValues.currentTab,
      tags: this.initialFormValues.tags,
      requiredPermissions: 0,
    };
  }

  public handleChangeScheme = (e: any) => {
    const arc = getArc();
    try {
      // If we know about this contract then require the minimum permissions for it
      const contractInfo = arc.getContractInfo(e.target.value);
      this.setState({ requiredPermissions: REQUIRED_SCHEME_PERMISSIONS[contractInfo.name] });
      /* eslint-disable-next-line no-empty */
    } catch (e) {}
  }

  public async handleSubmit(values: IFormValues, { setSubmitting }: any ):  Promise<void> {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

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
          values.schemeToRemove,
      tags: this.state.tags,
    };
    setSubmitting(false);
    await this.props.createProposal(proposalValues);

    Analytics.track("Submit Proposal", {
      "DAO Address": this.props.daoAvatarAddress,
      "Proposal Title": values.title,
      "Scheme Address": this.props.scheme.address,
      "Scheme Name": this.props.scheme.name,
    });

    this.props.handleClose();
  }

  public handleTabClick = (tab: string) => (_e: any) => {
    this.setState({ currentTab: tab });
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
    // "schemes" are the schemes registered in this DAO
    const schemes = this.props.data;
    const { handleClose } = this.props;

    const { currentTab, requiredPermissions } = this.state;

    const arc = getArc();

    const addSchemeButtonClass = classNames({
      [css.addSchemeButton]: true,
      [css.selected]: currentTab === "addScheme",
    });
    const editSchemeButtonClass = classNames({
      [css.selected]: currentTab === "editScheme",
    });
    const removeSchemeButtonClass = classNames({
      [css.selected]: currentTab === "removeScheme",
    });

    const schemeRegistrarFormClass = classNames({
      [css.formWrapper]: true,
      [css.addScheme]: currentTab === "addScheme",
      [css.removeScheme]: currentTab === "removeScheme",
      [css.editScheme]: currentTab === "editScheme",
    });

    const isAddActive = getSchemeIsActive(this.props.scheme, GetSchemeIsActiveActions.Register);
    const isRemoveActive = getSchemeIsActive(this.props.scheme, GetSchemeIsActiveActions.Remove);
    const fnDescription = () => (<span>Short description of the proposal.<ul><li>What are you proposing to do?</li><li>Why is it important?</li><li>How much will it cost the DAO?</li><li>When do you plan to deliver the work?</li></ul></span>);

    return (
      <div className={css.createWrapperWithSidebar}>
        <div className={css.sidebar}>
          { isAddActive ?
            <button className={addSchemeButtonClass} onClick={this.handleTabClick("addScheme")} data-test-id="tab-AddScheme">
              <span></span>
              Add Plugin
            </button>
            : "" }
          { isAddActive ?
            <button className={editSchemeButtonClass} onClick={this.handleTabClick("editScheme")} data-test-id="tab-EditScheme">
              <span></span>
              Edit Plugin
            </button>
            : "" }
          { isRemoveActive ?
            <button className={removeSchemeButtonClass} onClick={this.handleTabClick("removeScheme")} data-test-id="tab-RemoveScheme">
              <span></span>
            Remove Plugin
            </button>
            : "" }
        </div>

        <div className={schemeRegistrarFormClass}>
          <Formik
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            initialValues={this.initialFormValues}
            // eslint-disable-next-line react/jsx-no-bind
            validate={(values: IFormValues) => {
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
              handleChange,
              isSubmitting,
              setFieldValue,
              values,
            }: FormikProps<IFormValues>) => {
              return (
                <Form noValidate>
                  <label className={css.description}>What to Expect</label>
                  { (currentTab === "addScheme") ?
                    <div className={css.description}>Propose to add a new plugin to the DAO. If this plugin is a universal scheme, you must also supply its param hash configuration.</div> :
                    (currentTab === "editScheme") ?
                      <div className={css.description}>Propose to edit param hash configuration of a plugin.</div> :
                      (currentTab === "removeScheme") ?
                        <div className={css.description}>Propose to remove a plugin from the DAO.</div> : ""
                  }
                  <TrainingTooltip overlay="The title is the header of the proposal card and will be the first visible information about your proposal" placement="right">
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
                    placeholder="Summarize your proposal"
                    name="title"
                    type="text"
                    className={touched.title && errors.title ? css.error : null}
                  />

                  <TrainingTooltip overlay={fnDescription} placement="right">
                    <label htmlFor="descriptionInput">
                      <div className={css.requiredMarker}>*</div>
                    Description
                      <img className={css.infoTooltip} src="/assets/images/Icon/Info.svg"/>
                      <ErrorMessage name="description">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                    </label>
                  </TrainingTooltip>
                  <Field
                    component={MarkdownField}
                    onChange={(value: any) => { setFieldValue("description", value); }}
                    id="descriptionInput"
                    placeholder="Describe your proposal in greater detail"
                    name="description"
                    className={touched.description && errors.description ? css.error : null}
                  />

                  <TrainingTooltip overlay="Add some tags to give context about your proposal e.g. idea, signal, bounty, research, etc" placement="right">
                    <label className={css.tagSelectorLabel}>
                    Tags
                    </label>
                  </TrainingTooltip>

                  <div className={css.tagSelectorContainer}>
                    <TagsSelector onChange={this.onTagsChange} tags={this.state.tags}></TagsSelector>
                  </div>

                  <TrainingTooltip overlay="Link to the fully detailed description of your proposal" placement="right">
                    <label htmlFor="urlInput">
                    URL
                      <ErrorMessage name="url">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
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

                  <div className={css.addEditSchemeFields}>
                    <div className={css.addSchemeSelectContainer}>
                      <label htmlFor="schemeToAddInput">
                        <div className={css.requiredMarker}>*</div>
                        Plugin
                        <ErrorMessage name="schemeToAdd">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      </label>
                      <Field
                        id="schemeToAddInput"
                        placeholder="Enter plugin address"
                        name="schemeToAdd"
                        onChange={(e: any) => {
                          // call the built-in handleChange
                          handleChange(e);
                          this.handleChangeScheme(e);
                        }}
                      />
                    </div>

                    <div className={css.editSchemeSelectContainer}>
                      <label htmlFor="schemeToEditInput">
                        <div className={css.requiredMarker}>*</div>
                        Plugin
                        <ErrorMessage name="schemeToEdit">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      </label>
                      <Field
                        id="schemeToEditInput"
                        name="schemeToEdit"
                        component="select"
                        className={css.schemeSelect}
                        onChange={(e: any) => {
                          // call the built-in handleChange
                          handleChange(e);
                          this.handleChangeScheme(e);
                        }}
                      >
                        <option value="">Select a plugin...</option>
                        {schemes.map((scheme, _i) => {
                          return <option key={`edit_scheme_${scheme.staticState.address}`} value={scheme.staticState.address}>{schemeNameAndAddress(scheme.staticState.address)}</option>;
                        })}
                      </Field>
                    </div>

                    <div className={css.parametersHash}>
                      <label htmlFor="parametersHashInput">
                        <div className={css.requiredMarker}>*</div>
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
                        <Field
                          id="registerOtherSchemesInput"
                          type="checkbox"
                          name="permissions.registerSchemes"
                          checked={requiredPermissions & SchemePermissions.CanRegisterSchemes || values.permissions.registerSchemes}
                          disabled={requiredPermissions & SchemePermissions.CanRegisterSchemes}
                        />
                        <label htmlFor="registerOtherSchemesInput">
                          Register other plugins
                        </label>
                      </div>

                      <div className={css.permissionCheckbox}>
                        <Field
                          id="changeConstraintsInput"
                          type="checkbox"
                          name="permissions.changeConstraints"
                          checked={requiredPermissions & SchemePermissions.CanAddRemoveGlobalConstraints || values.permissions.changeConstraints}
                          disabled={requiredPermissions & SchemePermissions.CanAddRemoveGlobalConstraints}
                        />
                        <label htmlFor="changeConstraintsInput">
                          Add/remove global constraints
                        </label>
                      </div>

                      <div className={css.permissionCheckbox}>
                        <Field
                          id="upgradeControllerInput"
                          type="checkbox"
                          name="permissions.upgradeController"
                          checked={requiredPermissions & SchemePermissions.CanUpgradeController || values.permissions.upgradeController}
                          disabled={requiredPermissions & SchemePermissions.CanUpgradeController}
                        />
                        <label htmlFor="upgradeControllerInput">
                          Upgrade the controller
                        </label>
                      </div>

                      <div className={css.permissionCheckbox}>
                        <Field
                          id="genericCallInput"
                          type="checkbox"
                          name="permissions.genericCall"
                          checked={requiredPermissions & SchemePermissions.CanCallDelegateCall || values.permissions.genericCall}
                          disabled={requiredPermissions & SchemePermissions.CanCallDelegateCall}
                        />
                        <label htmlFor="genericCallInput">
                          Call genericCall on behalf of
                        </label>
                      </div>

                      <div className={css.permissionCheckbox}>
                        <Field id="mintBurnReputation" type="checkbox" name="mintBurnReputation" disabled="disabled" checked="checked" />
                        <label htmlFor="mintBurnReputation">
                          Mint or burn reputation
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className={css.removeSchemeFields}>
                    <div className={css.removeSchemeSelectContainer}>
                      <label htmlFor="schemeToRemoveInput">
                        <div className={css.requiredMarker}>*</div>
                        Plugin
                        <ErrorMessage name="schemeToRemove">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      </label>
                      <Field
                        id="schemeToRemoveInput"
                        name="schemeToRemove"
                        component="select"
                        className={css.schemeSelect}
                      >
                        <option value="">Select a plugin...</option>
                        {schemes.map((scheme, _i) => {
                          return <option key={`remove_scheme_${scheme.staticState.address}`} value={scheme.staticState.address}>{schemeNameAndAddress(scheme.staticState.address)}</option>;
                        })}
                      </Field>
                    </div>
                  </div>

                  <div className={css.createProposalActions}>
                    <TrainingTooltip overlay="Export proposal" placement="top">
                      <button id="export-proposal" className={css.exportProposal} type="button" onClick={() => this.exportFormValues(values)}>
                        <img src="/assets/images/Icon/share-blue.svg" />
                      </button>
                    </TrainingTooltip>
                    <button className={css.exitProposalCreation} type="button" onClick={handleClose}>
                      Cancel
                    </button>
                    <TrainingTooltip overlay="Once the proposal is submitted it cannot be edited or deleted" placement="top">
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

const SubscribedCreateSchemeRegistrarProposal = withSubscription({
  wrappedComponent: CreateSchemeRegistrarProposal,
  loadingComponent: <Loading/>,
  errorComponent: null,
  checkForUpdate: ["daoAvatarAddress"],
  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    return arc.dao(props.daoAvatarAddress).schemes();
  },
});

export default connect(null, mapDispatchToProps)(SubscribedCreateSchemeRegistrarProposal);
