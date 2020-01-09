import { IDAOState, ISchemeState , IProposalCreateOptionsCompetition, 
} from "@daostack/client";
import * as arcActions from "actions/arcActions";
import { enableWalletProvider, getArc } from "arc";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import { supportedTokens, toBaseUnit, tokenDetails, toWei, isValidUrl } from "lib/util";
import * as React from "react";
import { connect } from "react-redux";
import Select from "react-select";
import { showNotification } from "reducers/notifications";
import TagsSelector from "components/Proposal/Create/SchemeForms/TagsSelector";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import * as css from "components/Proposal/Create/CreateProposal.scss";
import MarkdownField from "components/Proposal/Create/SchemeForms/MarkdownField";

import { checkTotalPercent, addSeconds } from "lib/util";

import {
  DateTimePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";

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
  compStartTime: Date;
  compEndTime: Date;
  suggestionEndTime: Date;
  votingStartTime: Date;

  [key: string]: any;
}

const customStyles = {
  control: () => ({
    // none of react-select's styles are passed to <Control />
    width: 117,
    height: 35,
  }),
  indicatorsContainer: () => ({
    display: "none",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  input: () => ({
    height: 31,
    marginTop: 0,
    marginBottom: 0,
  }),
  valueContainer: () => ({
    height: 35,
  }),
  menu: (provided: any) => ({
    ... provided,
    borderTop: "none",
    borderRadius: "0 0 5px 5px",
    marginTop: 1,
    backgroundColor: "rgba(255,255,255,1)",
  }),
};

const CustomDateInput: React.SFC<any> = ({
  field,
  form,
}) => (
  <MuiPickersUtilsProvider utils={DateFnsUtils}>
    <DateTimePicker
      value={field.value}
      onChange={date => form.setFieldValue(field.name, date)}
    />
  </MuiPickersUtilsProvider>
);

export const SelectField: React.SFC<any> = ({options, field, form, _value }) => {
  // value={options ? options.find((option: any) => option.value === field.value) : ""}
  return <Select
    options={options}
    name={field.name}
    defaultValue={options[0]}
    maxMenuHeight={100}
    onChange={(option: any) => form.setFieldValue(field.name, option.value)}
    onBlur={field.onBlur}
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

    // TODO: client should accept null compStartTime
    if (!values.compStartTime) {
      // If no start time then set to now + 15sec
      values.compStartTime = addSeconds(new Date(), 15000);
    }

    // Parameters to be passed to client
    const proposalOptions: IProposalCreateOptionsCompetition  = {
      dao: this.props.daoAvatarAddress,
      description: values.description,
      endTime: values.compEndTime,
      ethReward: toWei(Number(values.ethReward)),
      externalTokenReward,
      nativeTokenReward: toWei(Number(values.nativeTokenReward)),
      numberOfVotesPerVoter:  Number(values.numberOfVotesPerVoter),
      proposalType: "competition", // this makes `createPRoposal` create a competition rather then a 'normal' contributionRewardExt
      reputationReward: toWei(Number(values.reputationReward)),
      rewardSplit,
      scheme: this.props.scheme.address,
      startTime: values.compStartTime,
      suggestionsEndTime: values.suggestionEndTime,
      tags: this.state.tags,
      title: values.title,
      votingStartTime: values.votingStartTime,
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
            compStartTime: null,
            suggestionEndTime: new Date(),
            votingStartTime: new Date(),
            compEndTime: new Date(),
            title: "",
            url: "",
          } as IFormValues}
          // eslint-disable-next-line react/jsx-no-bind
          validate={(values: IFormValues): void => {
            //console.log(values)
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

            const now = new Date();
            // Check valid time
            if (values.compStartTime && values.compStartTime < now) {
              errors.compStartTime = "Competion start time can't be in past";
            }

            if (values.compEndTime < now) {
              errors.compEndTime = "Competion end time should not be in past";
            }

            if (values.votingStartTime < now) {
              errors.votingStartTime = "Voting start time should not be in past";
            }

            if (values.compStartTime && (values.votingStartTime < values.compStartTime)) {
              errors.votingStartTime = "Voting start time should not be before competition start";
            }

            if (values.compStartTime && (values.suggestionEndTime <= values.compStartTime)) {
              errors.suggestionEndTime = "Voting start time should not be before competition start";
            }

            if (values.suggestionEndTime && values.suggestionEndTime < now) {
              errors.suggestionEndTime = "Submission end time should not be in past";
            }

            if ( values.compEndTime < values.votingStartTime || values.compEndTime < values.suggestionEndTime) {
              errors.compEndTime = "Competion should not end before voting starts or submission ends";
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
            require("compEndTime");
            require("votingStartTime");
            require("suggestionEndTime");

            if (!values.ethReward && !values.reputationReward && !values.externalTokenReward && !values.nativeTokenReward) {
              errors.rewards = "Please select at least some reward";
            }
            console.log(errors);

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
                Title
                  <ErrorMessage name="title">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  <div className={css.requiredMarker}>*</div>
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
                Description
                  <div className={css.requiredMarker}>*</div>
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
                  Number of winners
                    <ErrorMessage name="numWinners">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                    <div className={css.requiredMarker}>*</div>
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
                  Number of votes
                    <ErrorMessage name="numberOfVotesPerVoter">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                    <div className={css.requiredMarker}>*</div>
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

              <div className={css.clearfix}>
                <div className={css.reward}>
                  <label htmlFor="ethRewardInput">
                    ETH Reward
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
                    Reputation Reward
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
                  <img src="/assets/images/Icon/down.svg" className={css.downV}/>
                  <label htmlFor="externalRewardInput">
                    External Token Reward
                    <ErrorMessage name="externalTokenReward">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    id="externalTokenRewardInput"
                    placeholder={"How many tokens to reward"}
                    name="externalTokenReward"
                    type="number"
                    className={touched.externalTokenReward && errors.externalTokenReward ? css.error : null}
                    min={0}
                    step={0.1}
                  />
                  <div className={css.externalTokenSelect}>
                    <Field
                      id="externalTokenInput"
                      name="externalTokenAddress"
                      component={SelectField}
                      className={css.externalTokenSelect}
                      options={Object.keys(supportedTokens()).map((tokenAddress) => {
                        const token = supportedTokens()[tokenAddress];
                        return { value: tokenAddress, label: token["symbol"] };
                      })}
                    />
                  </div>
                </div>

                <div className={css.reward}>
                  <label htmlFor="nativeTokenRewardInput">
                    DAO token ({dao.tokenSymbol}) Reward
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

                <div className={css.date}>
                  <label htmlFor="compStartTimeInput">
                    Competition start time
                    <ErrorMessage name="compStartTime">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    id="compStartTimeInput"
                    name="compStartTime"
                    component={CustomDateInput}
                    className={touched.compStartTime && errors.compStartTime ? css.error : null}
                  />
                </div>

                <div className={css.date}>
                  <label htmlFor="suggestionEndTimeInput">
                    Submission end time
                    <ErrorMessage name="suggestionEndTime">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                    <div className={css.requiredMarker}>*</div>
                  </label>
                  <Field
                    id="suggestionEndTimeInput"
                    name="suggestionEndTime"
                    component={CustomDateInput}
                    className={touched.suggestionEndTime && errors.suggestionEndTime ? css.error : null}
                  />
                </div>

                <div className={css.date}>
                  <label htmlFor="votingStartTimeInput">
                    Voting start time
                    <ErrorMessage name="votingStartTime">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                    <div className={css.requiredMarker}>*</div>
                  </label>
                  <Field
                    id="votingStartTimeInput"
                    name="votingStartTime"
                    component={CustomDateInput}
                    className={touched.votingStartTime && errors.votingStartTime ? css.error : null}
                  />
                </div>

                <div className={css.date}>
                  <label htmlFor="compEndTimeInput">
                    Competition end time
                    <div className={css.requiredMarker}>*</div>
                    <ErrorMessage name="compEndTime">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    id="compEndTimeInput"
                    name="compEndTime"
                    component={CustomTimeInput}
                    className={touched.compEndTime && errors.compEndTime ? css.error : null}
                  />
                </div>

                {(touched.ethReward || touched.externalTokenReward || touched.reputationReward || touched.nativeTokenReward)
                    && touched.reputationReward && errors.rewards &&
                <span className={css.errorMessage + " " + css.someReward}><br/> {errors.rewards}</span>
                }
              </div>
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
