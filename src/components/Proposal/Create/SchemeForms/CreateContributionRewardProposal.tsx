import * as React from "react";
import { connect } from "react-redux";
import { IDAOState, ISchemeState, Address } from "@daostack/arc.js";
import { createProposal } from "@store/arc/arcActions";
import { enableWalletProvider } from "arc";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import UserSearchField from "components/Shared/UserSearchField";
import TagsSelector from "components/Proposal/Create/SchemeForms/TagsSelector";
import Analytics from "lib/analytics";
import { baseTokenName, supportedTokens, toBaseUnit, tokenDetails, toWei, isValidUrl, isAddress, getArcByDAOAddress, getNetworkByDAOAddress } from "lib/util";
import { showNotification, NotificationStatus } from "@store/notifications/notifications.reducer";
import { exportUrl, importUrlValues } from "lib/proposalUtils";
import * as css from "components/Proposal/Create/CreateProposal.scss";
import MarkdownField from "./MarkdownField";
import HelpButton from "components/Shared/HelpButton";

const Select = React.lazy(() => import("react-select"));

interface IExternalProps {
  currentAccountAddress: Address;
  scheme: ISchemeState;
  daoAvatarAddress: string;
  handleClose: () => any;
}

interface IStateProps {
  tags: Array<string>;
}

interface IDispatchProps {
  createProposal: typeof createProposal;
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  createProposal,
  showNotification,
};

type IProps = IExternalProps & IDispatchProps & ISubscriptionProps<IDAOState>;

interface IFormValues {
  beneficiary: string;
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

export const SelectField: React.SFC<any> = ({options, field, form }) => (
  <React.Suspense fallback={<div>Loading...</div>}>
    <Select
      options={options}
      name={field.name}
      value={options ? options.find((option: any) => option.value === field.value) : ""}
      maxMenuHeight={100}
      onChange={(option: any) => form.setFieldValue(field.name, option.value)}
      onBlur={field.onBlur}
      className="react-select-container"
      classNamePrefix="react-select"
      styles={customStyles}
    />
  </React.Suspense>
);

class CreateContributionReward extends React.Component<IProps, IStateProps> {

  initialFormValues: IFormValues;

  constructor(props: IProps) {
    super(props);
    this.initialFormValues = importUrlValues<IFormValues>({
      beneficiary: "",
      description: "",
      ethReward: 0,
      externalTokenAddress: getArcByDAOAddress(props.daoAvatarAddress).GENToken().address,
      externalTokenReward: 0,
      nativeTokenReward: 0,
      reputationReward: 0,
      title: "",
      url: "",
      tags: [],
    });
    this.state = {
      tags: this.initialFormValues.tags,
    };
  }

  public handleSubmit = async (values: IFormValues, { setSubmitting }: any ): Promise<void> => {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification }, getNetworkByDAOAddress(this.props.daoAvatarAddress))) { return; }

    if (!values.beneficiary) {
      values.beneficiary = this.props.currentAccountAddress;
    }

    if (!values.beneficiary.startsWith("0x")) { values.beneficiary = "0x" + values.beneficiary; }

    const externalTokenDetails = tokenDetails(values.externalTokenAddress, getNetworkByDAOAddress(this.props.daoAvatarAddress));
    let externalTokenReward;

    // If we know the decimals for the token then multiply by that
    if (externalTokenDetails) {
      externalTokenReward = toBaseUnit(values.externalTokenReward.toString(), externalTokenDetails.decimals);
    // Otherwise just convert to Wei and hope for the best
    } else {
      externalTokenReward = toWei(Number(values.externalTokenReward));
    }

    const proposalValues = {...values,
      scheme: this.props.scheme.address,
      dao: this.props.daoAvatarAddress,
      ethReward: toWei(Number(values.ethReward)),
      externalTokenReward,
      nativeTokenReward: toWei(Number(values.nativeTokenReward)),
      reputationReward: toWei(Number(values.reputationReward)),
      tags: this.state.tags,
    };

    setSubmitting(false);
    await this.props.createProposal(proposalValues, this.props.daoAvatarAddress);

    Analytics.track("Submit Proposal", {
      "DAO Address": this.props.daoAvatarAddress,
      "Proposal Title": values.title,
      "Scheme Address": this.props.scheme.address,
      "Scheme Name": this.props.scheme.name,
      "Reputation Requested": values.reputationReward,
      "ETH Requested": values.ethReward,
      "External Token Requested": values.externalTokenAddress,
      "DAO Token Requested": values.externalTokenReward,
      "Tags": proposalValues.tags,
    });

    this.props.handleClose();
  }

  // Exports data from form to a shareable url.
  public exportFormValues(values: IFormValues) {
    exportUrl({ ...values, ...this.state });
    this.props.showNotification(NotificationStatus.Success, "Exportable url is now in clipboard :)");
  }

  private onTagsChange = () => (tags: string[]): void => {
    this.setState({ tags });
  }

  public render(): RenderOutput {
    const { data, daoAvatarAddress, handleClose } = this.props;

    if (!data) {
      return null;
    }
    const dao = data;

    return (
      <div className={css.containerNoSidebar}>
        <Formik
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          initialValues={this.initialFormValues}
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
                errors[name] = "Please enter a non-negative reward";
              }
            };

            if (values.title.length > 120) {
              errors.title = "Title is too long (max 120 characters)";
            }

            if (values.beneficiary && !isAddress(values.beneficiary)) {
              errors.beneficiary = "Invalid address";
            }

            if (!isValidUrl(values.url)) {
              errors.url = "Invalid URL";
            }

            nonNegative("ethReward");
            nonNegative("externalTokenReward");
            nonNegative("nativeTokenReward");

            require("description");
            require("title");

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
            isSubmitting,
            setFieldTouched,
            setFieldValue,
            values,
          }: FormikProps<IFormValues>) =>
            <Form noValidate>
              <div className={css.description}>This proposal can send eth / erc20 token, mint new DAO tokens ({dao.tokenSymbol}) and mint / slash reputation in the DAO. Each proposal can have one of each of these actions. e.g. 100 rep for completing a project + 0.05 ETH for covering expenses.</div>
              <label htmlFor="titleInput">
                <div className={css.requiredMarker}>*</div>
                Title
                <ErrorMessage name="title">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
              </label>
              <Field
                autoFocus
                id="titleInput"
                maxLength={120}
                placeholder="Summarize your proposal"
                name="title"
                type="text"
                className={touched.title && errors.title ? css.error : null}
              />
              <label htmlFor="descriptionInput">
                <div className={css.proposalDescriptionLabelText}>
                  <div className={css.requiredMarker}>*</div>
                  <div className={css.body}>Description</div><HelpButton text={HelpButton.helpTextProposalDescription} />
                </div>
                <ErrorMessage name="description">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
              </label>
              <Field
                component={MarkdownField}
                onChange={(value: any) => { setFieldValue("description", value); }}
                id="descriptionInput"
                placeholder="Describe your proposal in greater detail"
                name="description"
                className={touched.description && errors.description ? css.error : null}
              />
              <label className={css.tagSelectorLabel}>Tags</label>
              <div className={css.tagSelectorContainer}>
                <TagsSelector onChange={this.onTagsChange()} tags={this.state.tags} arc={getArcByDAOAddress(dao.address)}></TagsSelector>
              </div>

              <label htmlFor="urlInput">
                URL
                <ErrorMessage name="url">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
              </label>
              <Field
                id="urlInput"
                maxLength={120}
                placeholder="Description URL"
                name="url"
                type="text"
                className={touched.url && errors.url ? css.error : null}
              />

              <div>
                <label htmlFor="beneficiary">
                  Recipient, if not you
                  <ErrorMessage name="beneficiary">{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                </label>

                <UserSearchField
                  daoAvatarAddress={daoAvatarAddress}
                  name="beneficiary"
                  onBlur={(touched) => { setFieldTouched("beneficiary", touched); }}
                  onChange={(newValue) => { setFieldValue("beneficiary", newValue); }}
                  defaultValue={this.initialFormValues.beneficiary}
                  placeholder={this.props.currentAccountAddress}
                />
              </div>

              <div className={css.rewards}>
                <div className={css.reward}>
                  <label htmlFor="ethRewardInput">
                    {baseTokenName(getNetworkByDAOAddress(dao.address))} Reward
                    <ErrorMessage name="ethReward">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                  </label>
                  <Field
                    id="ethRewardInput"
                    placeholder={`How much ${baseTokenName(getNetworkByDAOAddress(dao.address))} to reward`}
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
                  <label htmlFor="externalRewardInput">
                    External Token Reward
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
                        options={Object.keys(supportedTokens(getNetworkByDAOAddress(dao.address))).map((tokenAddress) => {
                          const token = supportedTokens(getNetworkByDAOAddress(dao.address))[tokenAddress];
                          return { value: tokenAddress, label: token["symbol"] };
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className={daoAvatarAddress === "0x519b70055af55a007110b4ff99b0ea33071c720a" ? css.hidden : css.reward}>
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

                {(touched.ethReward || touched.externalTokenReward || touched.reputationReward || touched.nativeTokenReward)
                    && touched.reputationReward && errors.rewards &&
                  <span className={css.errorMessage + " " + css.someReward}><br/> {errors.rewards}</span>
                }
              </div>
              <div className={css.createProposalActions}>
                <button id="export-proposal" className={css.exportProposal} type="button" onClick={() => this.exportFormValues(values)}>
                  <img src="/assets/images/Icon/share-blue.svg" />
                </button>
                <button className={css.exitProposalCreation} type="button" onClick={handleClose}>Cancel</button>
                <button className={css.submitProposal} type="submit" disabled={isSubmitting}>Submit proposal</button>
              </div>
            </Form>
          }
        />
      </div>
    );
  }
}

const SubscribedCreateContributionReward = withSubscription({
  wrappedComponent: CreateContributionReward,
  checkForUpdate: ["daoAvatarAddress"],
  createObservable: (props: IExternalProps) => {
    const arc = getArcByDAOAddress(props.daoAvatarAddress);
    return arc.dao(props.daoAvatarAddress).state();
  },
});

export default connect(null, mapDispatchToProps)(SubscribedCreateContributionReward);
