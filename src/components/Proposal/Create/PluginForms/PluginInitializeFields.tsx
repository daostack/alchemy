// NOTE: Used to render form fields for all values needed to construct
// a plugin's encoded initialize(...) data.

import * as React from "react";
import { targetedNetwork, linkToEtherScan, getLocalTimezone } from "lib/util";
import { PLUGIN_NAMES } from "lib/pluginUtils";
import { KNOWNPLUGINS } from "genericPluginRegistry";
import { IFormValues } from "./CreatePluginManagerProposal";
import * as css from "../CreateProposal.scss";
import { Form, ErrorMessage, Field } from "formik";
import * as validators from "./Validators";
import i18next from "i18next";
import { CustomDateInput } from "components/Plugin/ContributionRewardExtRewarders/Competition/CreateProposal";

interface IProps {
  pluginName: keyof typeof PLUGIN_NAMES | "";
  values: IFormValues;
}

const fieldView = (plugin: string, title: string, field: string, validate?: (value: any) => void, type?: string, component?: any) => (
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
      component={component}
    />
  </div>
);

const GenesisProtocolFields = (paramsProp: string) => (
  <Form>
    <div className={css.parameters}>
      {fieldView(paramsProp, "Queued Vote Required Percentage", "queuedVoteRequiredPercentage", value => validators.validRange(value, 50, 100))}
      {fieldView(paramsProp, "Queued Vote Period Limit", "queuedVotePeriodLimit", validators.validNumber)}
      {fieldView(paramsProp, "Boosted Vote Period Limit", "boostedVotePeriodLimit", validators.boostedVotePeriodLimit)}
      {fieldView(paramsProp, "Pre-Boosted Vote Period Limit", "preBoostedVotePeriodLimit", validators.validNumber)}
      {fieldView(paramsProp, "Threshold Const", "thresholdConst", validators.thresholdConst)}
      {fieldView(paramsProp, "Quiet Ending Period", "quietEndingPeriod", validators.validQuietEndingPeriod)}
      {fieldView(paramsProp, "Proposing Reputation Reward", "proposingRepReward", validators.validNumber)}
      {fieldView(paramsProp, "Voters Reputation Loss Ratio", "votersReputationLossRatio", validators.validPercentage)}
      {fieldView(paramsProp, "Minimum DAO Bounty", "minimumDaoBounty", value => validators.greaterThan(value, 0))}
      {fieldView(paramsProp, "DAO Bounty Const", "daoBountyConst", value => validators.greaterThan(value, 0))}
      {fieldView(paramsProp, `Activation Time ${getLocalTimezone()}`, "activationTime", validators.futureTime, undefined, CustomDateInput)}
      {fieldView(paramsProp, "Vote on behalf", "voteOnBehalf", (address: string) => validators.address(address, true))}
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
          <option id="custom" value="">Custom...</option>
          {templates.map((template) => (
            <option key={`generic_action_${template.name}_${template.address}`} value={template.address}>
              {template.name}
            </option>
          ))}
        </Field>
        {(document.getElementById("contractToCall") as HTMLInputElement)?.value === "" &&
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
    {fieldView("FundingRequest", "Funding Token", "fundingToken", (address: string) => validators.address(address, true))}
    {GenesisProtocolFields("FundingRequest.votingParams")}
  </div>
);

const Join = () => (
  <div>
    {fieldView("Join", "Funding Token", "fundingToken", (address: string) => validators.address(address, true))}
    {fieldView("Join", "Minimum Join Fee", "minFeeToJoin", validators.validNumber)}
    {fieldView("Join", "Initial Reputation", "memberReputation", validators.validNumber)}
    {fieldView("Join", "Funding Goal", "fundingGoal", validators.validNumber)}
    {fieldView("Join", "Deadline", "fundingGoalDeadline", validators.validNumber)}
    {GenesisProtocolFields("Join.votingParams")}
  </div>
);

const TokenTrade = () => (
  <div>
    {GenesisProtocolFields("TokenTrade.votingParams")}
  </div>
);

const SchemeRegistrarFields = () => (
  <div>
    <fieldset>
      <legend>{i18next.t("Add Params")}</legend>
      {GenesisProtocolFields("SchemeRegistrar.votingParamsRegister")}
    </fieldset>
    <fieldset>
      <legend>{i18next.t("Remove Params")}</legend>
      {GenesisProtocolFields("SchemeRegistrar.votingParamsRemove")}
    </fieldset>
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
  Join: Join,
  TokenTrade: TokenTrade,
  SchemeRegistrar: SchemeRegistrarFields,
  SchemeFactory: PluginManagerFields,
  ReputationFromToken: ReputationFromTokenFields,
};

export const PluginInitializeFields: React.FC<IProps> = ({ pluginName, values }) => {
  return pluginName && fieldsMap[pluginName] ? fieldsMap[pluginName]({ pluginName, values }) : null;
};
