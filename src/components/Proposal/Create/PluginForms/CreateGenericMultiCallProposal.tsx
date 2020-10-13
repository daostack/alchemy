import { IPluginState } from "@daostack/arc.js";
import { createProposal } from "actions/arcActions";
import { enableWalletProvider } from "arc";
import { ErrorMessage, Field, Form, Formik, FormikProps, FieldArray } from "formik";
import Analytics from "lib/analytics";
import * as React from "react";
import { connect } from "react-redux";
import { showNotification } from "reducers/notifications";
import { baseTokenName, isValidUrl, linkToEtherScan, isAddress } from "lib/util";
import TagsSelector from "components/Proposal/Create/PluginForms/TagsSelector";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import * as css from "../CreateProposal.scss";
import MarkdownField from "./MarkdownField";
import HelpButton from "components/Shared/HelpButton";
import i18next from "i18next";
import { IFormModalService, CreateFormModalService } from "components/Shared/FormModalService";
import ResetFormButton from "components/Proposal/Create/PluginForms/ResetFormButton";
import { getABIByContract, extractABIMethods, encodeABI } from "./ABIService";
import Loading from "components/Shared/Loading";
import { any } from "prop-types";
import { requireValue, validateParam } from "./Validators";

const contracts = [
  "0x543Ff227F64Aa17eA132Bf9886cAb5DB55DCAddf",
  "0x5C5cbaC45b18F990AbcC4b890Bf98d82e9ee58A0",
  "0x24832a7A5408B2b18e71136547d308FCF60B6e71",
  "0x4E073a7E4a2429eCdfEb1324a472dd8e82031F34",
];

const initialValues = {
  contracts: [
    {
      address: "",
      value: 0,
      abi: any,
      method: "",
      methods: [] as any,
      params: [] as any,
      values: [] as any,
      callData: "",
    },
  ],
};

interface IExternalProps {
  daoAvatarAddress: string;
  handleClose: () => any;
  pluginState: IPluginState;
}

interface IDispatchProps {
  createProposal: typeof createProposal;
  showNotification: typeof showNotification;
}

interface IAddContractStatus {
  error: string
  message: string
}

interface IStateProps {
  loading: boolean
  tags: Array<string>
  addContractStatus: IAddContractStatus
  contracts: Array<string>
}

// interface IABIField {
//   id: string,
//   name: string
//   type: string
//   inputType: string,
//   placeholder: string,
// }

type IProps = IExternalProps & IDispatchProps;

const mapDispatchToProps = {
  createProposal,
  showNotification,
};

interface IFormValues {
  description: string;
  title: string;
  url: string;
  contracts: []
  [key: string]: any;
}

const defaultValues: IFormValues = Object.freeze({
  description: "",
  title: "",
  url: "",
  tags: [],
  contracts: [],
});


class CreateGenericMultiCallProposal extends React.Component<IProps, IStateProps> {

  formModalService: IFormModalService<IFormValues>;
  currentFormValues: IFormValues;

  constructor(props: IProps) {
    super(props);
    this.state = { loading: false, addContractStatus: { error: "", message: "" }, contracts: contracts, tags: [] };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.formModalService = CreateFormModalService(
      "CreateGenericMultiCallProposal",
      defaultValues,
      () => Object.assign(this.currentFormValues, this.state),
      (formValues: IFormValues, firstTime: boolean) => {
        this.currentFormValues = formValues;
        if (firstTime) {
          Object.assign(this.state, {
            tags: formValues.tags,
          });
        }
        else { this.setState({ tags: formValues.tags }); }
      },
      this.props.showNotification);
  }

  componentWillUnmount() {
    this.formModalService.saveCurrentValues();
  }

  public async handleSubmit(values: IFormValues, { setSubmitting }: any): Promise<void> {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    const proposalValues = {
      ...values,
      dao: this.props.daoAvatarAddress,
      plugin: this.props.pluginState.address,
      tags: this.state.tags,
    };

    setSubmitting(false);
    await this.props.createProposal(proposalValues);

    Analytics.track("Submit Proposal", {
      "DAO Address": this.props.daoAvatarAddress,
      "Proposal Title": values.title,
      "Plugin Address": this.props.pluginState.address,
      "Plugin Name": this.props.pluginState.name,
    });

    this.props.handleClose();
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
    const addContractStatus = {
      error: "",
      message: "",
    };

    if (!isAddress(contractToCall)) {
      addContractStatus.error = "NOT_VALID_ADDRESS";
      addContractStatus.message = i18next.t("Validate Address");
    } else if (this.state.contracts.includes(contractToCall)) {
      addContractStatus.error = "CONTRACT_EXIST";
      addContractStatus.message = i18next.t("Contract Exist");
    } else {
      this.setState({ loading: true });
      const abiData = await getABIByContract(contractToCall);
      const abiMethods = extractABIMethods(abiData);
      if (abiMethods.length > 0) {
        this.state.contracts.push(contractToCall);
        addContractStatus.error = "";
        addContractStatus.message = i18next.t("Contract Add Success");
      } else {
        addContractStatus.error = "ABI_DATA_ERROR";
        addContractStatus.message = abiData.length === 0 ? i18next.t("No ABI") : i18next.t("No Write Methods");
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
    setFieldValue(`contracts.${index}.callData`, ""); // reset
    const selectedMethod = methods.filter(method => method.methodSignature === methodName);
    const abiParams = selectedMethod[0].inputs.map((input: any, index: number) => {
      return {
        id: index,
        name: input.name,
        type: input.type,
        inputType: input.type === "bool" ? "number" : "text",
        placeholder: `${input.name} (${input.type})`,
        methodSignature: input.methodSignature,
      };
    });
    setFieldValue(`contracts.${index}.params`, abiParams);
    if (abiParams.length === 0) {
      const encodedData = encodeABI(abi, methodName, []);
      setFieldValue(`contracts.${index}.callData`, encodedData);
    }
  }

  private abiInputChange = (abi: any, values: any, name: string, params: any, setFieldValue: any, index: number) => {
    const abiValues = [];
    for (const [i, abiInput] of params.entries()) {
      abiValues.push({ type: abiInput.type, value: values[i] });
    }

    const encodedData = encodeABI(abi, name, abiValues);
    setFieldValue(`contracts.${index}.callData`, encodedData);
  }


  public render(): RenderOutput {
    const { handleClose } = this.props;
    const { loading, addContractStatus } = this.state;

    const addressesOptions = contracts.map((address, index) => {
      return <option key={index}>{address}</option>;
    });

    return (
      <div className={css.containerNoSidebar}>
        <React.Fragment>
          <Formik
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            initialValues={initialValues}
            // eslint-disable-next-line react/jsx-no-bind
            validate={(values: IFormValues): void => {
              const errors: any = {};

              this.currentFormValues = values;

              const require = (name: string) => {
                if (!(values as any)[name]) {
                  errors[name] = "Required";
                }
              };

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
              handleBlur,
              isSubmitting,
              resetForm,
              values,
              setFieldValue,
            }: FormikProps<IFormValues>) =>
              <Form noValidate>
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
                  className={touched.description && errors.description ? css.error : null}
                />

                <TrainingTooltip overlay={i18next.t("Tags Tooltip")} placement="right">
                  <label className={css.tagSelectorLabel}>
                    Tags
                  </label>
                </TrainingTooltip>

                <div className={css.tagSelectorContainer}>
                  <TagsSelector onChange={this.onTagsChange}></TagsSelector>
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

                <div className={css.addContract}>
                  <label htmlFor="addContract">
                    {i18next.t("Add contract")}
                  </label>
                  <Field
                    placeholder={i18next.t("Add contract")}
                    name="addContract"
                    type="text"
                    // eslint-disable-next-line react/jsx-no-bind
                    onChange={(e: any) => { setFieldValue("addContract", e.target.value); this.verifyContract(e.target.value); }}
                    disabled={loading ? true : false}
                  />
                  {loading ? <Loading inline /> : addContractStatus.error === "ABI_DATA_ERROR" ?
                    <div>
                      {addContractStatus.message}
                      <a href={linkToEtherScan(values.addContract)} target="_blank" rel="noopener noreferrer">{i18next.t("contract")}</a>
                    </div> : addContractStatus.message}
                </div>

                <FieldArray name="contracts">
                  {({ insert, remove, push }) => (
                    <div>
                      {
                        values.contracts.length > 0 && values.contracts.map((contract: any, index: any) => (
                          <fieldset>
                            <button className={css.removeFieldSet} type="button" onClick={() => remove(index)}>Remove</button>

                            <div>
                              <label htmlFor={`contracts.${index}.value`}>
                                <div className={css.requiredMarker}>*</div>
                                {baseTokenName()} Value
                                <ErrorMessage name={`contracts.${index}.value`}>{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                              </label>
                              <Field
                                id="valueInput"
                                placeholder={`How much ${baseTokenName()} to transfer with the call`}
                                name={`contracts.${index}.value`}
                                type="number"
                                validate={requireValue}
                              //className={(touched.contracts[index] as any).value && (errors.contracts[index] as any).value ? css.error : null}
                              />
                            </div>

                            <div>
                              <label htmlFor={`contracts.${index}.address`}>
                                <div className={css.requiredMarker}>*</div>
                                Contract Address
                                <ErrorMessage name={`contracts.${index}.address`}>{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                              </label>
                              <Field
                                onChange={async (e: any) => { setFieldValue(`contracts.${index}.address`, e.target.value); await this.getContractABI(e.target.value, setFieldValue, index) }}
                                component="select"
                                name={`contracts.${index}.address`}
                                placeholder="Select contract"
                                type="text"
                                validate={requireValue}
                              //className={(touched.contracts[index] as any).address && (errors.contracts[index] as any).address ? css.error : null}
                              >
                                <option value="" disabled>{i18next.t("Choose contract")}</option>
                                {addressesOptions}
                              </Field>
                            </div>

                            {
                              (values.contracts[index] as any).address !== "" &&
                              <div>
                                <label htmlFor={`contracts.${index}.method`}>
                                  <div className={css.requiredMarker}>*</div>
                                  Method
                                  <ErrorMessage name={`contracts.${index}.method`}>{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                                </label>
                                {(values.contracts[index] as any)?.methods?.length === 0 ? "loading..." :
                                  <Field
                                    onChange={(e: any) => { setFieldValue(`contracts.${index}.method`, e.target.value); this.getMethodInputs((values.contracts[index] as any)?.abi, (values.contracts[index] as any)?.methods, e.target.value, setFieldValue, index) }}
                                    component="select"
                                    name={`contracts.${index}.method`}
                                    placeholder="Select method"
                                    type="text"
                                    validate={requireValue}
                                  //className={(touched.contracts[index] as any).method && (errors.contracts[index] as any).method ? css.error : null}
                                  >
                                    <option value="" disabled>{i18next.t("Choose method")}</option>
                                    {(values.contracts[index] as any)?.methods?.map((method: any, j: any) => (
                                      <option key={j}>{method.methodSignature}</option>
                                    ))}
                                  </Field>}
                              </div>
                            }

                            {
                              (values.contracts[index] as any).method !== "" &&
                              <div>
                                {(values.contracts[index] as any).params.map((param: any, i: number) => (
                                  <React.Fragment>
                                    <label>
                                      <div className={css.requiredMarker}>*</div>
                                      {param.name}
                                      <ErrorMessage name={`contracts.${index}.values.${i}`}>{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                                    </label>
                                    <Field
                                      key={i}
                                      type="text"
                                      name={`contracts.${index}.values.${i}`}
                                      placeholder={param.placeholder}
                                      onBlur={(e: any) => { handleBlur(e); this.abiInputChange((values.contracts[index] as any).abi, (values.contracts[index] as any).values, (values.contracts[index] as any).method, (values.contracts[index] as any).params, setFieldValue, index); }}
                                      validate={(e: any) => validateParam(param.type, e)}
                                    //className={(touched.contracts[index] as any).values[i] && (errors.contracts[index] as any).values[i] ? css.error : null}
                                    />
                                  </React.Fragment>
                                ))}
                              </div>
                            }

                            <label>Encoded Data</label>
                            <div id="encoded-data" className={css.encodedData}>{(values.contracts[index] as any).callData}</div>
                          </fieldset>
                        ))
                      }
                      <button
                        className={css.addFieldSet}
                        type="button"
                        onClick={() => push({ address: "", value: "", method: "", values: [], metohds: [], params: [], callData: "" })}>+ Add Another Contract</button>
                    </div>
                  )
                  }
                </FieldArray>

                <div className={css.createProposalActions}>
                  <TrainingTooltip overlay={i18next.t("Export Proposal Tooltip")} placement="top">
                    <button id="export-proposal" className={css.exportProposal} type="button" onClick={this.formModalService?.sendFormValuesToClipboard}>
                      <img src="/assets/images/Icon/share-blue.svg" />
                    </button>
                  </TrainingTooltip>
                  <button className={css.exitProposalCreation} type="button" onClick={handleClose}>
                    Cancel
                      </button>

                  <ResetFormButton
                    resetToDefaults={this.formModalService?.resetFormToDefaults(resetForm)}
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

        </React.Fragment>
      </div>
    );
  }
}

export default connect(null, mapDispatchToProps)(CreateGenericMultiCallProposal);
