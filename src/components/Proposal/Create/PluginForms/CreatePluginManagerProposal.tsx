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
import { GetPluginIsActiveActions, getPluginIsActive, REQUIRED_PLUGIN_PERMISSIONS, pluginNameAndAddress, PLUGIN_NAMES } from "lib/pluginUtils";
import { exportUrl, importUrlValues } from "lib/proposalUtils";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import classNames from "classnames";
import { IPluginState, AnyPlugin, IProposalCreateOptionsPM, LATEST_ARC_VERSION } from "@dorgtech/arc.js";
import { connect } from "react-redux";
import * as React from "react";
import * as css from "../CreateProposal.scss";
import MarkdownField from "./MarkdownField";
import { InitializeParametersFields } from "./InitializeParameterFields";

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
type ITab = "addPlugin" | "replacePlugin" | "removePlugin"
type PluginNames = keyof typeof PLUGIN_NAMES

interface IPermissions {
  registerPlugins: boolean;
  changeConstraints: boolean;
  upgradeController: boolean;
  genericCall: boolean;
}

interface IGenesisProtocolFormValues {
  queuedVoteRequiredPercentage: number;
  queuedVotePeriodLimit: number;
  boostedVotePeriodLimit: number;
  preBoostedVotePeriodLimit: number;
  thresholdConst: number;
  quietEndingPeriod: number;
  proposingRepReward: number;
  votersReputationLossRatio: number;
  minimumDaoBounty: number;
  daoBountyConst: number;
  activationTime: number;
  voteOnBehalf: string;
  voteParamsHash: string;
}

const gpFormValuesToVotingParams = (genesisProtocolParams: IGenesisProtocolFormValues) => [
  genesisProtocolParams.queuedVoteRequiredPercentage,
  genesisProtocolParams.queuedVotePeriodLimit,
  genesisProtocolParams.boostedVotePeriodLimit,
  genesisProtocolParams.preBoostedVotePeriodLimit,
  genesisProtocolParams.thresholdConst,
  genesisProtocolParams.quietEndingPeriod,
  genesisProtocolParams.proposingRepReward,
  genesisProtocolParams.votersReputationLossRatio,
  genesisProtocolParams.minimumDaoBounty,
  genesisProtocolParams.daoBountyConst,
  genesisProtocolParams.activationTime,
];

export interface IFormValues {
  description: string;

  currentTab: ITab;
  tags: Array<string>;
  title: string;
  url: string;
  pluginToRemove: string;
  pluginToAdd: PluginNames | "";
  GenericScheme: {
    permissions: IPermissions;
    votingParams: IGenesisProtocolFormValues;
    contractToCall: string;
  };
  ContributionReward: {
    permissions: IPermissions;
    votingParams: IGenesisProtocolFormValues;
  };
  Competition: {
    permissions: IPermissions;
    votingParams: IGenesisProtocolFormValues;
  };
  ContributionRewardExt: {
    permissions: IPermissions;
    votingParams: IGenesisProtocolFormValues;
    rewarderName: string;
  };
  FundingRequest: {
    permissions: IPermissions;
    votingParams: IGenesisProtocolFormValues;
    fundingToken: string;
  };
  JoinAndQuit: {
    permissions: IPermissions;
    votingParams: IGenesisProtocolFormValues;
    fundingToken: string;
    minFeeToJoin: number;
    memberReputation: number;
    fundingGoal: number;
    fundingGoalDeadline: number;
    rageQuitEnable: boolean;
  };
  SchemeRegistrar: {
    permissions: IPermissions;
    votingParamsRegister: IGenesisProtocolFormValues;
    votingParamsRemove: IGenesisProtocolFormValues;
  };
  SchemeFactory: {
    permissions: IPermissions;
    votingParams: IGenesisProtocolFormValues;
  };
  ReputationFromToken: {
    permissions: IPermissions;
    tokenContract: string;
    curveInterface: string;
  };
}

interface IState {
  currentTab: ITab;
  tags: Array<string>;
  requiredPermissions: number;
}

class CreatePluginManagerProposal extends React.Component<IProps, IState> {

  initialFormValues: IFormValues;

  constructor(props: IProps) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
    const votingParams: IGenesisProtocolFormValues = {
      queuedVoteRequiredPercentage: 50,
      queuedVotePeriodLimit: 2592000,
      boostedVotePeriodLimit: 345600,
      preBoostedVotePeriodLimit: 86400,
      thresholdConst: 1200,
      quietEndingPeriod: 172800,
      proposingRepReward: 50,
      votersReputationLossRatio: 4,
      minimumDaoBounty: 150,
      daoBountyConst: 10,
      activationTime: 0,
      voteOnBehalf: "0x0000000000000000000000000000000000000000",
      voteParamsHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    };

    this.initialFormValues = importUrlValues<IFormValues>({
      description: "",
      pluginToAdd: "",
      pluginToRemove: "",
      title: "",
      url: "",
      currentTab: "addPlugin",
      tags: [],
      GenericScheme: {
        votingParams: { ...votingParams },
        permissions: {
          registerPlugins: false,
          changeConstraints: false,
          upgradeController: false,
          genericCall: true,
        },
        contractToCall: "",
      },
      ContributionReward: {
        votingParams: { ...votingParams },
        permissions: {
          registerPlugins: false,
          changeConstraints: false,
          upgradeController: false,
          genericCall: false,
        },
      },
      Competition: {
        votingParams: { ...votingParams },
        permissions: {
          registerPlugins: false,
          changeConstraints: false,
          upgradeController: false,
          genericCall: false,
        },
      },
      ContributionRewardExt: {
        votingParams: { ...votingParams },
        permissions: {
          registerPlugins: false,
          changeConstraints: false,
          upgradeController: false,
          genericCall: false,
        },
        rewarderName: "",
      },
      FundingRequest: {
        votingParams: { ...votingParams },
        permissions: {
          registerPlugins: false,
          changeConstraints: false,
          upgradeController: false,
          genericCall: false,
        },
        fundingToken: "0x0000000000000000000000000000000000000000",
      },
      JoinAndQuit: {
        votingParams: { ...votingParams },
        permissions: {
          registerPlugins: false,
          changeConstraints: false,
          upgradeController: false,
          genericCall: false,
        },
        fundingToken: "0x0000000000000000000000000000000000000000",
        minFeeToJoin: 0,
        memberReputation: 0,
        fundingGoal: 0,
        fundingGoalDeadline: 0,
        rageQuitEnable: true,
      },
      SchemeRegistrar: {
        votingParamsRegister: { ...votingParams },
        votingParamsRemove: { ...votingParams },
        permissions: {
          registerPlugins: true,
          changeConstraints: false,
          upgradeController: false,
          genericCall: false,
        },
      },
      SchemeFactory: {
        votingParams: { ...votingParams },
        permissions: {
          registerPlugins: true,
          changeConstraints: false,
          upgradeController: false,
          genericCall: false,
        },
      },
      ReputationFromToken: {
        permissions: {
          registerPlugins: false,
          changeConstraints: false,
          upgradeController: false,
          genericCall: false,
        },
        tokenContract: "0x0000000000000000000000000000000000000000",
        curveInterface: "0x0000000000000000000000000000000000000000",
      },
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

  public async handleSubmit(values: IFormValues, { setSubmitting }: any ): Promise<void> {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    const packageVersion = [0, 1, Number(LATEST_ARC_VERSION.split(".").slice(-1)[0])];

    const currentTab = this.state.currentTab;

    // Build Initialize Params Object
    const arc = getArc();
    const votingMachine = arc.getContractInfoByName("GenesisProtocol", LATEST_ARC_VERSION).address;
    const daoId = this.props.daoAvatarAddress;

    const proposalOptions: IProposalCreateOptionsPM = {
      dao: daoId,
      description: values.description,
      title: values.title,
      tags: this.state.tags,
      plugin: this.props.pluginState.address,
      url: values.url,
    };

    if (currentTab === "removePlugin" || currentTab === "replacePlugin") {
      proposalOptions.remove = {
        plugin: values.pluginToRemove,
      };
    } else if (currentTab === "addPlugin" || currentTab === "replacePlugin") {
      (proposalOptions.add as any) = {
        pluginName: values.pluginToAdd
      };

      switch (proposalOptions.add.pluginName) {
        case "Competition":
          proposalOptions.add.pluginInitParams = {
            daoId: daoId,
            votingMachine: votingMachine,
            votingParams: gpFormValuesToVotingParams(values.Competition.votingParams),
            voteOnBehalf: values.Competition.votingParams.voteOnBehalf,
            voteParamsHash: values.Competition.votingParams.voteParamsHash,
            daoFactory: arc.getContractInfoByName("DAOFactoryInstance", LATEST_ARC_VERSION).address,
            packageVersion: packageVersion,
            rewarderName: "Competition",
          };
          break;
        case "ContributionReward":
          proposalOptions.add.pluginInitParams = {
            daoId: daoId,
            votingMachine: votingMachine,
            votingParams: gpFormValuesToVotingParams(values.ContributionReward.votingParams),
            voteOnBehalf: values.ContributionReward.votingParams.voteOnBehalf,
            voteParamsHash: values.ContributionReward.votingParams.voteParamsHash,
          };
          break;
        case "ContributionRewardExt":
          proposalOptions.add.pluginInitParams = {
            daoId: daoId,
            votingMachine: votingMachine,
            votingParams: gpFormValuesToVotingParams(values.ContributionRewardExt.votingParams),
            voteOnBehalf: values.ContributionRewardExt.votingParams.voteOnBehalf,
            voteParamsHash: values.ContributionRewardExt.votingParams.voteParamsHash,
            daoFactory: arc.getContractInfoByName("DAOFactoryInstance", LATEST_ARC_VERSION).address,
            packageVersion: packageVersion,
            rewarderName: values.ContributionRewardExt.rewarderName,
          };
          break;
        case "GenericScheme":
          proposalOptions.add.pluginInitParams = {
            daoId: daoId,
            votingMachine: votingMachine,
            votingParams: gpFormValuesToVotingParams(values.GenericScheme.votingParams),
            voteOnBehalf: values.GenericScheme.votingParams.voteOnBehalf,
            voteParamsHash: values.GenericScheme.votingParams.voteParamsHash,
            contractToCall: values.GenericScheme.contractToCall,
          };
          break;
        case "ReputationFromToken":
          proposalOptions.add.pluginInitParams = {
            daoId: daoId,
            tokenContract: values.ReputationFromToken.tokenContract,
            curveInterface: values.ReputationFromToken.curveInterface,
          };
          break;
        case "SchemeFactory":
          proposalOptions.add.pluginInitParams = {
            daoId: daoId,
            votingMachine: votingMachine,
            votingParams: gpFormValuesToVotingParams(values.ContributionRewardExt.votingParams),
            voteOnBehalf: values.ContributionRewardExt.votingParams.voteOnBehalf,
            voteParamsHash: values.ContributionRewardExt.votingParams.voteParamsHash,
            daoFactory: arc.getContractInfoByName("DAOFactoryInstance", LATEST_ARC_VERSION).address,
          };
          break;
        case "SchemeRegistrar":
          proposalOptions.add.pluginInitParams = {
            daoId: daoId,
            votingMachine: votingMachine,
            votingParamsRegister: gpFormValuesToVotingParams(values.SchemeRegistrar.votingParamsRegister),
            voteOnBehalfRegister: values.SchemeRegistrar.votingParamsRegister.voteOnBehalf,
            voteRegisterParamsHash: values.SchemeRegistrar.votingParamsRegister.voteParamsHash,
            votingParamsRemove: gpFormValuesToVotingParams(values.SchemeRegistrar.votingParamsRemove),
            voteOnBehalfRemove: values.SchemeRegistrar.votingParamsRemove.voteOnBehalf,
            voteRemoveParamsHash: values.SchemeRegistrar.votingParamsRemove.voteParamsHash,
          };
          break;
        default:
          throw Error(`Unimplemented Plugin Manager Plugin Type ${proposalOptions.add.pluginName}`);
      }

      let permissions = 1;
      const pluginPermissions = (values as any)[values.pluginToAdd].permissions
      if (pluginPermissions.registerPlugins) {
        permissions += 2;
      }
      if (pluginPermissions.changeConstraints) {
        permissions += 4;
      }
      if (pluginPermissions.upgradeController) {
        permissions += 8;
      }
      if (pluginPermissions.genericCall) {
        permissions += 16;
      }

      proposalOptions.add.permissions = "0x" + permissions.toString(16).padStart(8, "0")
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

    const { currentTab } = this.state;

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

    const pluginManagerFormClass = classNames({
      [css.addPlugin]: currentTab === "addPlugin",
      [css.removePlugin]: currentTab === "removePlugin",
      [css.replacePlugin]: currentTab === "replacePlugin",
    });

    const isAddActive = getPluginIsActive(this.props.pluginState, GetPluginIsActiveActions.Register);
    const isRemoveActive = getPluginIsActive(this.props.pluginState, GetPluginIsActiveActions.Remove);
    const isReplaceActive = getPluginIsActive(this.props.pluginState, GetPluginIsActiveActions.Replace);
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

        <div className={pluginManagerFormClass}>
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
              } else if (currentTab === "removePlugin") {
                require("pluginToRemove");
              } else if (currentTab === "replacePlugin") {
                require("pluginToAdd");
                require("pluginToRemove");
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

                  <div className={`${css.removePluginFields} ${css.replacePluginFields}`}>
                    <div className={`${css.removePluginSelectContainer} ${css.replacePluginSelectContainer}`}>
                      <label htmlFor="schemeToRemoveInput">
                        <div className={css.requiredMarker}>*</div>
                          Plugin to remove
                        <ErrorMessage name="pluginToRemove">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      </label>
                      <Field
                        id="pluginToRemove"
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

                  <div className={`${css.addEditPluginFields} ${css.replacePluginFields}`}>
                    <div className={`${css.addPluginSelectContainer} ${css.replacePluginSelectContainer}`}>
                      <label htmlFor="pluginToAdd">
                        <div className={css.requiredMarker}>*</div>
                          Plugin to add
                        <ErrorMessage name="pluginToAdd">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      </label>
                      <Field
                        id="pluginToAdd"
                        name="pluginToAdd"
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

                    <InitializeParametersFields pluginName={values.pluginToAdd} values={values}/>
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

const SubscribedCreatePluginManagerProposal = withSubscription({
  wrappedComponent: CreatePluginManagerProposal,
  loadingComponent: <Loading/>,
  errorComponent: null,
  checkForUpdate: ["daoAvatarAddress"],
  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    return arc.dao(props.daoAvatarAddress).plugins();
  },
});

export default connect(null, mapDispatchToProps)(SubscribedCreatePluginManagerProposal);
