import { IDAOState, ISchemeState } from "@daostack/client";
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
import { ICrxRewarderProps } from "crxRegistry";
import * as css from "components/Proposal/Create/CreateProposal.scss";
import MarkdownField from "components/Proposal/Create/SchemeForms/MarkdownField";

import { checkTotalPercent, getUnixTimestamp } from "lib/util";

interface IExternalProps {
  rewarder: ICrxRewarderProps;
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
  reputationReward: number;
  title: string;
  url: string;

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

export const SelectField: React.SFC<any> = ({options, field, form }) => (
  <Select
    options={options}
    name={field.name}
    value={options ? options.find((option: any) => option.value === field.value) : ""}
    maxMenuHeight={100}
    onChange={(option: any) => form.setFieldValue(field.name, option.value)}
    onBlur={field.onBlur}
    styles={customStyles}
  />
);

class CreateContributionRewardExProposal extends React.Component<IProps, IStateProps> {

  constructor(props: IProps) {
    super(props);
    this.state = { 
      tags: new Array<string>(),
    };
  }

  public handleSubmit = async (values: IFormValues, { setSubmitting }: any ): Promise<void> => {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    const externalTokenDetails = tokenDetails(values.externalTokenAddress);
    let externalTokenReward;

    // If we know the decimals for the token then multiply by that
    if (externalTokenDetails) {
      externalTokenReward = toBaseUnit(values.externalTokenReward.toString(), externalTokenDetails.decimals);
    // Otherwise just convert to Wei and hope for the best
    } else {
      externalTokenReward = toWei(Number(values.externalTokenReward));
    }


    // Parameters to be passes to client
    const rewardSplit = values.rewardSplit.split(",");
    const startTime = new Date(values.compStartDate + " " + values.compStartTime)
    const votingStartTime = new Date(values.voteStartDate + " " +  values.voteStartTime)
    const suggestionsEndTime = new Date(values.compEndDate + " " +  values.compEndTime)
    const endTime = new Date(values.voteEndDate + " " +  values.voteEndTime)

    console.log(this.props.daoAvatarAddress)
    console.log(this.props.scheme.address)
    const proposalValues = {...values,
      scheme: this.props.scheme.address,
      dao: this.props.daoAvatarAddress,
      ethReward: toWei(Number(values.ethReward)),
      externalTokenReward,
      nativeTokenReward: toWei(Number(values.nativeTokenReward)),
      reputationReward: toWei(Number(values.reputationReward)),
      numberOfVotesPerVoter: Number(values.numVotes),
      tags: this.state.tags,
      beneficiaries: "0xffcf8fdee72ac11b5c542428b35eef5769c409f0",
      endTime,
      proposalType: 'competition',
      rewardSplit: rewardSplit.map(p => Number(p)),
      startTime,
      suggestionsEndTime,
      votingStartTime,
      value: 0
    };

    setSubmitting(false);
    await this.props.createProposal(proposalValues);
    this.props.handleClose();
  }

  private onTagsChange = (tags: string[]): void => {
    this.setState({tags});
  }

  public render(): RenderOutput {
    const { data, handleClose } = this.props;

    if (!data) {
      return null;
    }
    const dao = data;
    const arc = getArc();
    const halfs: string[] = ["00", "30"];
    const timeSlots: Record<string, string>[] = [];
    for(let i = 0; i < 24; i++){
      timeSlots.push({ value: i.toString().padStart(2, "0") + ":" + halfs[i%2], label: i.toString().padStart(2,"0") + ":" + halfs[i%2]});
    }

    const fnDescription = () => (<span>Short description of the proposal.<ul><li>What are you proposing to do?</li><li>Why is it important?</li><li>How much will it cost the DAO?</li><li>When do you plan to deliver the work?</li></ul></span>);

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
            reputationReward: 0,
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
            }

            // Check Valid Date and Time for Competition Start and End
            // Check Valid Date and Time for Vote Start and End
            if (values.compStartTime && values.compStartDate && values.voteStartTime && values.voteStartDate) {
              const compStart = getUnixTimestamp(values.compStartDate, values.compStartTime);
              const voteStart = getUnixTimestamp(values.voteStartDate, values.voteStartTime);
              const now = getUnixTimestamp();
              if (compStart < now) {
                errors.compStartDate = "Competion start date and time can't be in past";
                errors.compStartTime = "Competion start date and time can't be in past";
              }
              if (voteStart < compStart) {
                errors.voteStartDate = "Vote start date and time can't be in past";
                errors.voteStartTime = "Vote start date and time can't be in past";
              }
              const compEnd = getUnixTimestamp(values.compEndDate, values.compEndTime);
              const voteEnd = getUnixTimestamp(values.voteEndDate, values.voteEndTime);
              if (compEnd < compStart) {
                errors.compEndDate = "Competion end date and time can't be before start";
                errors.compEndTime = "Competion end date and time can't be in past";
              }
              if (voteEnd < voteStart) {
                errors.voteEndDate = "Vote end date and time can't be before start";
                errors.voteEndTime = "Vote end date and time can't be before start";
              }

            }

            if (!isValidUrl(values.url)) {
              errors.url = "Invalid URL";
            }

            nonNegative("ethReward");
            nonNegative("externalTokenReward");
            nonNegative("nativeTokenReward");
            nonNegative("numWinners");
            nonNegative("numVotes");

            nonZero("numWinners");
            nonZero("numVotes");

            require("description");
            require("title");
            require("numWinners");
            require("numVotes");
            require("compStartDate");
            require("compEndDate");
            require("compStartTime");
            require("compEndTime");
            require("voteStartDate");
            require("voteEndDate");
            require("voteStartTime");
            require("voteEndTime");

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
              <div className={css.description}>This proposal can send to multiple beneficiaries eth / erc20 token, mint new DAO tokens ({dao.tokenSymbol}) and mint / slash reputation in the DAO. Each proposal can have one of each of these actions. e.g. 100 rep for completing a project + 0.05 ETH for covering expenses.</div>
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

              <TrainingTooltip overlay={fnDescription} placement="right">
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
                className={touched.description && errors.description ? css.error : null}
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
                <TrainingTooltip overlay="Number of winnders of this competition" placement="right">
                  <label htmlFor="numWinnersInput">
                  Number of winners
                    <ErrorMessage name="numWinners">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                    <div className={css.requiredMarker}>*</div>
                  </label>
                </TrainingTooltip>
            
                <Field
                  id="numWinnersInput"
                  maxLength={120}
                  placeholder={"How many winners will this competition have"}
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
                    <div className={css.requiredMarker}>*</div>
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
                <TrainingTooltip overlay="Number of beneficiaries each members can vote for" placement="right">
                  <label htmlFor="numVotesInput">
                  Number of votes
                    <ErrorMessage name="numVotes">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                    <div className={css.requiredMarker}>*</div>
                  </label>
                </TrainingTooltip>
            
                <Field
                  id="numVotesInput"
                  maxLength={120}
                  placeholder={"How many beneficiaries can a member vote for"}
                  name="numVotes"
                  type="number"
                  className={touched.numVotes && errors.numVotes ? css.error : null}
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
                  <img src="/assets/images/Icon/down.svg" className={css.downV}/>
                  <label htmlFor="compStartDate">
                    Competition start time
                    <ErrorMessage name="compStartDate">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    id="compStartDateInput"
                    name="compStartDate"
                    type="date"
                    className={touched.startTime && errors.startTime ? css.error : null}
                  />
                  <div className={css.timeSelect}>
                    <Field
                      id="compStartTimeInput"
                      name="compStartTime"
                      type="time"
                      component={SelectField}
                      className={css.timeSelect}
                      options={timeSlots}
                    />
                  </div>
                </div>

                <div className={css.date}>
                  <img src="/assets/images/Icon/down.svg" className={css.downV}/>
                  <label htmlFor="compEndDate">
                    Competition end time
                    <ErrorMessage name="compEndDate">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    id="compEndDateInput"
                    name="compEndDate"
                    type="date"
                    className={touched.endDate && errors.endDate ? css.error : null}
                  />
                  <div className={css.timeSelect}>
                    <Field
                      id="compEndTimeInput"
                      name="compEndTime"
                      type="time"
                      component={SelectField}
                      className={css.timeSelect}
                      options={timeSlots}
                    />
                  </div>
                </div>

                <div className={css.date}>
                  <img src="/assets/images/Icon/down.svg" className={css.downV}/>
                  <label htmlFor="voteStartDate">
                    Competition start time
                    <ErrorMessage name="voteStartDate">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    id="voteStartDateInput"
                    name="voteStartDate"
                    type="date"
                    className={touched.startTime && errors.startTime ? css.error : null}
                  />
                  <div className={css.timeSelect}>
                    <Field
                      id="voteStartTimeInput"
                      name="voteStartTime"
                      type="time"
                      component={SelectField}
                      className={css.timeSelect}
                      options={timeSlots}
                    />
                  </div>
                </div>

                <div className={css.date}>
                  <img src="/assets/images/Icon/down.svg" className={css.downV}/>
                  <label htmlFor="voteEndDate">
                    Competition end time
                    <ErrorMessage name="voteEndDate">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    id="voteEndDateInput"
                    name="voteEndDate"
                    type="date"
                    className={touched.endDate && errors.endDate ? css.error : null}
                  />
                  <div className={css.timeSelect}>
                    <Field
                      id="voteEndTimeInput"
                      name="voteEndTime"
                      type="time"
                      component={SelectField}
                      className={css.timeSelect}
                      options={timeSlots}
                    />
                  </div>
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
  wrappedComponent: CreateContributionRewardExProposal,
  checkForUpdate: ["daoAvatarAddress"],
  createObservable: (props: IExternalProps) => {
    const arc = getArc(); // TODO: maybe we pass in the arc context from withSubscription instead of creating one every time?
    return arc.dao(props.daoAvatarAddress).state();
  },
});

export default connect(null, mapDispatchToProps)(SubscribedCreateContributionRewardExProposal);
