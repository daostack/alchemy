import { IPluginState, IGenericPluginState } from "@daostack/arc.js";
import { createProposal } from "actions/arcActions";
import { enableWalletProvider } from "arc";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import Analytics from "lib/analytics";
import * as React from "react";
import { connect } from "react-redux";
import { showNotification } from "reducers/notifications";
import { baseTokenName, isValidUrl, linkToEtherScan } from "lib/util";
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
import { requireValue, validateParam } from "./Validators";

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
  tags: Array<string>
  abiData: Array<any>
  abiMethods: Array<any>
}

interface IABIField {
  id: string,
  name: string
  type: string
  placeholder: string,
}

type IProps = IExternalProps & IDispatchProps;

const mapDispatchToProps = {
  createProposal,
  showNotification,
};

interface IFormValues {
  description: string
  title: string
  url: string
  value: number
  abi: any
  methods: Array<any>
  method: string
  params: IABIField[]
  values: any
  callData: string
  [key: string]: any
}

const defaultValues: IFormValues = Object.freeze({
  description: "",
  title: "",
  url: "",
  value: 0,
  tags: [],
  abi: [],
  methods: [],
  method: "",
  params: [],
  values: [],
  callData: "",
});

interface INoABIProps {
  contractToCall: string
  abiData: Array<any>
}

const NoABI = (props: INoABIProps) => {
  return (
    <div className={css.noABIWrapper}>
      {props.abiData.length === 0 ? i18next.t("No ABI") : i18next.t("No Write Methods")}
      <a href={linkToEtherScan(props.contractToCall)} target="_blank" rel="noopener noreferrer">{i18next.t("contract")}</a>
    </div>
  );
};

class CreateGenericPlugin extends React.Component<IProps, IStateProps> {

  formModalService: IFormModalService<IFormValues>;
  currentFormValues: IFormValues;

  constructor(props: IProps) {
    super(props);
    this.state = { loading: true, tags: [], abiData: [], abiMethods: [] };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.formModalService = CreateFormModalService(
      "CreateGenericPlugin",
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

  async componentDidMount() {
    const contractToCall = (this.props.pluginState as IGenericPluginState).pluginParams.contractToCall;
    const abiData = await getABIByContract(contractToCall);
    const abiMethods = extractABIMethods(abiData);
    this.setState({ abiData: abiData, abiMethods: abiMethods, loading: false });
  }

  componentWillUnmount() {
    this.formModalService.saveCurrentValues();
  }

  public async handleSubmit(values: IFormValues, { setSubmitting }: any): Promise<void> {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    const proposalValues = {
      title: values.title,
      description: values.description,
      value: values.value,
      callData: values.callData,
      url: values.url,
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

  private abiInputChange = (setFieldValue: any, values: any) => {
    const abiValues = [];
    for (const abiInput of values.params) {
      abiValues.push(values[abiInput.name]);
    }
    setFieldValue("callData", encodeABI(values.methods, values.method, abiValues));
  }

  private onSelectChange = (values: any, setFieldValue: any, data: any): void => {
    const abiInputs = data[0].inputs.map((input: any, index: number) => {
      return {
        id: index,
        name: input.name,
        type: input.type,
        placeholder: `${input.name} (${input.type})`,
        methodSignature: input.methodSignature,
      };
    });

    setFieldValue("callData", "");
    setFieldValue("params", abiInputs);

    if (abiInputs.length === 0) {
      setFieldValue("callData", encodeABI(values.methods, data[0].methodSignature, []));
    }
  }

  public render(): RenderOutput {
    const { abiData, abiMethods } = this.state;
    this.currentFormValues.abi = abiData;
    this.currentFormValues.methods = abiMethods;
    const { handleClose } = this.props;
    const contractToCall = (this.props.pluginState as IGenericPluginState).pluginParams.contractToCall;

    return (
      <div className={css.containerNoSidebar}>
        {this.state.loading ? <Loading inline /> :
          <React.Fragment>
            {this.state.abiMethods.length > 0 ? <React.Fragment>
              <div className={css.callToContract}>
                <span>{i18next.t("Call to Contract")}</span>
                <a href={linkToEtherScan(contractToCall)} target="_blank" rel="noopener noreferrer">{i18next.t("contract")}</a>
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

                  require("title");
                  require("description");
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
                        validate={requireValue}
                      />
                    </div>

                    <div>
                      <label htmlFor="method">
                        <div className={css.requiredMarker}>*</div>
                        Method
                        <ErrorMessage name="method">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      </label>
                      <Field
                        id="select-search"
                        // eslint-disable-next-line react/jsx-no-bind
                        onChange={(e: any) => { setFieldValue("method", e.target.value); this.onSelectChange(values, setFieldValue, this.state.abiMethods.filter(method => method.methodSignature === e.target.value)); }}
                        component="select"
                        name="method">
                        <option value="" disabled>-- {i18next.t("Choose method")} --</option>
                        {this.state.abiMethods.map((method, index) => {
                          return <option id={`select-search-element-${index}`} key={index}>{method.methodSignature}</option>;
                        })}
                      </Field>
                    </div>

                    {
                      values.params.map((abiInput, index) => {
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
                                className={touched[abiInput.name] && errors[abiInput.name] ? css.error : null}
                                // eslint-disable-next-line react/jsx-no-bind
                                onChange={(e: any) => { setFieldValue(`${abiInput.name}`, e.target.value); }}
                                // eslint-disable-next-line react/jsx-no-bind
                                onBlur={(e: any) => { handleBlur(e); this.abiInputChange(setFieldValue, values); }}
                                // eslint-disable-next-line react/jsx-no-bind
                                validate={(e: any) => validateParam(abiInput.type, e)}
                              />
                            </label>
                          </div>
                        );
                      })
                    }

                    <label>Encoded Data</label>
                    <div id="encoded-data" className={css.encodedData}>{values.callData}</div>

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
            </React.Fragment> : <NoABI contractToCall={contractToCall} abiData={this.state.abiData} />}
          </React.Fragment>}
      </div>
    );
  }
}

export default connect(null, mapDispatchToProps)(CreateGenericPlugin);
