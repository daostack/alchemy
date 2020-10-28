/* eslint-disable no-bitwise */
import { enableWalletProvider, getArc } from "arc";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import TagsSelector from "components/Proposal/Create/PluginForms/TagsSelector";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import { createProposal } from "actions/arcActions";
import { showNotification } from "reducers/notifications";
import Analytics from "lib/analytics";
import { isValidUrl, toWei } from "lib/util";
import { GetPluginIsActiveActions, getPluginIsActive, pluginNameAndAddress, PLUGIN_NAMES } from "lib/pluginUtils";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import classNames from "classnames";
import { IPluginState, AnyPlugin, IProposalCreateOptionsPM, LATEST_ARC_VERSION } from "@daostack/arc.js";
import { connect } from "react-redux";
import * as React from "react";
import * as css from "../CreateProposal.scss";
import MarkdownField from "./MarkdownField";
import { PluginInitializeFields } from "./PluginInitializeFields";
import * as moment from "moment";
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
  activationTime: moment.Moment;
  voteOnBehalf: string;
  voteParamsHash: string;
}

const gpFormValuesToVotingParams = (genesisProtocolParams: IGenesisProtocolFormValues) => [
  genesisProtocolParams.queuedVoteRequiredPercentage.toString(),
  genesisProtocolParams.queuedVotePeriodLimit.toString(),
  genesisProtocolParams.boostedVotePeriodLimit.toString(),
  genesisProtocolParams.preBoostedVotePeriodLimit.toString(),
  genesisProtocolParams.thresholdConst.toString(),
  genesisProtocolParams.quietEndingPeriod.toString(),
  toWei(Number(genesisProtocolParams.proposingRepReward)).toString(),
  genesisProtocolParams.votersReputationLossRatio.toString(),
  toWei(Number(genesisProtocolParams.minimumDaoBounty)).toString(),
  genesisProtocolParams.daoBountyConst.toString(),
  genesisProtocolParams.activationTime.unix().toString(),
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
  Join: {
    permissions: IPermissions;
    votingParams: IGenesisProtocolFormValues;
    fundingToken: string;
    minFeeToJoin: number;
    memberReputation: number;
    fundingGoal: number;
    fundingGoalDeadline: number;
  };
  TokenTrade: {
    permissions: IPermissions;
    votingParams: IGenesisProtocolFormValues;
  }
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
}

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
  activationTime: moment().add(1, "days"), // default date for the next day
  voteOnBehalf: "0x0000000000000000000000000000000000000000",
  voteParamsHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
};

const defaultValues: IFormValues = {
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
  TokenTrade: {
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
  Join: {
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
  },
  SchemeRegistrar: {
    votingParamsRegister: { ...votingParams },
    votingParamsRemove: { ...votingParams },
    permissions: {
      registerPlugins: true,
      changeConstraints: true,
      upgradeController: true,
      genericCall: true,
    },
  },
  SchemeFactory: {
    votingParams: { ...votingParams },
    permissions: {
      registerPlugins: true,
      changeConstraints: true,
      upgradeController: true,
      genericCall: true,
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
};

class CreatePluginManagerProposal extends React.Component<IProps, IState> {

  formModalService: IFormModalService<IFormValues>;
  currentFormValues: IFormValues;

  constructor(props: IProps) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);

    this.state = {
      currentTab: defaultValues.currentTab,
      tags: [],
    };

    this.formModalService = CreateFormModalService(
      "CreatePluginManagerProposal",
      defaultValues,
      () => Object.assign(this.currentFormValues, this.state),
      (formValues: IFormValues, firstTime: boolean) => {
        this.currentFormValues = formValues;
        if (firstTime) {
          Object.assign(this.state, {
            currentTab: formValues.currentTab,
            tags: formValues.tags,
          });
        }
        else { this.setState({ tags: formValues.tags }); }
      },
      this.props.showNotification);
  }

  componentWillUnmount() {
    this.formModalService.saveCurrentValues();
  }

  public async handleSubmit(values: IFormValues, { setSubmitting }: any): Promise<void> {
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
    }

    if (currentTab === "addPlugin" || currentTab === "replacePlugin") {
      (proposalOptions.add as any) = {
        pluginName: values.pluginToAdd,
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
            votingParams: gpFormValuesToVotingParams(values.SchemeFactory.votingParams),
            voteOnBehalf: values.SchemeFactory.votingParams.voteOnBehalf,
            voteParamsHash: values.SchemeFactory.votingParams.voteParamsHash,
            daoFactory: arc.getContractInfoByName("DAOFactoryInstance", LATEST_ARC_VERSION).address,
          };
          break;
        case "TokenTrade":
          proposalOptions.add.pluginInitParams = {
            daoId: daoId,
            votingMachine: votingMachine,
            votingParams: gpFormValuesToVotingParams(values.ContributionReward.votingParams),
            voteOnBehalf: values.ContributionReward.votingParams.voteOnBehalf,
            voteParamsHash: values.ContributionReward.votingParams.voteParamsHash,
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
        case "Join":
          proposalOptions.add.pluginInitParams = {
            daoId: daoId,
            votingMachine: votingMachine,
            votingParams: gpFormValuesToVotingParams(values.Join.votingParams),
            voteOnBehalf: values.Join.votingParams.voteOnBehalf,
            voteParamsHash: values.Join.votingParams.voteParamsHash,
            fundingToken: values.Join.fundingToken,
            minFeeToJoin: values.Join.minFeeToJoin,
            memberReputation: values.Join.memberReputation,
            fundingGoal: values.Join.fundingGoal,
            fundingGoalDeadline: values.Join.fundingGoalDeadline,
          };
          break;
        case "FundingRequest":
          proposalOptions.add.pluginInitParams = {
            daoId: daoId,
            votingMachine: votingMachine,
            votingParams: gpFormValuesToVotingParams(values.FundingRequest.votingParams),
            voteOnBehalf: values.FundingRequest.votingParams.voteOnBehalf,
            voteParamsHash: values.FundingRequest.votingParams.voteParamsHash,
            fundingToken: values.FundingRequest.fundingToken,
          };
          break;
        default:
          throw Error(`Unimplemented Plugin Manager Plugin Type ${(proposalOptions.add as any).pluginName}`);
      }

      let permissions = 1;
      const pluginPermissions = (values as any)[values.pluginToAdd].permissions;
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

      proposalOptions.add.permissions = "0x" + permissions.toString(16).padStart(8, "0");
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
    this.setState({ tags });
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
          {isReplaceActive ?
            <button className={replacePluginButtonClass} onClick={this.handleTabClick("replacePlugin")} data-test-id="tab-ReplacePlugin">
              <span></span>
            Replace Plugin
            </button>
            : ""}
        </div>
        <div className={css.contentWrapper}>
          <div className={pluginManagerFormClass}>
            <Formik
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              initialValues={this.currentFormValues}
              // eslint-disable-next-line react/jsx-no-bind
              validate={(values: IFormValues) => {
                const errors: any = {};

                this.currentFormValues = values;

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
                resetForm,
                setFieldValue,
                values,
              }: FormikProps<IFormValues>) => {
                return (
                  <Form noValidate>
                    <label className={css.description}>What to Expect</label>
                    {(currentTab === "addPlugin") ?
                      <div className={css.description}>Propose to add a new plugin to the DAO.</div> :
                      (currentTab === "removePlugin") ?
                        <div className={css.description}>Propose to remove a plugin from the DAO.</div> :
                        (currentTab === "replacePlugin") ?
                          <div className={css.description}>Propose to replace a plugin from the DAO.</div> : ""
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
                            return <option id={`option-${_i}`} key={`remove_plugin_${plugin.coreState.address}`} value={plugin.coreState.address}>{pluginNameAndAddress(plugin.coreState)}</option>;
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
                          // eslint-disable-next-line react/jsx-no-bind
                          onChange={(e: any) => {
                            // call the built-in handleChange
                            handleChange(e);
                          }}
                        >
                          <option value="">Select a plugin...</option>
                          {Object.entries(PLUGIN_NAMES).map(([name, uiName]) => {
                            return <option id={`option-${name}`} key={`add_plugin_${name}`} value={name}>{uiName}</option>;
                          })}
                        </Field>
                      </div>

                      <PluginInitializeFields pluginName={values.pluginToAdd} values={values} />
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
      </div>
    );
  }
}

const SubscribedCreatePluginManagerProposal = withSubscription({
  wrappedComponent: CreatePluginManagerProposal,
  loadingComponent: <Loading />,
  errorComponent: null,
  checkForUpdate: ["daoAvatarAddress"],
  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    return arc.dao(props.daoAvatarAddress).plugins({ where: { isRegistered: true } });
  },
});

export default connect(null, mapDispatchToProps)(SubscribedCreatePluginManagerProposal);
