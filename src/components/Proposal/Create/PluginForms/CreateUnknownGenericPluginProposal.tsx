import { IPluginState, IGenericPluginState } from "@daostack/arc.js";
import { createProposal } from "actions/arcActions";
import { enableWalletProvider } from "arc";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import Analytics from "lib/analytics";
import * as React from "react";
import { connect } from "react-redux";
import { showNotification } from "reducers/notifications";
import { baseTokenName, isValidUrl, isAddress } from "lib/util";
import { isHexString } from "ethers/utils";
import TagsSelector from "components/Proposal/Create/PluginForms/TagsSelector";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import { SelectSearch } from "components/Shared/SelectSearch";
import * as css from "../CreateProposal.scss";
import MarkdownField from "./MarkdownField";
import HelpButton from "components/Shared/HelpButton";
import i18next from "i18next";
import { IFormModalService, CreateFormModalService } from "components/Shared/FormModalService";
import ResetFormButton from "components/Proposal/Create/PluginForms/ResetFormButton";
import { getABIByContract, extractABIMethods, encodeABI } from "./ABIService";
import Loading from "components/Shared/Loading";
import { linkToEtherScan } from "lib/util";

interface IExternalProps {
  daoAvatarAddress: string;
  handleClose: () => any;
  pluginState: IPluginState;
}

interface IDispatchProps {
  createProposal: typeof createProposal;
  showNotification: typeof showNotification;
}

interface IStateProps {
  loading: boolean
  tags: Array<string>;
  abiMethods: any
  abiInputs: IABIField[]
  callData: string
}

interface IABIField {
  id: string,
  name: string
  type: string
  inputType: string,
  placeholder: string,
}

type IProps = IExternalProps & IDispatchProps;

const mapDispatchToProps = {
  createProposal,
  showNotification,
};

interface IFormValues {
  description: string;
  title: string;
  url: string;
  value: number;
  method: string,
  [key: string]: any;
}

const defaultValues: IFormValues = Object.freeze({
  description: "",
  title: "",
  url: "",
  value: 0,
  tags: [],
  method: "",
});

class CreateGenericPlugin extends React.Component<IProps, IStateProps> {

  formModalService: IFormModalService<IFormValues>;
  currentFormValues: IFormValues;

  constructor(props: IProps) {
    super(props);
    this.state = { loading: true, tags: [], abiMethods: [], abiInputs: [], callData: "" };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.formModalService = CreateFormModalService(
      "CreateGenericPlugin",
      defaultValues,
      () => Object.assign(this.currentFormValues, this.state),
      (formValues: IFormValues, firstTime: boolean) => {
        this.currentFormValues = formValues;
        if (firstTime) {
          Object.assign(this.state, {
            tags: formValues.tags, abiInputs: this.state.abiInputs, callData: this.state.callData,
          });
        }
        else { this.setState({ tags: formValues.tags, abiInputs: [], callData: "" }); }
      },
      this.props.showNotification);
  }

  async componentDidMount() {
    const contractToCall = (this.props.pluginState as IGenericPluginState).pluginParams.contractToCall;
    const abiData = await getABIByContract(contractToCall);
    const abiMethods = extractABIMethods(abiData);
    this.setState({ abiMethods: abiMethods, loading: false });
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
      callData: this.state.callData,
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

  private getEncodedData = (abi: Array<any>, name: string, values: any[]) => {
    const encodedData = encodeABI(abi, name, values);
    this.setState({ callData: encodedData });
  }

  private abiInputChange = (values: any) => {
    const abiValues = [];
    for (const abiInput of this.state.abiInputs) {
      abiValues.push({ type: abiInput.type, value: values[abiInput.name] });
    }

    this.getEncodedData(this.state.abiMethods, values.method, abiValues);
  }

  private onSelectChange = (data: any): void => {
    const abiInputs = data.inputs.map((input: any, index: number) => {
      return {
        id: index,
        name: input.name,
        type: input.type,
        inputType: input.type === "bool" ? "number" : "text",
        placeholder: `${input.name} (${input.type})`,
        methodSignature: input.methodSignature,
      };
    });

    this.setState({ abiInputs: abiInputs, callData: "" });
    if (abiInputs.length === 0) {
      this.getEncodedData(this.state.abiMethods, data.methodSignature, []);
    }
  }

  public render(): RenderOutput {
    const { handleClose } = this.props;
    const contractToCall = (this.props.pluginState as IGenericPluginState).pluginParams.contractToCall;

    return (
      <div className={css.containerNoSidebar}>
        {this.state.loading ? <Loading inline /> :
          <React.Fragment>
            {this.state.abiMethods.length > 0 ? <React.Fragment>
              <div className={css.callToContract}>
                <span>{i18next.t("Call to Contract")}</span>
                <a href={linkToEtherScan(contractToCall)} target="_blank" rel="noopener noreferrer">{contractToCall}</a>
              </div>
              <Formik
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                initialValues={this.currentFormValues}
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

                  const requireValue = (name: string) => {
                    if ((values as any)[name] === "") {
                      errors[name] = "Required";
                    }
                  };

                  const nonNegative = (name: string) => {
                    if ((values as any)[name] < 0) {
                      errors[name] = "Please enter a non-negative value";
                    }
                  };

                  if (this.state.abiInputs) {
                    for (const abiValue of this.state.abiInputs) {
                      require(abiValue.name);
                      switch (abiValue.type) {
                        case "address":
                          if (!isAddress(values[abiValue.name])) {
                            errors[abiValue.name] = i18next.t("Validate Address");
                          }
                          break;
                        case "bytes":
                          if (!isHexString(values[abiValue.name])) {
                            errors[abiValue.name] = i18next.t("Validate HEX");
                          }
                          break;
                        case "uint256":
                          if (/^\d+$/.test(values[abiValue.name]) === false) {
                            errors[abiValue.name] = i18next.t("Validate Digits");
                          }
                          break;
                      }
                    }
                  }

                  require("title");
                  require("description");
                  requireValue("value");
                  nonNegative("value");
                  require("method");

                  return errors;
                }}
                onSubmit={this.handleSubmit}
                // eslint-disable-next-line react/jsx-no-bind
                render={({
                  errors,
                  touched,
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  handleSubmit,
                  handleBlur,
                  isSubmitting,
                  resetForm,
                  values,
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  setFieldTouched,
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

                    <div>
                      <label htmlFor="value">
                        <div className={css.requiredMarker}>*</div>
                        {baseTokenName()} Value
                        <ErrorMessage name="value">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      </label>
                      <Field
                        id="valueInput"
                        placeholder={`How much ${baseTokenName()} to transfer with the call`}
                        name="value"
                        type="number"
                        className={touched.value && errors.value ? css.error : null}
                      />
                    </div>

                    <SelectSearch
                      data={this.state.abiMethods}
                      label="ABI Method"
                      required
                      value={values.method}
                      // eslint-disable-next-line react/jsx-no-bind
                      onChange={(data: any) => { setFieldValue("method", data.methodSignature); this.onSelectChange(data); }}
                      name="method"
                      placeholder="-- Select method --"
                      errors={errors}
                      cssForm={css}
                      touched={touched}
                      nameOnList="methodSignature"
                    />

                    {
                      this.state.abiInputs.map((abiInput, index) => {
                        return (
                          <div key={index} >
                            <label htmlFor={abiInput.name} style={{ width: "100%" }}>
                              <div className={css.requiredMarker}>*</div>
                              {abiInput.name}
                              <ErrorMessage name={abiInput.name}>{(msg: string) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                              <Field
                                id={`abi-input-${abiInput.id}`}
                                placeholder={abiInput.placeholder}
                                name={abiInput.name}
                                type={abiInput.inputType}
                                className={touched[abiInput.name] && errors[abiInput.name] ? css.error : null}
                                // eslint-disable-next-line react/jsx-no-bind
                                onChange={(e: any) => { setFieldValue(`${abiInput.name}`, e.target.value); }}
                                // eslint-disable-next-line react/jsx-no-bind
                                onBlur={(e: any) => { handleBlur(e); this.abiInputChange(values); }}
                              />
                            </label>
                          </div>
                        );
                      })
                    }

                    <label>Encoded Data</label>
                    <div id="encoded-data" className={css.encodedData}>{this.state.callData}</div>

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
            </React.Fragment> : <div>{i18next.t("No ABI")}</div>}
          </React.Fragment>}
      </div>
    );
  }
}

export default connect(null, mapDispatchToProps)(CreateGenericPlugin);
