import { IDAOState, ISchemeState, IProposalCreateOptionsCompetition } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import { enableWalletProvider, getArc } from "arc";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import { supportedTokens, toBaseUnit, tokenDetails, toWei, isValidUrl, getLocalTimezone, inTesting } from "lib/util";
import * as React from "react";
import { connect } from "react-redux";
import Select from "react-select";
import { showNotification } from "reducers/notifications";
import TagsSelector from "components/Proposal/Create/SchemeForms/TagsSelector";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import * as css from "components/Proposal/Create/CreateProposal.scss";
import MarkdownField from "components/Proposal/Create/SchemeForms/MarkdownField";

import { checkTotalPercent } from "lib/util";
import DatePicker from "react-datepicker";

import moment = require("moment");

interface IExternalProps {
  scheme: ISchemeState;
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

const MAX_NUMBER_OF_WINNERS=100;

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
  compStartTimeInput: Date;
  compEndTimeInput: Date;
  suggestionEndTimeInput: Date;
  votingStartTimeInput: Date;

  [key: string]: any;
}

const customStyles = {
  indicatorSeparator: () => ({
    display: "none",
  }),
  menu: (provided: any) => ({
    ... provided,
    borderTop: "none",
    borderRadius: "0 0 5px 5px",
    marginTop: 1,
    backgroundColor: "rgba(255,255,255,1)",
  }),
};

const CustomDateInput: React.SFC<any> = ({ field, form }) => {
  const onChange = (date: Date) => { form.setFieldValue(field.name, date); };
  return <DatePicker
    id={field.name}
    selected={field.value}
    onChange={onChange}
    showTimeSelect
    timeFormat="HH:mm"
    timeIntervals={15}
    timeCaption="Time"
    dateFormat="MMMM d, yyyy h:mm aa"
    minDate={new Date()}
  />;
};

export const SelectField: React.SFC<any> = ({options, field, form, _value }) => {
  // value={options ? options.find((option: any) => option.value === field.value) : ""}
  return <Select
    options={options}
    name={field.name}
    defaultValue={options[0]}
    maxMenuHeight={100}
    onChange={(option: any) => form.setFieldValue(field.name, option.value)}
    onBlur={field.onBlur}
    className="react-select-container"
    classNamePrefix="react-select"
    styles={customStyles}
  />;
};

class CreateProposal extends React.Component<IProps, IStateProps> {

  constructor(props: IProps) {
    super(props);
    this.state = {
      tags: new Array<string>(),
    };
  }

  public handleSubmit = async (values: IFormValues, { _setSubmitting }: any ): Promise<void> => {
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


    // TODO: reward split should be fixed in client for now split here
    let rewardSplit = [];
    if (values.rewardSplit === "") {
      const unit = 100.0 / Number(values.numWinners);
      rewardSplit = Array(values.numWinners).fill(unit);
    } else {
      rewardSplit = values.rewardSplit.split(",").map((s: string) => Number(s));
    }

    // Parameters to be passed to client
    const proposalOptions: IProposalCreateOptionsCompetition  = {
      dao: this.props.daoAvatarAddress,
      description: values.description,
      endTime: values.compEndTimeInput,
      ethReward: toWei(Number(values.ethReward)),
      externalTokenReward,
      nativeTokenReward: toWei(Number(values.nativeTokenReward)),
      numberOfVotesPerVoter:  Number(values.numberOfVotesPerVoter),
      proposalType: "competition", // this makes `createPRoposal` create a competition rather then a 'normal' contributionRewardExt
      reputationReward: toWei(Number(values.reputationReward)),
      rewardSplit,
      scheme: this.props.scheme.address,
      startTime: values.compStartTimeInput,
      suggestionsEndTime: values.suggestionEndTimeInput,
      tags: this.state.tags,
      title: values.title,
      votingStartTime: values.votingStartTimeInput,
    };

    await this.props.createProposal(proposalOptions);
    this.props.handleClose();
  }

  private onTagsChange = (tags: string[]): void => {
    this.setState({tags});
  }

  private fnDescription = (<span>Short description of the proposal.<ul><li>What are you proposing to do?</li><li>Why is it important?</li><li>How much will it cost the DAO?</li><li>When do you plan to deliver the work?</li></ul></span>);

  public render(): RenderOutput {
    const { data, handleClose } = this.props;

    if (!data) {
      return null;
    }
    const dao = data;
    const arc = getArc();
    const localTimezone = getLocalTimezone();
    const now = new Date();
    const testing = inTesting();

    return (
      <div className={css.contributionReward}>
        <Formik
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          initialValues={{
            rewardSplit: "",
            description: "",
            ethReward: 0,
            externalTokenAddress: arc.GENToken().address,
            externalTokenReward: 0,
            nativeTokenReward: 0,
            numWinners: 0,
            numberOfVotesPerVoter: 0,
            reputationReward: 0,
            compStartTimeInput: testing ? undefined : now,
            suggestionEndTimeInput: testing ? undefined : now,
            votingStartTimeInput: testing ? undefined : now,
            compEndTimeInput: testing ? undefined : now,
            title: "",
            url: "",
          } as IFormValues}
          // eslint-disable-next-line react/jsx-no-bind
          validate={(values: IFormValues): void => {
            const errors: any = {};

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
              if((Number(unit)) * values.numWinners !== 100.0)
                errors.rewardSplit = "Please provide reward split summing upto 100 or use num winner that can have equal split";
            }

            // Number of winners less than MAX_NUMBER_OF_WINNERS
            if ( values.numWinners > MAX_NUMBER_OF_WINNERS) {
              errors.numWinners = "Number of winners should be max 100";
            }

            const now = moment();
            // Check valid time
            const compStartTimeInput = moment(values.compStartTimeInput);
            const compEndTimeInput = moment(values.compEndTimeInput);
            const votingStartTimeInput = moment(values.votingStartTimeInput);
            const suggestionEndTimeInput = moment(values.suggestionEndTimeInput);

            if (compStartTimeInput && compStartTimeInput.isBefore(now)) {
              errors.compStartTimeInput = "Competion start time cannot be in past";
            }

            if (compEndTimeInput && compEndTimeInput.isBefore(now)) {
              errors.compEndTimeInput = "Competion end time cannot be in past";
            }

            if (votingStartTimeInput && votingStartTimeInput.isBefore(now)) {
              errors.votingStartTimeInput = "Voting start time cannot be in past";
            }

            if (votingStartTimeInput && (votingStartTimeInput.isBefore(compStartTimeInput))) {
              errors.votingStartTimeInput = "Voting start time cannot be before competition start";
            }

            if (suggestionEndTimeInput && (suggestionEndTimeInput.isSameOrBefore(compStartTimeInput))) {
              errors.suggestionEndTimeInput = "Suggestion period start time cannot be before competition start";
            }

            if (suggestionEndTimeInput && suggestionEndTimeInput.isBefore(now)) {
              errors.suggestionEndTimeInput = "Suggestion period end time cannot be in past";
            }

            if (compEndTimeInput && compEndTimeInput.isSameOrBefore(votingStartTimeInput) || compEndTimeInput.isBefore(suggestionEndTimeInput)) {
              errors.compEndTimeInput = "Competion cannot end before voting starts or suggestion period ends";
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            setFieldTouched,
            setFieldValue,
          }: FormikProps<IFormValues>) =>
            <Form noValidate>
              <label className={css.description}>What to Expect</label>
              <div className={css.description}>This competition proposal can distribute funds, mint new DAO tokens, or assign Reputation. Additionally, you may determine how many winners are rewarded, as well as their proportional distribution.
                  Each proposal may specify one of each action, e.g. &quot;3 ETH and 100 Reputation in total rewards, 3 total winners, 50/25/25% reward distribution&quot;.</div>

              <TrainingTooltip overlay="The title is the header of the proposal card and will be the first visible information about your proposal" placement="right">
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
                placeholder="Summarize your proposal"
                name="title"
                type="text"
                className={touched.title && errors.title ? css.error : null}
              />

              <TrainingTooltip overlay={this.fnDescription} placement="right">
                <label htmlFor="descriptionInput">
                  <div className={css.requiredMarker}>*</div>
                  Description
                  <img className={css.infoTooltip} src="/assets/images/Icon/Info.svg"/>
                  <ErrorMessage name="description">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                </label>
              </TrainingTooltip>
              <Field
                component={MarkdownField}
                onChange={(value: any) => { setFieldValue("description", value); }}
                id="descriptionInput"
                placeholder="Describe your proposal in greater detail"
                name="description"
              />

              <TrainingTooltip overlay="Add some tags to give context about your proposal e.g. idea, signal, bounty, research, etc" placement="right">
                <label className={css.tagSelectorLabel}>
                Tags
                </label>
              </TrainingTooltip>

              <div className={css.tagSelectorContainer}>
                <TagsSelector onChange={this.onTagsChange}></TagsSelector>
              </div>

              <TrainingTooltip overlay="Link to the fully detailed description of your proposal" placement="right">
                <label htmlFor="urlInput">
                URL
                  <ErrorMessage name="url">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
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
                    Number of votes per voter
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

              <div className={css.rewards}>
                <div className={css.reward}>
                  <label htmlFor="ethRewardInput">
                    ETH Reward to split
                    <ErrorMessage name="ethReward">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    id="ethRewardInput"
                    placeholder="How much ETH to reward"
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
                    <ErrorMessage name="compStartTime">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    id="compStartTimeInput"
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
                    id="suggestionEndTimeInput"
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
                    id="votingStartTimeInput"
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
                    id="compEndTimeInput"
                    name="compEndTimeInput"
                    component={CustomDateInput}
                    className={touched.compEndTimeInput && errors.compEndTimeInput ? css.error : null}
                  />
                </div>
              </div>

              {(touched.ethReward || touched.externalTokenReward || touched.reputationReward || touched.nativeTokenReward)
                    && touched.reputationReward && errors.rewards &&
                <span className={css.errorMessage + " " + css.someReward}><br/> {errors.rewards}</span>
              }
              <div className={css.createProposalActions}>
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
