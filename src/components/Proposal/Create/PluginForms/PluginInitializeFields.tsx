// NOTE: Used to render form fields for all values needed to construct
// a plugin's encoded initialize(...) data.

import * as React from "react";
import { targetedNetwork, linkToEtherScan } from "lib/util";
import { PLUGIN_NAMES } from "lib/pluginUtils";
import { KNOWNPLUGINS } from "genericPluginRegistry";
import { IFormValues } from "./CreatePluginManagerProposal";
import * as css from "../CreateProposal.scss";
import { Form, ErrorMessage, Field } from "formik";
import * as validators from "./Validators";

interface IProps {
  pluginName: keyof typeof PLUGIN_NAMES | "";
  values: IFormValues;
}

const fieldView = (plugin: string, title: string, field: string, validate?: (value: any) => void, type?: string) => (
  <div>
    <label htmlFor={field}>
      <div className={css.requiredMarker}>*</div>
      {title}
      <ErrorMessage name={`${plugin}.${field}`}>{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
    </label>
    <Field
      id={field}
      name={`${plugin}.${field}`}
      validate={validate}
      type={type}
    />
  </div>
);

const GenesisProtocolFields = (paramsProp: string) => (
  <Form>
    <div className={css.parameters}>
      {fieldView(paramsProp, "Queued Vote Required Percentage", "queuedVoteRequiredPercentage", value => validators.vaildRange(value, 50, 100))}
      {fieldView(paramsProp, "Queued Vote Period Limit", "queuedVotePeriodLimit", validators.validNumber)}
      {fieldView(paramsProp, "Boosted Vote Period Limit", "boostedVotePeriodLimit", validators.boostedVotePeriodLimit)}
      {fieldView(paramsProp, "Pre-Boosted Vote Period Limit", "preBoostedVotePeriodLimit", validators.validNumber)}
      {fieldView(paramsProp, "Threshold Const", "thresholdConst", validators.thresholdConst)}
      {fieldView(paramsProp, "Quiet Ending Period", "quietEndingPeriod", validators.validQuietEndingPeriod)}
      {fieldView(paramsProp, "Proposing Reputation Reward", "proposingRepReward", validators.validNumber)}
      {fieldView(paramsProp, "Voters Reputation Loss Ratio", "votersReputationLossRatio", validators.validPercentage)}
      {fieldView(paramsProp, "Minimum DAO Bounty", "minimumDaoBounty", value => validators.greaterThan(value, 0))}
      {fieldView(paramsProp, "DAO Bounty Const", "daoBountyConst", value => validators.greaterThan(value, 0))}
      {fieldView(paramsProp, "Activation Time", "activationTime", validators.futureTime, "datetime-local")}
      {fieldView(paramsProp, "Vote on behalf", "voteOnBehalf", validators.address)}
    </div>
  </Form>
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
  const isCustom = templates.findIndex(
    (item) => item.address === contractToCall
  ) === -1;

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
          <option value="">Custom...</option>
          {templates.map((template) => (
            <option key={`generic_action_${template.name}_${template.address}`} value={template.address}>
              {template.name}
            </option>
          ))}
        </Field>
        {isCustom &&
          fieldView("GenericScheme", "Custom Contract To Call", "contractToCall", validators.address)}
        <a href={linkToEtherScan(contractToCall)} target="_blank" rel="noopener noreferrer">{contractToCall}</a>
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

export const PluginInitializeFields: React.FC<IProps> = ({ pluginName, values }) => {
  return pluginName && fieldsMap[pluginName] ? fieldsMap[pluginName]({ pluginName, values }) : null;
};
