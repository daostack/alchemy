import { ISchemeState } from "@daostack/arc.js";
import { createProposal } from "actions/arcActions";
import { enableWalletProvider } from "arc";
import { ErrorMessage, Field, Form, Formik, FormikProps, FieldArray } from "formik";
import Analytics from "lib/analytics";
import * as React from "react";
import { connect } from "react-redux";
import { showNotification, NotificationStatus } from "reducers/notifications";
import { baseTokenName, isValidUrl, isAddress, linkToEtherScan, getContractName, toWei } from "lib/util";
import { exportUrl, importUrlValues } from "lib/proposalUtils";
import TagsSelector from "components/Proposal/Create/SchemeForms/TagsSelector";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import * as css from "../CreateProposal.scss";
import MarkdownField from "./MarkdownField";
import HelpButton from "components/Shared/HelpButton";
import { getABIByContract, extractABIMethods, encodeABI } from "./ABIService";
import * as Validators from "./Validators";

interface IExternalProps {
  daoAvatarAddress: string;
  handleClose: () => any;
  scheme: ISchemeState;
  whitelistedContracts: Array<string>;
}

interface IDispatchProps {
  createProposal: typeof createProposal;
  showNotification: typeof showNotification;
}

type AddContractError = "NOT_VALID_ADDRESS" | "CONTRACT_EXIST" | "ABI_DATA_ERROR" | "";

interface IAddContractStatus {
  error: AddContractError;
  message: string;
}

interface IStateProps {
  loading: boolean;
  tags: Array<string>;
  addContractStatus: IAddContractStatus;
  whitelistedContracts: Array<string>;
  userContracts: Array<string>;
}

type IProps = IExternalProps & IDispatchProps;

const mapDispatchToProps = {
  createProposal,
  showNotification,
};

interface IContract {
  address: string; // Contract address
  value: number; // Token to send with the proposal
  abi: any; // Contract ABI data
  methods: any; // ABI write methods
  method: string; // Selected method
  params: any; // Method params
  values: any; // Params values
  callData: string; // The encoded data
}

interface IFormValues {
  description: string;
  title: string;
  url: string;
  contracts: Array<IContract>;
  [key: string]: any;
}

/**
 * Given an array input type returns an input example string.
 * @param {string} type The input type (e.g. unit256[], bool[], address[], ...)
 * @returns {string} Input example string
 */
const typeArrayPlaceholder = (type: string): string => {
  if (Validators.isAddressType(type)) {
    return "e.g: [\"0xACa94ef8bD5ffEE41947b4585a84BdA5a3d3DA6E\",\"0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e\"]";
  }

  if (Validators.isBooleanType(type)) {
    return "e.g: [true, false, false, true]";
  }

  if (Validators.isUintType(type)) {
    return "e.g: [1000, 212, 320000022, 23]";
  }

  if (Validators.isIntType(type)) {
    return "e.g: [1000, -212, 1232, -1]";
  }

  if (Validators.isByteType(type)) {
    return "e.g: [\"0xc00000000000000000000000000000000000\", \"0xc00000000000000000000000000000000001\"]";
  }

  return "e.g: [\"first value\", \"second value\", \"third value\"]";
};

class CreateGenericMultiCallScheme extends React.Component<IProps, IStateProps> {

  initialFormValues: IFormValues;

  constructor(props: IProps) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.initialFormValues = importUrlValues<IFormValues>({
      description: "",
      title: "",
      url: "",
      tags: [],
      addContract: "",
      userContracts: [],
      contracts: [
        {
          address: "",
          value: 0,
          abi: [],
          methods: [],
          method: "",
          params: [],
          values: [],
          callData: "",
        },
      ],
    });
    this.state = {
      loading: false,
      tags: this.initialFormValues.tags,
      addContractStatus: { error: "", message: "" },
      whitelistedContracts: this.props.whitelistedContracts?.map(contract => { return contract.toLowerCase(); }) ?? [],
      userContracts: [],
    };
  }

  public async handleSubmit(formValues: IFormValues, { setSubmitting }: any): Promise<void> {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    const contractsToCall = [];
    const callsData = [];
    const values = [];

    for (const contract of formValues.contracts) {
      contractsToCall.push(contract.address);
      callsData.push(contract.callData);
      values.push(toWei(Number(contract.value)).toString());
    }

    const proposalValues = {
      title: formValues.title,
      description: formValues.description,
      contractsToCall: contractsToCall,
      callsData: callsData,
      values: values,
      url: formValues.url,
      dao: this.props.daoAvatarAddress,
      scheme: this.props.scheme.address,
      tags: this.state.tags,
    };

    setSubmitting(false);
    await this.props.createProposal(proposalValues, this.props.daoAvatarAddress);

    Analytics.track("Submit Proposal", {
      "DAO Address": this.props.daoAvatarAddress,
      "Proposal Title": formValues.title,
      "Scheme Address": this.props.scheme.address,
      "Scheme Name": this.props.scheme.name,
    });

    this.props.handleClose();
  }

  // Exports data from form to a shareable url.
  public exportFormValues(values: IFormValues) {
    exportUrl({ ...values, ...this.state });
    this.props.showNotification(NotificationStatus.Success, "Exportable url is now in clipboard :)");
  }

  private onTagsChange = (tags: any[]): void => {
    this.setState({ tags });
  }

  /**
 * Given a contract address, checks whether it's valid, not exists in the current contract list and that the contract is verified with valid ABI data and write methods.
 * If all checks are okay, pushes the contract address to the contract lists, otherwise returns an appropriate message.
 * @param {string} contractToCall
 */
  private verifyContract = async (contractToCall: string) => {
    const addContractStatus: IAddContractStatus = {
      error: "",
      message: "",
    };

    const setAddContractStatus = (errorType: AddContractError, message: string) => {
      addContractStatus.error = errorType;
      addContractStatus.message = message;
    };

    if (contractToCall === "") {
      setAddContractStatus("", "");
    } else if (!isAddress(contractToCall)) {
      setAddContractStatus("NOT_VALID_ADDRESS", "Please enter a valid address");
    } else if (this.state.userContracts.includes(contractToCall)) {
      setAddContractStatus("CONTRACT_EXIST", "Contract already exist!");
    } else {
      this.setState({ loading: true });
      const abiData = await getABIByContract(contractToCall);
      const abiMethods = extractABIMethods(abiData);
      if (abiMethods.length > 0) {
        this.state.userContracts.push(contractToCall);
        setAddContractStatus("", "Contract added successfully!");
      } else {
        setAddContractStatus("ABI_DATA_ERROR", abiData.length === 0 ? "No ABI found for target contract, please verify the " : "No write methods found for target ");
      }
    }
    this.setState({ loading: false, addContractStatus: addContractStatus });
  }

  private getContractABI = async (contractToCall: string, setFieldValue: any, index: number) => {
    setFieldValue(`contracts.${index}.method`, ""); // reset
    setFieldValue(`contracts.${index}.callData`, ""); // reset
    const abiData = await getABIByContract(contractToCall);
    const abiMethods = extractABIMethods(abiData);
    setFieldValue(`contracts.${index}.abi`, abiData);
    setFieldValue(`contracts.${index}.methods`, abiMethods);
  }

  private getMethodInputs = (abi: any, methods: any[], methodName: any, setFieldValue: any, index: number) => {
    setFieldValue(`contracts.${index}.values`, ""); // reset
    setFieldValue(`contracts.${index}.callData`, ""); // reset
    const selectedMethod = methods.filter(method => method.methodSignature === methodName);
    const abiParams = selectedMethod[0].inputs.map((input: any, j: number) => {
      return {
        id: j,
        name: input.name,
        type: input.type,
        placeholder: `${input.name} (${input.type}) ${Validators.isArrayParameter(input.type) ? typeArrayPlaceholder(input.type) : ""}`,
        methodSignature: input.methodSignature,
      };
    });
    setFieldValue(`contracts.${index}.params`, abiParams);
    if (abiParams.length === 0) { // If no params, generate the encoded data
      setFieldValue(`contracts.${index}.callData`, encodeABI(abi, selectedMethod[0].name, []));
    }
  }

  private abiInputChange = (abi: any, values: any, name: string, setFieldValue: any, index: number) => {
    const encodedData = encodeABI(abi, name, values);
    setFieldValue(`contracts.${index}.callData`, encodedData);
  }

  public render(): RenderOutput {
    const { handleClose } = this.props;
    const { loading, addContractStatus, userContracts, whitelistedContracts } = this.state;

    const contracts = whitelistedContracts.length > 0 ? whitelistedContracts : userContracts;
    const contractsOptions = contracts.map((address, index) => {
      return <option key={index} value={address}>{getContractName(address, this.props.daoAvatarAddress)} ({address})</option>;
    });

    const fnDescription = () => (<span>Short description of the proposal.<ul><li>What are you proposing to do?</li><li>Why is it important?</li><li>How much will it cost the DAO?</li><li>When do you plan to deliver the work?</li></ul></span>);

    return (
      <div className={css.containerNoSidebar}>
        <Formik
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          initialValues={this.initialFormValues}
          // eslint-disable-next-line react/jsx-no-bind
          validate={(values: IFormValues): void => {
            const errors: any = {};

            const require = (name: string) => {
              if (!(values as any)[name]) {
                errors[name] = "Required";
              }
            };

            if (values.title.length > 120) {
              errors.title = "Title is too long (max 120 characters)";
            }

            if (!isValidUrl(values.url)) {
              errors.url = "Invalid URL";
            }

            require("title");
            require("description");

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
            handleBlur,
            values,
          }: FormikProps<IFormValues>) =>
            <Form noValidate>
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

              <TrainingTooltip overlay={fnDescription} placement="right">
                <label htmlFor="descriptionInput">
                  <div className={css.proposalDescriptionLabelText}>
                    <div className={css.requiredMarker}>*</div>
                    <div className={css.body}>Description</div><HelpButton text={HelpButton.helpTextProposalDescription} />
                  </div>
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

              {whitelistedContracts.length === 0 &&
              <div className={css.addContract}>
                <label htmlFor="addContract">
                  Add custom contract
                </label>
                <Field
                  placeholder="Contract address"
                  name="addContract"
                  type="text"
                  // eslint-disable-next-line react/jsx-no-bind
                  onChange={(e: any) => { setFieldValue("addContract", e.target.value); this.verifyContract(e.target.value.toLowerCase()); }}
                  disabled={loading ? true : false}
                />
                {loading ? "Loading..." : addContractStatus.error === "ABI_DATA_ERROR" ?
                  <div>
                    {addContractStatus.message}
                    <a href={linkToEtherScan(values.addContract)} target="_blank" rel="noopener noreferrer">contract</a>
                  </div> : addContractStatus.message}
              </div>}

              <FieldArray name="contracts">
                {({ insert, remove, push }) => ( // eslint-disable-line @typescript-eslint/no-unused-vars
                  <div>
                    {
                      values.contracts.length > 0 && values.contracts.map((contract: any, index: any) => (
                        <fieldset key={index}>
                          {/* eslint-disable-next-line react/jsx-no-bind */}
                          {values.contracts.length > 1 && <button className={css.removeFieldSet} type="button" onClick={() => remove(index)}>Remove</button>}

                          <div>
                            <label htmlFor={`contracts.${index}.value`}>
                              <div className={css.requiredMarker}>*</div>
                              {baseTokenName()} Value
                              <ErrorMessage name={`contracts.${index}.value`}>{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                            </label>
                            <Field
                              placeholder={`How much ${baseTokenName()} to transfer with the call`}
                              name={`contracts.${index}.value`}
                              type="number"
                              validate={Validators.requireValue}
                            />
                          </div>

                          <div>
                            <label htmlFor={`contracts.${index}.address`}>
                              <div className={css.requiredMarker}>*</div>
                                Contract Address
                              <ErrorMessage name={`contracts.${index}.address`}>{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                            </label>
                            <Field // eslint-disable-next-line react/jsx-no-bind
                              onChange={async (e: any) => { setFieldValue(`contracts.${index}.address`, e.target.value); await this.getContractABI(e.target.value, setFieldValue, index); }}
                              component="select"
                              name={`contracts.${index}.address`}
                              type="text"
                              validate={Validators.requireValue}
                            >
                              <option value="" disabled>-- Choose contract --</option>
                              <optgroup label={whitelistedContracts.length > 0 ? "Whitelisted contracts" : "Custom contracts"}>
                                {contractsOptions}
                              </optgroup>
                            </Field>
                          </div>

                          {
                            values.contracts[index].address !== "" &&
                            <div>
                              <label htmlFor={`contracts.${index}.method`}>
                                <div className={css.requiredMarker}>*</div>
                                  Method
                                <ErrorMessage name={`contracts.${index}.method`}>{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                              </label>
                              {values.contracts[index]?.methods?.length === 0 ? "Loading..." :
                                <Field // eslint-disable-next-line react/jsx-no-bind
                                  onChange={(e: any) => { setFieldValue(`contracts.${index}.method`, e.target.value); this.getMethodInputs(values.contracts[index].abi, values.contracts[index]?.methods, e.target.value, setFieldValue, index); }}
                                  component="select"
                                  name={`contracts.${index}.method`}
                                  type="text"
                                  validate={Validators.requireValue}
                                >
                                  <option value="" disabled>-- Choose method --</option>
                                  {values.contracts[index]?.methods?.map((method: any, j: any) => (
                                    <option key={j}>{method.methodSignature}</option>
                                  ))}
                                </Field>}
                            </div>
                          }

                          {
                            values.contracts[index].method !== "" &&
                            <div>
                              {values.contracts[index].params.map((param: any, i: number) => (
                                <React.Fragment key={i}>
                                  <label>
                                    <div className={css.requiredMarker}>*</div>
                                    {param.name}
                                    <ErrorMessage name={`contracts.${index}.values.${i}`}>{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                                  </label>
                                  <Field
                                    type="text"
                                    name={`contracts.${index}.values.${i}`}
                                    placeholder={param.placeholder}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onBlur={(e: any) => { handleBlur(e); this.abiInputChange(values.contracts[index].abi, values.contracts[index].values, values.contracts[index].method.split("(")[0], setFieldValue, index); }}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    validate={(e: any) => Validators.validateParam(param.type, e)}
                                  />
                                </React.Fragment>
                              ))}
                            </div>
                          }

                          <label>Encoded Data</label>
                          <div id="encoded-data" className={css.encodedDataMultiCall}>{values.contracts[index].callData}</div>
                        </fieldset>
                      ))
                    }
                    <button
                      className={css.addFieldSet}
                      type="button"
                      // eslint-disable-next-line react/jsx-no-bind
                      onClick={() => push(this.initialFormValues.contracts[0])}>+ Add Another Contract</button>
                  </div>
                )
                }
              </FieldArray>

              <div className={css.createProposalActions}>
                <TrainingTooltip overlay="Export proposal" placement="top">
                  <button id="export-proposal" className={css.exportProposal} type="button" onClick={() => this.exportFormValues(values)}>
                    <img src="/assets/images/Icon/share-blue.svg" />
                  </button>
                </TrainingTooltip>
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

export default connect(null, mapDispatchToProps)(CreateGenericMultiCallScheme);
