import * as React from "react";
import { targetedNetwork, linkToEtherScan } from "lib/util";
import { PLUGIN_NAMES } from "lib/pluginUtils";
import { KNOWNPLUGINS } from "genericPluginRegistry";
import { IFormValues } from "./CreatePluginManagerProposal";
import * as css from "../CreateProposal.scss";
import { ErrorMessage, Field } from "formik";

interface IProps {
  pluginName: keyof typeof PLUGIN_NAMES | "";
  values: IFormValues;
}

const fieldView = (plugin: string, title: string, field: string) => (
  <div>
    <label htmlFor={field}>
      <div className={css.requiredMarker}>*</div>
      {title}
      <ErrorMessage name={`${plugin}.${field}`}>{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
    </label>
    <Field
      id={field}
      name={`${plugin}.${field}`}
    />
  </div>
);

const GenesisProtocolFields = (paramsProp: string) => (
  <div className={css.parameters}>
    {fieldView(paramsProp, "Queued Vote Required Percentage", "queuedVoteRequiredPercentage")}
    {fieldView(paramsProp, "Queued Vote Period Limit", "queuedVotePeriodLimit")}
    {fieldView(paramsProp, "Boosted Vote Period Limit", "boostedVotePeriodLimit")}
    {fieldView(paramsProp, "Pre-Boosted Vote Period Limit", "preBoostedVotePeriodLimit")}
    {fieldView(paramsProp, "Threshold Const", "thresholdConst")}
    {fieldView(paramsProp, "Quiet Ending Period", "quietEndingPeriod")}
    {fieldView(paramsProp, "Proposing Reputation Reward", "proposingRepReward")}
    {fieldView(paramsProp, "Voters Reputation Loss Ratio", "votersReputationLossRatio")}
    {fieldView(paramsProp, "Minimum DAO Bounty", "minimumDaoBounty")}
    {fieldView(paramsProp, "DAO Bounty Const", "daoBountyConst")}
    {fieldView(paramsProp, "Activation Time", "activationTime")}
    {fieldView(paramsProp, "Vote on behalf", "voteOnBehalf")}
  </div>
);

const GenericSchemeFields: React.FC<IProps> = ({ values }) => {
  // Create a list of all generic action templates
  // that exist for this network
  const network = targetedNetwork();
  const templates = KNOWNPLUGINS
    .filter((template) => {
      const address = template.addresses[network];
      return address && address !== "";
    })
    .map((template) => {
      let address = template.addresses[network];

      if (Array.isArray(address)) {
        address = address[0];
      }

      return {
        name: template.name,
        address,
      };
    });

  const contractToCall = values.GenericScheme.contractToCall;

  return (
    <div>
      <div>
        <label htmlFor="contractToCall">
          <div className={css.requiredMarker}>*</div>
            Contract to call
          <ErrorMessage name="GenericScheme.contractToCall">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
        </label>
        <Field
          id="contractToCall"
          name="GenericScheme.contractToCall"
          component="select"
          className={css.pluginSelect}
        >
          <option value="">Select a contract...</option>
          {templates.map((template) => (
            <option key={`generic_action_${template.name}_${template.address}`} value={template.address}>
              {template.name}
            </option>
          ))}
        </Field>
        <a href={linkToEtherScan(contractToCall)} target="_blank" rel="noopener noreferrer">{ contractToCall }</a>
      </div>
      {GenesisProtocolFields("GenericScheme.votingParams")}
    </div>
  );
};

const ContributionRewardFields = () => (
  <div>
    {GenesisProtocolFields("ContributionReward.votingParams")}
  </div>
);

const CompetitionFields = () => (
  <div>
    {GenesisProtocolFields("Competition.votingParams")}
  </div>
);

const ContributionRewardExtFields = () => (
  <div>
    {fieldView("ContributionRewardExt", "Rewarder Name", "rewarderName")}
    {GenesisProtocolFields("ContributionRewardExt.votingParams")}
  </div>
);

const FundingRequest = () => (
  <div>
    {fieldView("FundingRequest", "Funding Token", "fundingToken")}
    {GenesisProtocolFields("FundingRequest.votingParams")}
  </div>
);

const JoinAndQuit = () => (
  <div>
    {fieldView("JoinAndQuit", "Funding Token", "fundingToken")}
    {fieldView("JoinAndQuit", "Minimum Join Fee", "minFeeToJoin")}
    {fieldView("JoinAndQuit", "Initial Reputation", "memberReputation")}
    {fieldView("JoinAndQuit", "Funding Goal", "fundingGoal")}
    {fieldView("JoinAndQuit", "Deadline", "fundingGoalDeadline")}
    {fieldView("JoinAndQuit", "Allow Rage Quit", "rageQuitEnable")}
  </div>
);

const SchemeRegistrarFields = () => (
  <div>
    <title>
      Add Plugin Vote Params
    </title>
    {GenesisProtocolFields("SchemeRegistrar.votingParamsRegister")}
    <title>
      Remove Plugin Vote Params
    </title>
    {GenesisProtocolFields("SchemeRegistrar.votingParamsRemove")}
  </div>
);

const PluginManagerFields = () => (
  <div>
    {GenesisProtocolFields("SchemeFactory.votingParams")}
  </div>
);

const ReputationFromTokenFields = () => (
  <div>
    {fieldView("ReputationFromToken", "Token Contract", "tokenContract")}
    {fieldView("ReputationFromToken", "Curve Interface", "curveInterface")}
  </div>
);

const fieldsMap = {
  GenericScheme: GenericSchemeFields,
  ContributionReward: ContributionRewardFields,
  Competition: CompetitionFields,
  ContributionRewardExt: ContributionRewardExtFields,
  FundingRequest: FundingRequest,
  JoinAndQuit: JoinAndQuit,
  SchemeRegistrar: SchemeRegistrarFields,
  SchemeFactory: PluginManagerFields,
  ReputationFromToken: ReputationFromTokenFields,
};

export const InitializeParametersFields: React.FC<IProps> = ({ pluginName, values }) => {
  return pluginName && fieldsMap[pluginName]? fieldsMap[pluginName]({ pluginName, values }): null;
};
