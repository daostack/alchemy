import * as React from "react";
import { PLUGIN_NAMES } from "lib/pluginUtils";
import * as css from "../CreateProposal.scss";
import { ErrorMessage, Field } from "formik";

interface IProps {
  pluginName: keyof typeof PLUGIN_NAMES | "";
}

const GenesisProtocolFields = () => (
  <div className={css.parameters}>
    <div>
      <label htmlFor="voteOnBehalf">
        <div className={css.requiredMarker}>*</div>
          Vote on behalf
        <ErrorMessage name="initializeParams.genesisProtocolParams.voteOnBehalf">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="voteOnBehalf"
        name="initializeParams.genesisProtocolParams.voteOnBehalf"
      />
    </div>
    <div>
      <label htmlFor="queuedVoteRequiredPercentage">
        <div className={css.requiredMarker}>*</div>
          Queued Vote Required Percentage
        <ErrorMessage name="initializeParams.genesisProtocolParams.queuedVoteRequiredPercentage">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="queuedVoteRequiredPercentage"
        name="initializeParams.genesisProtocolParams.queuedVoteRequiredPercentage"
      />
    </div>

    <div>
      <label htmlFor="queuedVotePeriodLimit">
        <div className={css.requiredMarker}>*</div>
          Queued Vote Period Limit
        <ErrorMessage name="initializeParams.genesisProtocolParams.queuedVotePeriodLimit">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="queuedVotePeriodLimit"
        name="initializeParams.genesisProtocolParams.queuedVotePeriodLimit"
      />
    </div>

    <div>
      <label htmlFor="boostedVotePeriodLimit">
        <div className={css.requiredMarker}>*</div>
          Boosted Vote Period Limit
        <ErrorMessage name="initializeParams.genesisProtocolParams.boostedVotePeriodLimit">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="boostedVotePeriodLimit"
        name="initializeParams.genesisProtocolParams.boostedVotePeriodLimit"
      />
    </div>

    <div>
      <label htmlFor="preBoostedVotePeriodLimit">
        <div className={css.requiredMarker}>*</div>
          Pre-Boosted Vote Period Limit
        <ErrorMessage name="initializeParams.genesisProtocolParams.preBoostedVotePeriodLimit">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="preBoostedVotePeriodLimit"
        name="initializeParams.genesisProtocolParams.preBoostedVotePeriodLimit"
      />
    </div>

    <div>
      <label htmlFor="thresholdConst">
        <div className={css.requiredMarker}>*</div>
          Threshold Const
        <ErrorMessage name="initializeParams.genesisProtocolParams.thresholdConst">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="thresholdConst"
        name="initializeParams.genesisProtocolParams.thresholdConst"
      />
    </div>

    <div>
      <label htmlFor="quietEndingPeriod">
        <div className={css.requiredMarker}>*</div>
          Quiet Ending Period
        <ErrorMessage name="initializeParams.genesisProtocolParams.quietEndingPeriod">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="quietEndingPeriod"
        name="initializeParams.genesisProtocolParams.quietEndingPeriod"
      />
    </div>

    <div>
      <label htmlFor="proposingRepReward">
        <div className={css.requiredMarker}>*</div>
          Proposing Reputation Reward
        <ErrorMessage name="initializeParams.genesisProtocolParams.proposingRepReward">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="proposingRepReward"
        name="initializeParams.genesisProtocolParams.proposingRepReward"
      />
    </div>

    <div>
      <label htmlFor="votersReputationLossRatio">
        <div className={css.requiredMarker}>*</div>
          Voters Reputation Loss Ratio
        <ErrorMessage name="initializeParams.genesisProtocolParams.votersReputationLossRatio">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="votersReputationLossRatio"
        name="initializeParams.genesisProtocolParams.votersReputationLossRatio"
      />
    </div>

    <div>
      <label htmlFor="minimumDaoBounty">
        <div className={css.requiredMarker}>*</div>
          Minimum DAO Bounty
        <ErrorMessage name="initializeParams.genesisProtocolParams.minimumDaoBounty">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="minimumDaoBounty"
        name="initializeParams.genesisProtocolParams.minimumDaoBounty"
      />
    </div>

    <div>
      <label htmlFor="daoBountyConst">
        <div className={css.requiredMarker}>*</div>
          DAO Bounty Const
        <ErrorMessage name="initializeParams.genesisProtocolParams.daoBountyConst">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="daoBountyConst"
        name="initializeParams.genesisProtocolParams.daoBountyConst"
      />
    </div>

    <div>
      <label htmlFor="activationTime">
        <div className={css.requiredMarker}>*</div>
          Activation Time
        <ErrorMessage name="initializeParams.genesisProtocolParams.activationTime">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="activationTime"
        name="initializeParams.genesisProtocolParams.activationTime"
      />
    </div>
  </div>
);

const ReputationFromTokenFields = () => (
  <div>
    <div>
      <label htmlFor="tokenContract">
        <div className={css.requiredMarker}>*</div>
          Token Contract
        <ErrorMessage name="initializeParams.tokenContract">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="tokenContract"
        name="initializeParams.tokenContract"
      />
    </div>
    <div>
      <label htmlFor="curveInterface">
        <div className={css.requiredMarker}>*</div>
          Curve Interface
        <ErrorMessage name="initializeParams.curveInterface">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="curveInterface"
        name="initializeParams.curveInterface"
      />
    </div>
  </div>
);

const ContributionRewardFields = () => (
  <div>
    {GenesisProtocolFields()}
  </div>
);

const PluginManagerFields = () => (
  <div>
    <div>
      <label htmlFor="daoFactory">
        <div className={css.requiredMarker}>*</div>
          DAO Factory
        <ErrorMessage name="initializeParams.daoFactory">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="daoFactory"
        name="initializeParams.daoFactory"
      />
    </div>
    {GenesisProtocolFields()}
  </div>
);

const GenericSchemeFields = () => (
  <div>
    <div>
      <label htmlFor="contractToCall">
        <div className={css.requiredMarker}>*</div>
          Contract to call
        <ErrorMessage name="initializeParams.contractToCall">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="contractToCall"
        name="initializeParams.contractToCall"
      />
    </div>
    {GenesisProtocolFields()}
  </div>
);

const ContributionRewardExtFields = () => (
  <div>
    <div>
      <label htmlFor="daoFactory">
        <div className={css.requiredMarker}>*</div>
          DAO Factory
        <ErrorMessage name="initializeParams.daoFactory">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="daoFactory"
        name="initializeParams.daoFactory"
      />
    </div>
    <div>
      <label htmlFor="rewarderName">
        <div className={css.requiredMarker}>*</div>
          Rewarder name
        <ErrorMessage name="initializeParams.rewarderName">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="rewarderName"
        name="initializeParams.rewarderName"
      />
    </div>
    {GenesisProtocolFields()}
  </div>
);

const CompetitionFields = () => (
  <div>
    <label htmlFor="contributionRewardExt">
      <div className={css.requiredMarker}>*</div>
        ContributionRewardExt
      <ErrorMessage name="initializeParams.contributionRewardExt">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
    </label>
    <Field
      id="contributionRewardExt"
      name="initializeParams.contributionRewardExt"
    />
  </div>
);

const SchemeRegistrarFields = () => (
  <div>
    <div>
      <label htmlFor="voteOnBehalf">
        <div className={css.requiredMarker}>*</div>
          Register Vote on behalf
        <ErrorMessage name="initializeParams.genesisProtocolParamsRegister.voteOnBehalf">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="voteOnBehalf"
        name="initializeParams.genesisProtocolParamsRegister.voteOnBehalf"
      />
    </div>
    <div>
      <label htmlFor="queuedVoteRequiredPercentage">
        <div className={css.requiredMarker}>*</div>
          Register Queued Vote Required Percentage
        <ErrorMessage name="initializeParams.genesisProtocolParamsRegister.queuedVoteRequiredPercentage">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="queuedVoteRequiredPercentage"
        name="initializeParams.genesisProtocolParamsRegister.queuedVoteRequiredPercentage"
      />
    </div>

    <div>
      <label htmlFor="queuedVotePeriodLimit">
        <div className={css.requiredMarker}>*</div>
          Register Queued Vote Period Limit
        <ErrorMessage name="initializeParams.genesisProtocolParamsRegister.queuedVotePeriodLimit">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="queuedVotePeriodLimit"
        name="initializeParams.genesisProtocolParamsRegister.queuedVotePeriodLimit"
      />
    </div>

    <div>
      <label htmlFor="boostedVotePeriodLimit">
        <div className={css.requiredMarker}>*</div>
          Register Boosted Vote Period Limit
        <ErrorMessage name="initializeParams.genesisProtocolParamsRegister.boostedVotePeriodLimit">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="boostedVotePeriodLimit"
        name="initializeParams.genesisProtocolParamsRegister.boostedVotePeriodLimit"
      />
    </div>

    <div>
      <label htmlFor="preBoostedVotePeriodLimit">
        <div className={css.requiredMarker}>*</div>
          Register Pre-Boosted Vote Period Limit
        <ErrorMessage name="initializeParams.genesisProtocolParamsRegister.preBoostedVotePeriodLimit">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="preBoostedVotePeriodLimit"
        name="initializeParams.genesisProtocolParamsRegister.preBoostedVotePeriodLimit"
      />
    </div>

    <div>
      <label htmlFor="thresholdConst">
        <div className={css.requiredMarker}>*</div>
          Register Threshold Const
        <ErrorMessage name="initializeParams.genesisProtocolParamsRegister.thresholdConst">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="thresholdConst"
        name="initializeParams.genesisProtocolParamsRegister.thresholdConst"
      />
    </div>

    <div>
      <label htmlFor="quietEndingPeriod">
        <div className={css.requiredMarker}>*</div>
          Register Quiet Ending Period
        <ErrorMessage name="initializeParams.genesisProtocolParamsRegister.quietEndingPeriod">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="quietEndingPeriod"
        name="initializeParams.genesisProtocolParamsRegister.quietEndingPeriod"
      />
    </div>

    <div>
      <label htmlFor="proposingRepReward">
        <div className={css.requiredMarker}>*</div>
          Register Proposing Reputation Reward
        <ErrorMessage name="initializeParams.genesisProtocolParamsRegister.proposingRepReward">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="proposingRepReward"
        name="initializeParams.genesisProtocolParamsRegister.proposingRepReward"
      />
    </div>

    <div>
      <label htmlFor="votersReputationLossRatio">
        <div className={css.requiredMarker}>*</div>
          Register Voters Reputation Loss Ratio
        <ErrorMessage name="initializeParams.genesisProtocolParamsRegister.votersReputationLossRatio">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="votersReputationLossRatio"
        name="initializeParams.genesisProtocolParamsRegister.votersReputationLossRatio"
      />
    </div>

    <div>
      <label htmlFor="minimumDaoBounty">
        <div className={css.requiredMarker}>*</div>
          Register Minimum DAO Bounty
        <ErrorMessage name="initializeParams.genesisProtocolParamsRegister.minimumDaoBounty">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="minimumDaoBounty"
        name="initializeParams.genesisProtocolParamsRegister.minimumDaoBounty"
      />
    </div>

    <div>
      <label htmlFor="daoBountyConst">
        <div className={css.requiredMarker}>*</div>
          Register DAO Bounty Const
        <ErrorMessage name="initializeParams.genesisProtocolParamsRegister.daoBountyConst">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="daoBountyConst"
        name="initializeParams.genesisProtocolParamsRegister.daoBountyConst"
      />
    </div>

    <div>
      <label htmlFor="activationTime">
        <div className={css.requiredMarker}>*</div>
          Register Activation Time
        <ErrorMessage name="initializeParams.genesisProtocolParamsRegister.activationTime">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="activationTime"
        name="initializeParams.genesisProtocolParamsRegister.activationTime"
      />
    </div>

    <div>
      <label htmlFor="voteOnBehalf">
        <div className={css.requiredMarker}>*</div>
          Remove Vote on behalf
        <ErrorMessage name="initializeParams.genesisProtocolParamsRemove.voteOnBehalf">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="voteOnBehalf"
        name="initializeParams.genesisProtocolParamsRemove.voteOnBehalf"
      />
    </div>
    <div>
      <label htmlFor="queuedVoteRequiredPercentage">
        <div className={css.requiredMarker}>*</div>
          Remove Queued Vote Required Percentage
        <ErrorMessage name="initializeParams.genesisProtocolParamsRemove.queuedVoteRequiredPercentage">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="queuedVoteRequiredPercentage"
        name="initializeParams.genesisProtocolParamsRemove.queuedVoteRequiredPercentage"
      />
    </div>

    <div>
      <label htmlFor="queuedVotePeriodLimit">
        <div className={css.requiredMarker}>*</div>
          Remove Queued Vote Period Limit
        <ErrorMessage name="initializeParams.genesisProtocolParamsRemove.queuedVotePeriodLimit">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="queuedVotePeriodLimit"
        name="initializeParams.genesisProtocolParamsRemove.queuedVotePeriodLimit"
      />
    </div>

    <div>
      <label htmlFor="boostedVotePeriodLimit">
        <div className={css.requiredMarker}>*</div>
          Remove Boosted Vote Period Limit
        <ErrorMessage name="initializeParams.genesisProtocolParamsRemove.boostedVotePeriodLimit">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="boostedVotePeriodLimit"
        name="initializeParams.genesisProtocolParamsRemove.boostedVotePeriodLimit"
      />
    </div>

    <div>
      <label htmlFor="preBoostedVotePeriodLimit">
        <div className={css.requiredMarker}>*</div>
          Remove Pre-Boosted Vote Period Limit
        <ErrorMessage name="initializeParams.genesisProtocolParamsRemove.preBoostedVotePeriodLimit">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="preBoostedVotePeriodLimit"
        name="initializeParams.genesisProtocolParamsRemove.preBoostedVotePeriodLimit"
      />
    </div>

    <div>
      <label htmlFor="thresholdConst">
        <div className={css.requiredMarker}>*</div>
          Remove Threshold Const
        <ErrorMessage name="initializeParams.genesisProtocolParamsRemove.thresholdConst">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="thresholdConst"
        name="initializeParams.genesisProtocolParamsRemove.thresholdConst"
      />
    </div>

    <div>
      <label htmlFor="quietEndingPeriod">
        <div className={css.requiredMarker}>*</div>
          Remove Quiet Ending Period
        <ErrorMessage name="initializeParams.genesisProtocolParamsRemove.quietEndingPeriod">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="quietEndingPeriod"
        name="initializeParams.genesisProtocolParamsRemove.quietEndingPeriod"
      />
    </div>

    <div>
      <label htmlFor="proposingRepReward">
        <div className={css.requiredMarker}>*</div>
          Remove Proposing Reputation Reward
        <ErrorMessage name="initializeParams.genesisProtocolParamsRemove.proposingRepReward">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="proposingRepReward"
        name="initializeParams.genesisProtocolParamsRemove.proposingRepReward"
      />
    </div>

    <div>
      <label htmlFor="votersReputationLossRatio">
        <div className={css.requiredMarker}>*</div>
          Remove Voters Reputation Loss Ratio
        <ErrorMessage name="initializeParams.genesisProtocolParamsRemove.votersReputationLossRatio">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="votersReputationLossRatio"
        name="initializeParams.genesisProtocolParamsRemove.votersReputationLossRatio"
      />
    </div>

    <div>
      <label htmlFor="minimumDaoBounty">
        <div className={css.requiredMarker}>*</div>
          Remove Minimum DAO Bounty
        <ErrorMessage name="initializeParams.genesisProtocolParamsRemove.minimumDaoBounty">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="minimumDaoBounty"
        name="initializeParams.genesisProtocolParamsRemove.minimumDaoBounty"
      />
    </div>

    <div>
      <label htmlFor="daoBountyConst">
        <div className={css.requiredMarker}>*</div>
          Remove DAO Bounty Const
        <ErrorMessage name="initializeParams.genesisProtocolParamsRemove.daoBountyConst">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="daoBountyConst"
        name="initializeParams.genesisProtocolParamsRemove.daoBountyConst"
      />
    </div>

    <div>
      <label htmlFor="activationTime">
        <div className={css.requiredMarker}>*</div>
          Remove Activation Time
        <ErrorMessage name="initializeParams.genesisProtocolParamsRemove.activationTime">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
      </label>
      <Field
        id="activationTime"
        name="initializeParams.genesisProtocolParamsRemove.activationTime"
      />
    </div>
  </div>
);

const fieldsMap = {
  ContributionReward: ContributionRewardFields(),
  GenericScheme: GenericSchemeFields(),
  ReputationFromToken: ReputationFromTokenFields(),
  SchemeRegistrar: SchemeRegistrarFields(),
  SchemeFactory: PluginManagerFields(),
  Competition: CompetitionFields(),
  ContributionRewardExt: ContributionRewardExtFields(),
};

export const InitializeParametersFields: React.FC<IProps> = ({ pluginName }) => {
  return pluginName && fieldsMap[pluginName]? fieldsMap[pluginName]: null;
};
