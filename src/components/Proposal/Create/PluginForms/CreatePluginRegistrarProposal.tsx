/* eslint-disable no-bitwise */
import { enableWalletProvider, getArc } from "arc";

import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import TagsSelector from "components/Proposal/Create/PluginForms/TagsSelector";
import TrainingTooltip from "components/Shared/TrainingTooltip";

import { createProposal } from "actions/arcActions";
import { showNotification } from "reducers/notifications";
import Analytics from "lib/analytics";
import { isValidUrl, isAddress } from "lib/util";
import { GetPluginIsActiveActions, getPluginIsActive, REQUIRED_PLUGIN_PERMISSIONS, pluginNameAndAddress, PluginPermissions } from "lib/pluginUtils";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import classNames from "classnames";
import { ProposalName, IPluginState, AnyPlugin } from "@daostack/arc.js";
import { connect } from "react-redux";
import * as React from "react";
import * as css from "../CreateProposal.scss";
import MarkdownField from "./MarkdownField";
import HelpButton from "components/Shared/HelpButton";
import i18next from "i18next";
import { IFormModalService, CreateFormModalService } from "components/Shared/FormModalService";
import ResetFormButton from "components/Proposal/Create/PluginForms/ResetFormButton";

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

type TabId = "addPlugin" | "removePlugin";

interface IState {
  currentTab: TabId;
  requiredPermissions: number;
  showForm: boolean;
  tags: Array<string>;
}


const defaultValues: IFormValues = Object.freeze({
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

class CreatePluginRegistrarProposal extends React.Component<IProps, IState> {

  formModalService: IFormModalService<IFormValues>;
  currentFormValues: IFormValues;

  constructor(props: IProps) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.state = {
      currentTab: defaultValues.currentTab,
      requiredPermissions: 0,
      showForm: false,
      tags: [],
    };
    this.formModalService = CreateFormModalService(
      "CreatePluginRegistrarProposal",
      defaultValues,
      () => Object.assign(this.currentFormValues, this.state),
      (formValues: IFormValues, firstTime: boolean) => {
        this.currentFormValues = formValues;
        if (firstTime) { Object.assign(this.state, {
          currentTab: formValues.currentTab,
          requiredPermissions: formValues.requiredPermissions,
          tags: formValues.tags,
        }); }
        else { this.setState({ tags: formValues.tags, requiredPermissions: formValues.requiredPermissions }); }
      },
      this.props.showNotification);
  }

  componentWillUnmount() {
    this.formModalService.saveCurrentValues();
  }

  public handleChangePlugin = (e: any) => {
    const arc = getArc();
    try {
      // If we know about this contract then require the minimum permissions for it
      const contractInfo = arc.getContractInfo(e.target.value);
      this.setState({ requiredPermissions: REQUIRED_PLUGIN_PERMISSIONS[contractInfo.name] });
      /* eslint-disable-next-line no-empty */
    } catch (e) { }
  }

  public async handleSubmit(values: IFormValues, { setSubmitting }: any): Promise<void> {
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
    let type: ProposalName;
    if (this.state.currentTab === "removePlugin") {
      type = "SchemeRegistrarRemove";
    } else {
      type = "SchemeRegistrarAdd";
    }

    const proposalValues = {
      ...values,
      dao: this.props.daoAvatarAddress,
      type,
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

  public handleTabClick = (tab: TabId) => (_e: any) => {
    this.setState({ currentTab: tab });
  }

  private onTagsChange = (tags: any[]): void => {
    this.setState({ tags });
  }

  private toggleShowForm = () => {
    this.setState({ showForm: !this.state.showForm });
  }

  public render(): RenderOutput {
    // "plugins" are the plugins registered in this DAO
    const plugins = this.props.data;
    const { handleClose } = this.props;

    const { currentTab, requiredPermissions, showForm } = this.state;

    const addPluginButtonClass = classNames({
      [css.addPluginButton]: true,
      [css.selected]: currentTab === "addPlugin",
    });
    const removePluginButtonClass = classNames({
      [css.selected]: currentTab === "removePlugin",
    });

    const contentWrapperClass = classNames({
      [css.contentWrapper]: true,
      [css.addPlugin]: currentTab === "addPlugin",
      [css.removePlugin]: currentTab === "removePlugin",
    });

    const formContentClass = classNames({
      [css.hidden]: !showForm && currentTab !== "removePlugin",
    });

    const isAddActive = getPluginIsActive(this.props.pluginState, GetPluginIsActiveActions.Register);
    const isRemoveActive = getPluginIsActive(this.props.pluginState, GetPluginIsActiveActions.Remove);

    return (
      <div className={css.containerWithSidebar}>
        <div className={css.sidebar}>
          {isAddActive ?
            <button className={addPluginButtonClass} onClick={this.handleTabClick("addPlugin")} data-test-id="tab-AddPlugin">
              <span></span>
              Add Plugin
            </button>
            : ""}
          {isRemoveActive ?
            <button className={removePluginButtonClass} onClick={this.handleTabClick("removePlugin")} data-test-id="tab-RemovePlugin">
              <span></span>
            Remove Plugin
            </button>
            : ""}
        </div>

        <div className={contentWrapperClass}>
          {
            currentTab !== "removePlugin" ?

              <div className={css.helpText}>
                {
                  currentTab === "addPlugin" ?
                    <>
                      <p>You will soon be able to add plugins from this interface. Stay tuned!</p>
                      <p>For now, <b>please contact us at</b> <a href="mailto:support@daostack.zendesk.com" target="_blank" rel="noopener noreferrer">support@daostack.zendesk.com</a> to get one of the following plugins added to your DAO, or to add a new custom plugin of your own creation.</p>

                      <h2>Available Plugins</h2>
                      <p><b>Funding and Voting Power Plugin</b> &mdash; Send token and Reputation rewards to any Ethereum address via proposal.</p>
                      <p><b>Plugin Manager</b> &mdash; Remove plugins via proposal (adding and editing plugins to be added soon).</p>
                      <p><b>Competition Plugin</b> &mdash; Create competitions with prizes split between any number of winners. Competitions accept submissions from anyone, and Reputation-holders vote to decide the winners.</p>
                      <p><b>ENS Plugins</b> &mdash; A set of plugins that enables the DAO to control Ethereum Name Service addresses via proposals.</p>
                      <p><b>Reputation from Token</b> &mdash; Allow anyone to redeem Reputation using a token of your choice.</p>
                      <p><b>Stake for Reputation Plugin</b> &mdash; Allow anyone to stake a token of your choice to earn voting power in your DAO.</p>
                      <p><b>Bounties Plugins</b> &mdash; Via proposal, create DAO-administered bounties on Bounties Network.</p>
                      <p><b>Join and Quit Plugins</b> &mdash; Allow anyone to join the DAO via a donation and quit anytime, reclaiming at least part of their original funds (“rage quit”). Coming soon.</p>
                      <p><b>NFT Plugins</b> &mdash; Allow the DAO to hold, send, mint, and sell NFTs (non-fungible tokens). Coming soon.</p>

                      <p><b>Need help creating a plugin not on this list?</b> Contact us at <a href="mailto:support@daostack.zendesk.com">support@daostack.zendesk.com</a></p>
                    </>

                    :
                    <>
                      <p>You will soon be able to edit plugins in this interface. Stay tuned!</p>
                      <p>For now, <b>please contact us at</b> <a href="mailto:support@daostack.zendesk.com" target="_blank" rel="noopener noreferrer">support@daostack.zendesk.com</a> to get help editing the parameters of this plugin.</p>
                    </>
                }

                <button id="showFormButton" className={css.showFormButton} onClick={this.toggleShowForm}>{showForm ? "Hide" : "Show"} proposal form</button>

              </div>
              : ""
          }

          <div className={formContentClass}>
            <Formik
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              initialValues={this.currentFormValues}
              // eslint-disable-next-line react/jsx-no-bind
              validate={(values: IFormValues) => {

                this.currentFormValues = values;

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
                } else {
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
                resetForm,
                isSubmitting,
                setFieldValue,
                values,
              }: FormikProps<IFormValues>) => {
                return (
                  <Form noValidate>
                    <br />
                    {(currentTab === "addPlugin") ?
                      <div className={css.description}>Create a proposal to add a new plugin to the DAO.</div> :
                      <div className={css.description}>Create a proposal to remove a plugin from the DAO.</div>
                    }
                    <TrainingTooltip overlay={i18next.t("Title Tooltip")} placement="right">
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

                    <TrainingTooltip overlay={i18next.t("Tags Tooltip")} placement="right">
                      <label className={css.tagSelectorLabel}>
                        Tags
                      </label>
                    </TrainingTooltip>

                    <div className={css.tagSelectorContainer}>
                      <TagsSelector onChange={this.onTagsChange} tags={this.state.tags}></TagsSelector>
                    </div>

                    <TrainingTooltip overlay={i18next.t("URL Tooltip")} placement="right">
                      <label htmlFor="urlInput">
                        URL
                        <ErrorMessage name="url">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      </label>
                    </TrainingTooltip>
                    <Field
                      id="urlInput"
                      maxLength={120}
                      placeholder={i18next.t("URL Placeholder")}
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
                          // eslint-disable-next-line react/jsx-no-bind
                          onChange={(e: any) => {
                            // call the built-in handleChange
                            handleChange(e);
                            this.handleChangePlugin(e);
                          }}
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
                            Mint and burn reputation, send ETH and external &amp; native tokens
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className={css.removePluginFields}>
                      <div className={css.removePluginSelectContainer}>
                        <label htmlFor="pluginToRemoveInput">
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
                      <TrainingTooltip overlay={i18next.t("Export Proposal Tooltip")} placement="top">
                        <button id="export-proposal" className={css.exportProposal} type="button" onClick={this.formModalService.sendFormValuesToClipboard}>
                          <img src="/assets/images/Icon/share-blue.svg" />
                        </button>
                      </TrainingTooltip>
                      <button className={css.exitProposalCreation} type="button" onClick={handleClose}>
                        Cancel
                      </button>

                      <ResetFormButton
                        resetToDefaults={this.formModalService.resetToDefaults(resetForm)}
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
      </div>
    );
  }
}

const SubscribedCreatePluginRegistrarProposal = withSubscription({
  wrappedComponent: CreatePluginRegistrarProposal,
  loadingComponent: <Loading />,
  errorComponent: null,
  checkForUpdate: ["daoAvatarAddress"],
  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    return arc.dao(props.daoAvatarAddress).plugins({ where: { isRegistered: true } });
  },
});

export default connect(null, mapDispatchToProps)(SubscribedCreatePluginRegistrarProposal);
