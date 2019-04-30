import { IDAOState, IProposalType } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import { checkNetworkAndWarn, getArc } from "arc";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import * as css from "../CreateProposal.scss";

interface IStateProps {
  daoAvatarAddress: string;
  handleClose: () => any;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    daoAvatarAddress : ownProps.daoAvatarAddress,
    handleClose: ownProps.handleClose
  };
};

interface IDispatchProps {
  createProposal: typeof arcActions.createProposal;
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  createProposal: arcActions.createProposal,
  showNotification
};

type IProps = IStateProps & IDispatchProps;

interface FormValues {
  description: string;
  otherScheme: string;
  parametersHash: string;
  permissions: {
    registerSchemes: boolean;
    changeConstraints: boolean;
    upgradeController: boolean;
    genericCall: boolean;
  };
  scheme: string;
  title: string;
  url: string;

  [key: string]: any;
}

class CreateProposalContainer extends React.Component<IProps, null> {

  constructor(props: IProps) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  public async handleSubmit(values: FormValues, { setSubmitting }: any ) {
    if (!(await checkNetworkAndWarn(this.props.showNotification))) { return; }

    const proposalValues = {...values,
      type: IProposalType.SchemeRegistrarPropose,
      parametersHash: "0x0000000000000000000000000000000000000000000000000000000000001234", //TODO: use real value
      permissions: "0x0000001f" // values.permissions.registerOtherSchemes
    };

    setSubmitting(false);
    await this.props.createProposal(this.props.daoAvatarAddress, proposalValues);
  }

  public render() {
    const {  daoAvatarAddress, handleClose } = this.props;
    const arc = getArc();

    return <Subscribe observable={arc.dao(daoAvatarAddress).state()}>{
      (state: IObservableState<IDAOState>) => {
        if ( state.data !== null ) {

          return (
            <div className={css.schemeRegistrar}>
              <div className={css.schemeRegistrarSidebar}>
                <button className={css.addScheme + " " + css.selected}>
                  <span></span>
                  Add Scheme
                </button>
                <div className={css.schemeItem}>
                  <span className={css.schemeTitle}>Scheme name</span>
                  <button>
                    <span></span>
                    Remove Scheme
                  </button>
                  <button>
                    <span></span>
                    Edit Scheme
                  </button>
                </div>
              </div>

              <div className={css.schemeRegistrarForm}>
                <Formik
                  initialValues={{
                    description: "",
                    otherScheme: "",
                    parametersHash: "",
                    permissions: {
                      registerSchemes: false,
                      changeConstraints: false,
                      upgradeController: false,
                      genericCall: false
                    },
                    scheme: arc.contractAddresses.base.ContributionReward,
                    title: "",
                    url: ""
                  } as FormValues}
                  validate={(values: FormValues) => {
                    const errors: any = {};

                    const require = (name: string) => {
                      if (!(values as any)[name]) {
                        errors[name] = "Required";
                      }
                    };

                    if (values.title.length > 120) {
                      errors.title = "Title is too long (max 120 characters)";
                    }
                    {/*
                    if (!arc.web3.utils.isAddress(values.beneficiary)) {
                      errors.beneficiary = "Invalid address";
                    }*/}

                    const pattern = new RegExp("(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})");
                    if (values.url && !pattern.test(values.url)) {
                      errors.url = "Invalid URL";
                    }

                    require("description");
                    require("title");
                    require("scheme");
                    require("parametersHash");

                    return errors;
                  }}
                  onSubmit={this.handleSubmit}
                  render={({
                    errors,
                    touched,
                    handleSubmit,
                    isSubmitting,
                    setFieldTouched,
                    setFieldValue,
                    values
                  }: FormikProps<FormValues>) =>
                    <Form noValidate>

                      <label htmlFor="titleInput">
                        Title
                        <ErrorMessage name="title">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                        <div className={css.requiredMarker}>*</div>
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
                        Description
                        <div className={css.requiredMarker}>*</div>
                        <img className={css.infoTooltip} src="/assets/images/Icon/Info.svg"/>
                        <ErrorMessage name="description">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      </label>
                      <Field
                        component="textarea"
                        id="descriptionInput"
                        placeholder="Describe your proposal in greater detail"
                        name="description"
                        className={touched.description && errors.description ? css.error : null}
                      />

                      <label htmlFor="urlInput">
                        URL
                        <ErrorMessage name="url">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                      </label>
                      <Field
                        id="urlInput"
                        maxLength={120}
                        placeholder="Description URL"
                        name="url"
                        type="text"
                        className={touched.url && errors.url ? css.error : null}
                      />

                      <div className={css.schemeFields}>
                        <div className={css.schemeSelectContainer}>
                          <label htmlFor="schemeInput">
                            Scheme
                            <ErrorMessage name="scheme">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                            <div className={css.requiredMarker}>*</div>
                          </label>
                          <Field
                            id="schemeInput"
                            name="scheme"
                            component="select"
                            className={css.schemeSelect}
                          >
                            <option value={arc.contractAddresses.base.ContributionReward}>Contribution Reward</option>
                            <option value={arc.contractAddresses.base.SchemeRegistrar}>Scheme Registrar</option>
                            <option value={arc.contractAddresses.base.GenericScheme}>Generic Scheme</option>
                            <option value="Other">Other</option>
                          </Field>
                          <Field
                            id="otherSchemeInput"
                            placeholder="Type name"
                            name="otherScheme"
                            className={touched.otherScheme && errors.otherScheme ? css.error : null + " " + css.otherScheme}
                          />
                        </div>

                        <div>
                          <label htmlFor="parametersHashInput">
                            Parameter Hash
                            <ErrorMessage name="parametersHash">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                          </label>
                          <Field
                            id="parametersHashInput"
                            placeholder="Insert hash"
                            name="parametersHash"
                            className={touched.parametersHash && errors.parametersHash ? css.error : null}
                          />
                        </div>
                        <div className={css.permissions}>
                          <div className={css.permissionsLabel}>
                            Permissions
                          </div>
                          <div className={css.permissionCheckbox}>
                            <Field id="registerOtherSchemesInput" type="checkbox" name="permissions.registerSchemes" />
                            <label htmlFor="registerOtherSchemesInput">
                              Register other schemes
                            </label>
                          </div>

                          <div className={css.permissionCheckbox}>
                            <Field id="changeConstraintsInput" type="checkbox" name="permissions.changeConstraints" />
                            <label htmlFor="changeConstraintsInput">
                              Add/remove global constraints
                            </label>
                          </div>

                          <div className={css.permissionCheckbox}>
                            <Field id="upgradeControllerInput" type="checkbox" name="permissions.upgradeController" />
                            <label htmlFor="upgradeControllerInput">
                              Upgrade the controller
                            </label>
                          </div>

                          <div className={css.permissionCheckbox}>
                            <Field id="genericCallInput" type="checkbox" name="permissions.genericCall" />
                            <label htmlFor="genericCallInput">
                              Call genericCall on behalf of
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className={css.createProposalActions}>
                        <button className={css.exitProposalCreation} type="button" onClick={handleClose}>
                          Cancel
                        </button>
                        <button className={css.submitProposal} type="submit" disabled={isSubmitting}>
                          Submit proposal
                        </button>
                      </div>
                    </Form>
                  }
                />

              </div>
            </div>

          );
        } else {
          return null;
       }
     }
    }</Subscribe>;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateProposalContainer);
