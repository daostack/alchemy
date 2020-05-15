/* eslint-disable no-bitwise */
import { enableWalletProvider, getArc } from "arc";

import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import TagsSelector from "components/Proposal/Create/PluginForms/TagsSelector";
import TrainingTooltip from "components/Shared/TrainingTooltip";

import { createProposal } from "actions/arcActions";
import { showNotification, NotificationStatus } from "reducers/notifications";
import Analytics from "lib/analytics";
import { isValidUrl } from "lib/util";
import { GetPluginIsActiveActions, getPluginIsActive, REQUIRED_PLUGIN_PERMISSIONS, pluginNameAndAddress, PluginPermissions, PLUGIN_NAMES } from "lib/pluginUtils";
import { exportUrl, importUrlValues } from "lib/proposalUtils";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import classNames from "classnames";
import { IPluginState, AnyPlugin, IProposalCreateOptionsPM, LATEST_ARC_VERSION, NULL_ADDRESS } from "@dorgtech/arc.js";
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
type ITab = 'addPlugin' | 'replacePlugin' | 'removePlugin'
type PluginNames = keyof typeof PLUGIN_NAMES

interface IFormValues {
  description: string
  pluginData: string
  permissions: {
    registerPlugins: boolean;
    changeConstraints: boolean;
    upgradeController: boolean;
    genericCall: boolean;
  };
  pluginName: PluginNames | '';
  pluginToReplace: string;
  title: string;
  url: string;

  [key: string]: any;
}

interface IState {
  currentTab: ITab;
  tags: Array<string>;
  requiredPermissions: number;
}

class CreatePluginFactoryProposal extends React.Component<IProps, IState> {

  initialFormValues: IFormValues;

  constructor(props: IProps) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.initialFormValues = importUrlValues<IFormValues>({
      description: "",
      pluginData: "",
      pluginName: "",
      pluginToReplace: "",
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
      const contractInfo = arc.getContractInfoByName(e.target.value, LATEST_ARC_VERSION);
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

    const packageVersion = [0, 1, Number(LATEST_ARC_VERSION.split('.').slice(-1)[0])]

    const currentTab = this.state.currentTab;

    const proposalOptions: IProposalCreateOptionsPM = {
      description: values.description,
      packageVersion,
      pluginData: values.pluginData,
      dao: this.props.daoAvatarAddress,
      permissions: "0x" + permissions.toString(16).padStart(8, "0"),
      plugin: this.props.pluginState.address,
      tags: this.state.tags,
      pluginName: values.pluginName,
      pluginToReplace: values.pluginToReplace
    }

    if(currentTab === 'removePlugin') {
      proposalOptions.pluginName = ''
    } else if(currentTab === 'addPlugin') {
      proposalOptions.pluginToReplace = NULL_ADDRESS
    }
    
    setSubmitting(false);
    
    await this.props.createProposal(proposalOptions);

    Analytics.track("Submit Proposal", {
      "DAO Address": this.props.daoAvatarAddress,
      "Proposal Title": values.title,
      "Plugin Address": this.props.pluginState.address,
      "Plugin Name": this.props.pluginState.name,
    });

    this.props.handleClose();
  }

  public handleTabClick = (tab: ITab) => (_e: any) => {
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
    const replacePluginButtonClass = classNames({
      [css.selected]: currentTab === "replacePlugin",
    });

    const pluginFactoryFormClass = classNames({
      [css.addPlugin]: currentTab === "addPlugin",
      [css.removePlugin]: currentTab === "removePlugin",
      [css.replacePlugin]: currentTab === "replacePlugin",
    });

    const isAddActive = getPluginIsActive(this.props.pluginState, GetPluginIsActiveActions.Register);
    const isRemoveActive = getPluginIsActive(this.props.pluginState, GetPluginIsActiveActions.Remove);
    const isReplaceActive = getPluginIsActive(this.props.pluginState, GetPluginIsActiveActions.Replace)
    const fnDescription = () => (<span>Short description of the proposal.<ul><li>What are you proposing to do?</li><li>Why is it important?</li><li>How much will it cost the DAO?</li><li>When do you plan to deliver the work?</li></ul></span>);

    return (
      <div className={css.containerWithSidebar}>
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
          { isReplaceActive ?
            <button className={replacePluginButtonClass} onClick={this.handleTabClick("replacePlugin")} data-test-id="tab-ReplacePlugin">
              <span></span>
            Replace Plugin
            </button>
            : "" }
        </div>

        <div className={pluginFactoryFormClass}>
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
                require("pluginName");
                require("pluginData");
              } else if (currentTab === "removePlugin") {
                require("pluginToReplace");
              } else if (currentTab === "replacePlugin") {
                require("pluginName")
                require("pluginData");
                require("pluginToReplace");
              }

              const plguinData = /0x([\da-f]){64}/i;
              if (currentTab !== "removePlugin" && values.pluginData && !plguinData.test(values.pluginData)) {
                errors.pluginData = "Invalid parameters hash";
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
                      <div className={css.description}>Propose to remove a plugin from the DAO.</div> :
                        (currentTab === "replacePlugin") ?
                        <div className={css.description}>Propose to replace a plugin from the DAO.</div> : ""
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
                      <label htmlFor="pluginNameInput">
                        <div className={css.requiredMarker}>*</div>
                        Plugin
                        <ErrorMessage name="pluginName">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      </label>
                      <Field
                        id="pluginNameInput"
                        name="pluginName"
                        component="select"
                        className={css.pluginSelect}
                        onChange={(e: any) => {
                          // call the built-in handleChange
                          handleChange(e);
                          this.handleChangePlugin(e);
                        }}
                      >
                        <option value="">Select a plugin...</option>
                        {Object.values(PLUGIN_NAMES).map((name, _i) => {
                          return <option key={`add_plugin_${name}`} value={name}>{name}</option>;
                        })}
                      </Field>
                    </div>

                    <div className={css.parametersHash}>
                      <label htmlFor="pluginDataInput">
                        <div className={css.requiredMarker}>*</div>
                        Parameters Hash
                        <ErrorMessage name="pluginData">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      </label>
                      <Field
                        id="pluginDataInput"
                        placeholder="e.g. 0x0000000000000000000000000000000000000000000000000000000000001234"
                        name="pluginData"
                        className={touched.pluginData && errors.pluginData ? css.error : null}
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
                        <ErrorMessage name="pluginToReplace">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      </label>
                      <Field
                        id="pluginToReplaceInput"
                        name="pluginToReplace"
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

                  <div className={css.replacePluginFields}>
                    <div className={css.replacePluginSelectContainer}>
                    <label htmlFor="replacepluginToReplaceInput">
                        <div className={css.requiredMarker}>*</div>
                        Plugin to replace
                        <ErrorMessage name="pluginToReplace">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      </label>
                      <Field
                        id="replacepluginToReplaceInput"
                        name="pluginToReplace"
                        component="select"
                        className={css.pluginSelect}
                      >
                        <option value="">Select a plugin...</option>
                        {plugins.map((plugin, _i) => {
                          return <option key={`remove_plugin_${plugin.coreState.address}`} value={plugin.coreState.address}>{pluginNameAndAddress(plugin.coreState.address)}</option>;
                        })}
                      </Field>
                      <label htmlFor="replacePluginAddNameInput">
                        <div className={css.requiredMarker}>*</div>
                        Plugin to add
                        <ErrorMessage name="pluginName">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      </label>
                      <Field
                        id="replacePluginAddNameInput"
                        name="pluginName"
                        component="select"
                        className={css.pluginSelect}
                        onChange={(e: any) => {
                          // call the built-in handleChange
                          handleChange(e);
                          this.handleChangePlugin(e);
                        }}
                      >
                        <option value="">Select a plugin...</option>
                        {Object.values(PLUGIN_NAMES).map((name, _i) => {
                          return <option key={`add_plugin_${name}`} value={name}>{name}</option>;
                        })}
                      </Field>
                    </div>

                    <div className={css.parametersHash}>
                      <label htmlFor="replacePluginDataInput">
                        <div className={css.requiredMarker}>*</div>
                        Parameters Hash
                        <ErrorMessage name="pluginData">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      </label>
                      <Field
                        id="replacePluginDataInput"
                        placeholder="e.g. 0x0000000000000000000000000000000000000000000000000000000000001234"
                        name="pluginData"
                        className={touched.pluginData && errors.pluginData ? css.error : null}
                      />
                    </div>
                    <div className={css.permissions}>
                      <div className={css.permissionsLabel}>
                        Permissions
                      </div>
                      <div className={css.permissionCheckbox}>
                        <Field
                          id="replaceRegisterOtherPluginsInput"
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
                          id="replaceChangeConstraintsInput"
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
                          id="replaceUpgradeControllerInput"
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
                          id="replaceGenericCallInput"
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
                        <Field id="replaceMintBurnReputation" type="checkbox" name="mintBurnReputation" disabled="disabled" checked="checked" />
                        <label htmlFor="mintBurnReputation">
                          Mint or burn reputation
                        </label>
                      </div>
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

const SubscribedCreatePluginFactoryProposal = withSubscription({
  wrappedComponent: CreatePluginFactoryProposal,
  loadingComponent: <Loading/>,
  errorComponent: null,
  checkForUpdate: ["daoAvatarAddress"],
  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    return arc.dao(props.daoAvatarAddress).plugins();
  },
});

export default connect(null, mapDispatchToProps)(SubscribedCreatePluginFactoryProposal);
