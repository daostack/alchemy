import { IDAOState, IProposalCreateOptionsComp, CompetitionPlugin } from "@daostack/arc.js";
import * as arcActions from "actions/arcActions";
import { enableWalletProvider, getArc } from "arc";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import { baseTokenName, supportedTokens, toBaseUnit, tokenDetails, toWei, isValidUrl, getLocalTimezone } from "lib/util";
import * as React from "react";
import { connect } from "react-redux";
import Select from "react-select";
import { showNotification } from "reducers/notifications";
import TagsSelector from "components/Proposal/Create/PluginForms/TagsSelector";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import * as css from "components/Proposal/Create/CreateProposal.scss";
import MarkdownField from "components/Proposal/Create/PluginForms/MarkdownField";
import { checkTotalPercent } from "lib/util";
import * as Datetime from "react-datetime";
import i18next from "i18next";

import moment = require("moment");
import BN = require("bn.js");
import HelpButton from "components/Shared/HelpButton";
import { IFormModalService, CreateFormModalService } from "components/Shared/FormModalService";
import ResetFormButton from "components/Proposal/Create/PluginForms/ResetFormButton";

interface IExternalProps {
  plugin: CompetitionPlugin;
  daoAvatarAddress: string;
  handleClose: () => any;
}

interface IStateProps {
  tags: Array<string>;
}

interface IDispatchProps {
  createProposal: typeof arcActions.createProposal;
  showNotification: typeof showNotification;
}

const MAX_NUMBER_OF_WINNERS = 100;

const mapDispatchToProps = {
  createProposal: arcActions.createProposal,
  showNotification,
};

type IProps = IExternalProps & IDispatchProps & ISubscriptionProps<IDAOState>;

interface IFormValues {
  rewardSplit: string;
  description: string;
  ethReward: number;
  externalTokenAddress: string;
  externalTokenReward: number;
  nativeTokenReward: number;
  numWinners: number;
  numberOfVotesPerVoter: number;
  reputationReward: number;
  title: string;
  url: string;
  compStartTimeInput: moment.Moment;
  compEndTimeInput: moment.Moment;
  suggestionEndTimeInput: moment.Moment;
  votingStartTimeInput: moment.Moment;
  proposerIsAdmin: boolean;

  [key: string]: any;
}

const customStyles = {
  indicatorSeparator: () => ({
    display: "none",
  }),
  menu: (provided: any) => ({
    ...provided,
    borderTop: "none",
    borderRadius: "0 0 5px 5px",
    marginTop: 1,
    backgroundColor: "rgba(255,255,255,1)",
  }),
};

export const CustomDateInput: React.SFC<any> = ({ field, form }) => {
  const onChange = (date: moment.Moment) => {
    form.setFieldValue(field.name, date);
    return true;
  };

  return <Datetime
    value={field.value}
    // eslint-disable-next-line react/jsx-no-bind
    onChange={onChange}
    dateFormat="MMMM D, YYYY"
    timeFormat="HH:mm"
    viewDate={moment()}
    // used by tests
    inputProps={{ name: field.name }}
  />;
};

export const SelectField: React.SFC<any> = ({ options, field, form, _value }) => {
  return <Select
    options={options}
    name={field.name}
    defaultValue={options[0]}
    value={options ? options.find((option: any) => option.value === field.value) : ""}
    maxMenuHeight={100}
    // eslint-disable-next-line react/jsx-no-bind
    onChange={(option: any) => form.setFieldValue(field.name, option.value)}
    onBlur={field.onBlur}
    className="react-select-container"
    classNamePrefix="react-select"
    styles={customStyles}
  />;
};

const setInitialFormValues = (): IFormValues => {
  const arc = getArc();
  const now = moment();

  const defaultValues: IFormValues = {
    rewardSplit: "",
    description: "",
    ethReward: 0,
    externalTokenAddress: arc.GENToken().address,
    externalTokenReward: 0,
    nativeTokenReward: 0,
    numWinners: 0,
    numberOfVotesPerVoter: 0,
    proposerIsAdmin: false,
    reputationReward: 0,
    compStartTimeInput: now, // testing ? undefined : now,
    suggestionEndTimeInput: now, // testing ? undefined : now,
    votingStartTimeInput: now, // testing ? undefined : now,
    compEndTimeInput: now, // testing ? undefined : now,
    title: "",
    url: "",
    tags: [],
  };

  return Object.freeze(defaultValues);
};

class CreateProposal extends React.Component<IProps, IStateProps> {

  formModalService: IFormModalService<IFormValues>;
  currentFormValues: IFormValues;

  constructor(props: IProps) {
    super(props);
    this.state = { tags: [] };
    this.formModalService = CreateFormModalService(
      "CreateCompetitionProposal",
      setInitialFormValues(),
      () => Object.assign(this.currentFormValues, this.state),
      (formValues: IFormValues, firstTime: boolean) => {
        this.currentFormValues = formValues;
        if (firstTime) { this.state = { tags: formValues.tags }; }
        else { this.setState({ tags: formValues.tags }); }
      },
      this.props.showNotification);
  }

  componentWillUnmount() {
    this.formModalService.saveCurrentValues();
  }

  public handleSubmit = async (values: IFormValues, { _setSubmitting }: any): Promise<void> => {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) {
      return;
    }

    const externalTokenDetails = tokenDetails(values.externalTokenAddress);
    let externalTokenReward;

    // If we know the decimals for the token then multiply by that
    if (externalTokenDetails) {
      externalTokenReward = toBaseUnit(values.externalTokenReward.toString(), externalTokenDetails.decimals);
      // Otherwise just convert to Wei and hope for the best
    } else {
      externalTokenReward = toWei(Number(values.externalTokenReward));
    }


    // TODO: reward split should be fixed in arc.js for now split here
    let rewardSplit = [];
    if (values.rewardSplit === "") {
      const unit = 100.0 / Number(values.numWinners);
      rewardSplit = Array(values.numWinners).fill(unit);
    } else {
      rewardSplit = values.rewardSplit.split(",").map((s: string) => Number(s));
    }
    let reputationReward = toWei(Number(values.reputationReward));

    // This is a workaround around https://github.com/daostack/arc/issues/712
    // which was for contract versions rc.40. It is resolved in rc.41
    if (reputationReward.isZero()) {
      reputationReward = new BN(1);
    }
    // Parameters to be passed to arc.js
    const proposalOptions: IProposalCreateOptionsComp = {
      dao: this.props.daoAvatarAddress,
      description: values.description,
      endTime: values.compEndTimeInput.toDate(),
      ethReward: toWei(Number(values.ethReward)),
      externalTokenReward,
      nativeTokenReward: toWei(Number(values.nativeTokenReward)),
      numberOfVotesPerVoter: Number(values.numberOfVotesPerVoter),
      proposerIsAdmin: values.proposerIsAdmin,
      reputationReward,
      rewardSplit,
      plugin: this.props.plugin.coreState.address,
      startTime: values.compStartTimeInput.toDate(),
      suggestionsEndTime: values.suggestionEndTimeInput.toDate(),
      tags: this.state.tags,
      title: values.title,
      votingStartTime: values.votingStartTimeInput.toDate(),
    };

    await this.props.createProposal(proposalOptions);
    this.props.handleClose();
  }

  private onTagsChange = (tags: string[]): void => {
    this.setState({ tags });
  }

  public render(): RenderOutput {
    const { data, handleClose } = this.props;

    if (!data) {
      return null;
    }
    const dao = data;
    const localTimezone = getLocalTimezone();

    return (
      <div className={css.containerNoSidebar}>
        <Formik
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          initialValues={this.currentFormValues}
          // eslint-disable-next-line react/jsx-no-bind
          validate={(values: IFormValues): void => {
            const errors: any = {};

            this.currentFormValues = values;

            const require = (name: string): void => {
              if (!(values as any)[name]) {
                errors[name] = "Required";
              }
            };

            const nonNegative = (name: string): void => {
              if ((values as any)[name] < 0) {
                errors[name] = "Please enter a non-negative value";
              }
            };

            const nonZero = (name: string): void => {
              if ((values as any)[name] === 0) {
                errors[name] = "Please enter a non-zero value";
              }
            };

            if (values.title.length > 120) {
              errors.title = "Title is too long (max 120 characters)";
            }

            // Check rewardSplit add upto 100 and number of winners match the winner distribution
            if (values.rewardSplit !== "") {
              const split = values.rewardSplit.split(",");

              if (split.length !== values.numWinners) {
                errors.numWinners = "Number of winners should match the winner distribution";
              }

              if (!checkTotalPercent(split))
                errors.rewardSplit = "Please provide reward split summing upto 100";
            } else {
              const unit = (100.0 / Number(values.numWinners)).toFixed(4);
              if ((Number(unit)) * values.numWinners !== 100.0)
                errors.rewardSplit = "Please provide reward split summing upto 100 or use num winner that can have equal split";
            }

            // Number of winners less than MAX_NUMBER_OF_WINNERS
            if (values.numWinners > MAX_NUMBER_OF_WINNERS) {
              errors.numWinners = "Number of winners should be max 100";
            }

            const now = moment();
            // Check valid time
            const compStartTimeInput = values.compStartTimeInput;
            const compEndTimeInput = values.compEndTimeInput;
            const votingStartTimeInput = values.votingStartTimeInput;
            const suggestionEndTimeInput = values.suggestionEndTimeInput;

            if (!(compStartTimeInput instanceof moment)) {
              errors.compStartTimeInput = "Invalid datetime format";
            } else {
              if (compStartTimeInput && compStartTimeInput.isSameOrBefore(now)) {
                errors.compStartTimeInput = "Competition must start in the future";
              }
            }

            if (!(suggestionEndTimeInput instanceof moment)) {
              errors.suggestionEndTimeInput = "Invalid datetime format";
            } else {
              if (suggestionEndTimeInput && (suggestionEndTimeInput.isSameOrBefore(compStartTimeInput))) {
                errors.suggestionEndTimeInput = "Submission period must end after competition starts";
              }
            }

            if (!(votingStartTimeInput instanceof moment)) {
              errors.votingStartTimeInput = "Invalid datetime format";
            } else {
              if (votingStartTimeInput && suggestionEndTimeInput && (votingStartTimeInput.isBefore(suggestionEndTimeInput))) {
                errors.votingStartTimeInput = "Voting must start on or after submission period ends";
              }
            }

            if (!(compEndTimeInput instanceof moment)) {
              errors.compEndTimeInput = "Invalid datetime format";
            } else {
              if (compEndTimeInput && compEndTimeInput.isSameOrBefore(votingStartTimeInput)) {
                errors.compEndTimeInput = "Competion must end after voting starts";
              }
            }

            if (!isValidUrl(values.url)) {
              errors.url = "Invalid URL";
            }

            nonNegative("ethReward");
            nonNegative("externalTokenReward");
            nonNegative("nativeTokenReward");
            nonNegative("numWinners");
            nonNegative("numberOfVotesPerVoter");

            nonZero("numWinners");
            nonZero("numberOfVotesPerVoter");

            require("description");
            require("title");
            require("numWinners");
            require("numberOfVotesPerVoter");
            require("compStartTimeInput");
            require("compEndTimeInput");
            require("votingStartTimeInput");
            require("suggestionEndTimeInput");

            if (!values.ethReward && !values.reputationReward && !values.externalTokenReward && !values.nativeTokenReward) {
              errors.rewards = "Please select at least some reward";
            }

            return errors;
          }}
          onSubmit={this.handleSubmit}
          // eslint-disable-next-line react/jsx-no-bind
          render={({
            errors,
            touched,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            handleSubmit,
            isSubmitting,
            resetForm,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            setFieldTouched,
            setFieldValue,
          }: FormikProps<IFormValues>) =>
            <Form noValidate>
              <label className={css.description}>What to Expect</label>
              <div className={css.description}>This competition proposal can distribute funds, mint new DAO tokens, or assign Reputation. Additionally, you may determine how many winners are rewarded, as well as their proportional distribution.
                  Each proposal may specify one of each action, e.g. &quot;3 ETH and 100 Reputation in total rewards, 3 total winners, 50/25/25% reward distribution&quot;.</div>

              <TrainingTooltip overlay={i18next.t("Title Tooltip")} placement="right">
                <label htmlFor="titleInput">
                  <div className={css.requiredMarker}>*</div>
                  Title
                  <ErrorMessage name="title">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
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
                  <ErrorMessage name="description">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                </label>
              </TrainingTooltip>
              <Field
                component={MarkdownField}
                // eslint-disable-next-line react/jsx-no-bind
                onChange={(value: any) => { setFieldValue("description", value); }}
                id="descriptionInput"
                placeholder={i18next.t("Description Placeholder")}
                name="description"
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
                  <ErrorMessage name="url">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
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

              <div>
                <TrainingTooltip overlay="The anticipated number of winning Submissions for this competition" placement="right">
                  <label htmlFor="numWinnersInput">
                    <div className={css.requiredMarker}>*</div>
                    Number of winners
                    <ErrorMessage name="numWinners">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                </TrainingTooltip>

                <Field
                  id="numWinnersInput"
                  maxLength={120}
                  placeholder={"The anticipated number of winning Submissions for this competition"}
                  name="numWinners"
                  type="number"
                  className={touched.numWinners && errors.numWinners ? css.error : null}
                />
              </div>

              <div>
                <TrainingTooltip overlay="Percentage distribution of rewards to beneficiaries" placement="right">
                  <label htmlFor="rewardSplitInput">
                    Winner reward distribution (%)
                    <ErrorMessage name="rewardSplit">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                </TrainingTooltip>

                <Field
                  id="rewardSplitInput"
                  maxLength={120}
                  placeholder={"Reward split (like: \"30,10,60\", summing to 100)"}
                  name="rewardSplit"
                  type="number[]"
                  className={touched.rewardSplit && errors.rewardSplit ? css.error : null}
                />
              </div>

              <div>
                <TrainingTooltip overlay="Number of Submissions for which each member can vote" placement="right">
                  <label htmlFor="numVotesInput">
                    <div className={css.requiredMarker}>*</div>
                    Number of votes per reputation holder
                    <ErrorMessage name="numberOfVotesPerVoter">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                </TrainingTooltip>

                <Field
                  id="numVotesInput"
                  maxLength={120}
                  placeholder={"Number of Submissions for which each member can vote"}
                  name="numberOfVotesPerVoter"
                  type="number"
                  className={touched.numberOfVotesPerVoter && errors.numberOfVotesPerVoter ? css.error : null}
                />
              </div>

              <div className={css.proposerIsAdminCheckbox}>
                <TrainingTooltip overlay="You are the only account that will be able to create submissions" placement="right">
                  <label htmlFor="proposerIsAdmin">
                    <div className={css.requiredMarker}>*</div>
                    Submissions can only be created by you
                    <ErrorMessage name="proposerIsAdmin">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                </TrainingTooltip>
                <Field
                  id="proposerIsAdmin"
                  name="proposerIsAdmin"
                  type="checkbox"
                  checked={this.currentFormValues.proposerIsAdmin}
                  className={touched.proposerIsAdmin && errors.proposerIsAdmin ? css.error : null}
                />
              </div>

              <div className={css.rewards}>
                <div className={css.reward}>
                  <label htmlFor="ethRewardInput">
                    {baseTokenName()} Reward to split
                    <ErrorMessage name="ethReward">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    id="ethRewardInput"
                    placeholder={`How much ${baseTokenName()} to reward`}
                    name="ethReward"
                    type="number"
                    className={touched.ethReward && errors.ethReward ? css.error : null}
                    min={0}
                    step={0.1}
                  />
                </div>

                <div className={css.reward}>
                  <label htmlFor="reputationRewardInput">
                    Reputation Reward to split
                    <ErrorMessage name="reputationReward">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    id="reputationRewardInput"
                    placeholder="How much reputation to reward"
                    name="reputationReward"
                    type="number"
                    className={touched.reputationReward && errors.reputationReward ? css.error : null}
                    step={0.1}
                  />
                </div>

                <div className={css.reward}>
                  <label htmlFor="externalRewardInput">
                    External Token Reward to split
                    <ErrorMessage name="externalTokenReward">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <div className={css.externalTokenInput}>
                    <div className={css.amount}>
                      <Field
                        id="externalRewardInput"
                        placeholder={"How many tokens to reward"}
                        name="externalTokenReward"
                        type="number"
                        className={touched.externalTokenReward && errors.externalTokenReward ? css.error : null}
                        min={0}
                        step={0.1}
                      />
                    </div>
                    <div className={css.select}>
                      <Field
                        id="externalTokenAddress"
                        name="externalTokenAddress"
                        component={SelectField}
                        value={this.currentFormValues.externalTokenAddress}
                        options={Object.keys(supportedTokens()).map((tokenAddress) => {
                          const token = supportedTokens()[tokenAddress];
                          return { value: tokenAddress, label: token["symbol"] };
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className={css.reward}>
                  <label htmlFor="nativeTokenRewardInput">
                    DAO token ({dao.tokenSymbol}) Reward to split
                    <ErrorMessage name="nativeTokenReward">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    id="nativeTokenRewardInput"
                    maxLength={10}
                    placeholder="How many tokens to reward"
                    name="nativeTokenReward"
                    type="number"
                    className={touched.nativeTokenReward && errors.nativeTokenReward ? css.error : null}
                  />
                </div>
              </div>

              <div className={css.dates}>
                <div className={css.date}>
                  <label htmlFor="compStartTimeInput">
                    <div className={css.requiredMarker}>*</div>
                    Competition start time {localTimezone}
                    <ErrorMessage name="compStartTimeInput">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    name="compStartTimeInput"
                    component={CustomDateInput}
                    className={touched.compStartTimeInput && errors.compStartTimeInput ? css.error : null}
                  />
                </div>

                <div className={css.date}>
                  <label htmlFor="suggestionEndTimeInput">
                    <div className={css.requiredMarker}>*</div>
                    Submission end time {localTimezone}
                    <ErrorMessage name="suggestionEndTimeInput">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    name="suggestionEndTimeInput"
                    component={CustomDateInput}
                    className={touched.suggestionEndTimeInput && errors.suggestionEndTimeInput ? css.error : null}
                  />
                </div>

                <div className={css.date}>
                  <label htmlFor="votingStartTimeInput">
                    <div className={css.requiredMarker}>*</div>
                    Voting start time {localTimezone}
                    <ErrorMessage name="votingStartTimeInput">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    name="votingStartTimeInput"
                    component={CustomDateInput}
                    className={touched.votingStartTimeInput && errors.votingStartTimeInput ? css.error : null}
                  />
                </div>

                <div className={css.date}>
                  <label htmlFor="compEndTimeInput">
                    <div className={css.requiredMarker}>*</div>
                    Competition end time {localTimezone}
                    <ErrorMessage name="compEndTimeInput">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    name="compEndTimeInput"
                    component={CustomDateInput}
                    className={touched.compEndTimeInput && errors.compEndTimeInput ? css.error : null}
                  />
                </div>
              </div>

              {(touched.ethReward || touched.externalTokenReward || touched.reputationReward || touched.nativeTokenReward)
                && touched.reputationReward && errors.rewards &&
                <span className={css.errorMessage + " " + css.someReward}><br /> {errors.rewards}</span>
              }
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
          }
        />
      </div>
    );
  }
}

const SubscribedCreateContributionRewardExProposal = withSubscription({
  wrappedComponent: CreateProposal,
  checkForUpdate: ["daoAvatarAddress"],
  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    return arc.dao(props.daoAvatarAddress).state();
  },
});

export default connect(null, mapDispatchToProps)(SubscribedCreateContributionRewardExProposal);
