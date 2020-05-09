/* eslint-disable no-bitwise */
import { enableWalletProvider, getArc } from "arc";

import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import TagsSelector from "components/Proposal/Create/PluginForms/TagsSelector";
import TrainingTooltip from "components/Shared/TrainingTooltip";

import { createProposal } from "actions/arcActions";
import { showNotification, NotificationStatus } from "reducers/notifications";
import Analytics from "lib/analytics";
import { isValidUrl, isAddress } from "lib/util";
import { GetPluginIsActiveActions, getPluginIsActive, REQUIRED_PLUGIN_PERMISSIONS, pluginNameAndAddress, PluginPermissions } from "lib/pluginUtils";
import { exportUrl, importUrlValues } from "lib/proposalUtils";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import classNames from "classnames";
import { ProposalName, IPluginState, AnyPlugin } from "@daostack/arc.js";
import { connect } from "react-redux";
import * as React from "react";
import * as css from "../CreateProposal.scss";
import MarkdownField from "./MarkdownField";

interface IExternalProps {
  daoAvatarAddress: string;
  handleClose: () => any;
  pluginState: IPluginState;
}

interface IDispatchProps {
  createProposal: typeof createProposal;
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  createProposal,
  showNotification,
};

type IProps = IExternalProps & IDispatchProps & ISubscriptionProps<AnyPlugin[]>;

interface IFormValues {
  description: string;
  otherPlugin: string;
  parametersHash: string;
  permissions: {
    registerPlugins: boolean;
    changeConstraints: boolean;
    upgradeController: boolean;
    genericCall: boolean;
  };
  pluginToAdd: string;
  pluginToRemove: string;
  title: string;
  url: string;

  [key: string]: any;
}

interface IState {
  currentTab: string;
  tags: Array<string>;
  requiredPermissions: number;
}

class CreatePluginRegistrarProposal extends React.Component<IProps, IState> {

  initialFormValues: IFormValues;

  constructor(props: IProps) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.initialFormValues = importUrlValues<IFormValues>({
      description: "",
      otherPlugin: "",
      pluginToAdd: "",
      pluginToRemove: "",
      parametersHash: "",
      permissions: {
        registerPlugins: false,
        changeConstraints: false,
        upgradeController: false,
        genericCall: false,
      },
      title: "",
      url: "",
      currentTab: "addPlugin",
      tags: [],
    });
    this.state = {
      currentTab: this.initialFormValues.currentTab,
      tags: this.initialFormValues.tags,
      requiredPermissions: 0,
    };
  }

  public handleChangePlugin = (e: any) => {
    const arc = getArc();
    try {
      // If we know about this contract then require the minimum permissions for it
      const contractInfo = arc.getContractInfo(e.target.value);
      this.setState({ requiredPermissions: REQUIRED_PLUGIN_PERMISSIONS[contractInfo.name] });
      /* eslint-disable-next-line no-empty */
    } catch (e) {}
  }

  public async handleSubmit(values: IFormValues, { setSubmitting }: any ):  Promise<void> {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    let permissions = 1;
    if (values.permissions.registerPlugins) {
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
    let proposalType: ProposalName;
    if (this.state.currentTab  === "removePlugin") {
      proposalType = "SchemeRegistrarRemove";
    } else {
      proposalType = "SchemeRegistrarAdd";
    }
    const proposalValues = {
      ...values,
      dao: this.props.daoAvatarAddress,
      type: proposalType,
      parametersHash: values.parametersHash,
      permissions: "0x" + permissions.toString(16).padStart(8, "0"),
      plugin: this.props.pluginState.address,
      pluginToRegister: currentTab === "addPlugin" ?
        values.pluginToAdd :
        values.pluginToRemove,
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
    // "plugins" are the plugins registered in this DAO
    const plugins = this.props.data;
    const { handleClose } = this.props;

    const { currentTab, requiredPermissions } = this.state;

    const addPluginButtonClass = classNames({
      [css.addPluginButton]: true,
      [css.selected]: currentTab === "addPlugin",
    });
    const removePluginButtonClass = classNames({
      [css.selected]: currentTab === "removePlugin",
    });

    const pluginRegistrarFormClass = classNames({
      [css.formWrapper]: true,
      [css.addPlugin]: currentTab === "addPlugin",
      [css.removePlugin]: currentTab === "removePlugin",
    });

    const isAddActive = getPluginIsActive(this.props.pluginState, GetPluginIsActiveActions.Register);
    const isRemoveActive = getPluginIsActive(this.props.pluginState, GetPluginIsActiveActions.Remove);
    const fnDescription = () => (<span>Short description of the proposal.<ul><li>What are you proposing to do?</li><li>Why is it important?</li><li>How much will it cost the DAO?</li><li>When do you plan to deliver the work?</li></ul></span>);

    return (
      <div className={css.createWrapperWithSidebar}>
        <div className={css.sidebar}>
          { isAddActive ?
            <button className={addPluginButtonClass} onClick={this.handleTabClick("addPlugin")} data-test-id="tab-AddPlugin">
              <span></span>
              Add Plugin
            </button>
            : "" }
          { isRemoveActive ?
            <button className={removePluginButtonClass} onClick={this.handleTabClick("removePlugin")} data-test-id="tab-RemovePlugin">
              <span></span>
            Remove Plugin
            </button>
            : "" }
        </div>

        <div className={pluginRegistrarFormClass}>
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

              if (currentTab === "addPlugin") {
                require("pluginToAdd");
                require("parametersHash");
              } else if (currentTab === "removePlugin") {
                require("pluginToRemove");
              }

              if (currentTab === "addPlugin" && values.otherPlugin && !isAddress(values.otherPlugin)) {
                errors.otherPlugin = "Invalid address";
              }

              const parametersHashPattern = /0x([\da-f]){64}/i;
              if (currentTab !== "removePlugin" && values.parametersHash && !parametersHashPattern.test(values.parametersHash)) {
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
                  { (currentTab === "addPlugin") ?
                    <div className={css.description}>Propose to add a new plugin to the DAO.</div> :
                      (currentTab === "removePlugin") ?
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

                  <div className={css.addEditPluginFields}>
                    <div className={css.addPluginSelectContainer}>
                      <label htmlFor="pluginToAddInput">
                        <div className={css.requiredMarker}>*</div>
                        Plugin
                        <ErrorMessage name="pluginToAdd">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      </label>
                      <Field
                        id="pluginToAddInput"
                        placeholder="Enter plugin address"
                        name="pluginToAdd"
                        onChange={(e: any) => {
                          // call the built-in handleChange
                          handleChange(e);
                          this.handleChangePlugin(e);
                        }}
                      />
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
                          id="registerOtherPluginsInput"
                          type="checkbox"
                          name="permissions.registerPlugins"
                          checked={requiredPermissions & PluginPermissions.CanRegisterPlugins || values.permissions.registerPlugins}
                          disabled={requiredPermissions & PluginPermissions.CanRegisterPlugins}
                        />
                        <label htmlFor="registerOtherPluginsInput">
                          Register other plugins
                        </label>
                      </div>

                      <div className={css.permissionCheckbox}>
                        <Field
                          id="changeConstraintsInput"
                          type="checkbox"
                          name="permissions.changeConstraints"
                          checked={requiredPermissions & PluginPermissions.CanAddRemoveGlobalConstraints || values.permissions.changeConstraints}
                          disabled={requiredPermissions & PluginPermissions.CanAddRemoveGlobalConstraints}
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
                          checked={requiredPermissions & PluginPermissions.CanUpgradeController || values.permissions.upgradeController}
                          disabled={requiredPermissions & PluginPermissions.CanUpgradeController}
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
                          checked={requiredPermissions & PluginPermissions.CanCallDelegateCall || values.permissions.genericCall}
                          disabled={requiredPermissions & PluginPermissions.CanCallDelegateCall}
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

                  <div className={css.removePluginFields}>
                    <div className={css.removePluginSelectContainer}>
                      <label htmlFor="schemeToRemoveInput">
                        <div className={css.requiredMarker}>*</div>
                        Plugin
                        <ErrorMessage name="pluginToRemove">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      </label>
                      <Field
                        id="pluginToRemoveInput"
                        name="pluginToRemove"
                        component="select"
                        className={css.pluginSelect}
                      >
                        <option value="">Select a plugin...</option>
                        {plugins.map((plugin, _i) => {
                          return <option key={`remove_plugin_${plugin.coreState.address}`} value={plugin.coreState.address}>{pluginNameAndAddress(plugin.coreState.address)}</option>;
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

const SubscribedCreatePluginRegistrarProposal = withSubscription({
  wrappedComponent: CreatePluginRegistrarProposal,
  loadingComponent: <Loading/>,
  errorComponent: null,
  checkForUpdate: ["daoAvatarAddress"],
  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    return arc.dao(props.daoAvatarAddress).plugins();
  },
});

export default connect(null, mapDispatchToProps)(SubscribedCreatePluginRegistrarProposal);
