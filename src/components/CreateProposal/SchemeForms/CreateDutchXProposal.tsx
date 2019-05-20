// const BN = require("bn.js");
import { IProposalType, Queue } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import { checkMetaMaskAndWarn, getArc } from "arc";
import * as classNames from "classnames";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { ErrorMessage, Field, Form, Formik, FormikProps } from "formik";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { Action, GenericSchemeInfo, GenericSchemeRegistry} from "../../../genericSchemeRegistry";
import * as css from "../CreateProposal.scss";

interface IStateProps {
  daoAvatarAddress: string;
  handleClose: () => any;
}

const mapStateToProps = (state: IRootState, ownProps: IStateProps) => {
  return ownProps;
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
  title: string;
  url: string;
  [key: string]: any; // TODO: "allowSyntheticDefaultImports": true in tsconfig.json should render this unecessary. But it is needed anyway
}

interface IState {
  actions: Action[];
  currentAction: Action;
  genericSchemeInfo: GenericSchemeInfo;
}

class CreateDutchXProposalContainer extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);

    const genericSchemeRegistry = new GenericSchemeRegistry();
    const genericSchemeInfo = genericSchemeRegistry.genericSchemeInfo("dxDAO");
    const actions = genericSchemeInfo.actions();
    this.state = {
      actions,
      currentAction:  actions[0],
      genericSchemeInfo
    };
  }

  public async handleSubmit(values: FormValues, { setSubmitting }: any ) {
    if (!(await checkMetaMaskAndWarn(this.props.showNotification))) { return; }

    const currentAction = this.state.currentAction;

    const callValues = [];
    for (let input of currentAction.abi.inputs) {
      callValues.push(values[input.name]);
    }
    let callData: string = "";
    try {
      callData = this.state.genericSchemeInfo.encodeABI(currentAction, callValues);
    } catch (err) {
      // TODO: show notification, not an alert, and close the form
      alert(err.message);
      showNotification(NotificationStatus.Failure, err.message);
      this.props.handleClose();
      return;
    }
    setSubmitting(false);

    try {
      await this.props.createProposal(
        this.props.daoAvatarAddress,
        {
          title: values.title,
          description: values.description,
          url: values.url,
          type: IProposalType.GenericScheme,
          value: 0, // amount of eth to send with the call
          callData
        }
      );
    } catch (err) {
      alert(err.message);
      throw err;
    }
    this.props.handleClose();
  }

  public handleTabClick = (tab: string) => (e: any) => {
    this.setState({ currentAction: this.state.genericSchemeInfo.action(tab) });
  }

  public render() {
    const { handleClose } = this.props;

    const actions = this.state.actions;
    const currentAction = this.state.currentAction;

    const initialFormValues: FormValues = {
      description: "",
      title: "",
      url: ""
    };

    actions.forEach((action) => action.abi.inputs.forEach((input: any) => {
      switch (input.type) {
        case "unit256":
          initialFormValues[input.name] = 0;
          break;
        case "address":
        case "string":
          initialFormValues[input.name] = "";
          break;
        case "address[]":
          initialFormValues[input.name] = [];
          break;
      }
    }));

    return (
      <div className={css.createWrapperWithSidebar}>
        <div className={css.sidebar}>
          { actions.map((action) =>
            <button
              key={action.id}
              className={classNames({
                [css.tab]: true,
                [css.selected]: currentAction.id === action.id
              })}
              onClick={this.handleTabClick(action.id)}>
              <span></span>
              { action.label }
            </button>
          )}
        </div>

        <div className={css.formWrapper}>
          <Formik
            initialValues={initialFormValues}
            validate={(values: FormValues) => {
              const errors: any = {};

              const valueIsRequired = (name: string) => {
                if (!(values as any)[name]) {
                  errors[name] = "Required";
                }
              };

              valueIsRequired("description");
              valueIsRequired("title");

              if (values.title.length > 120) {
                errors.title = "Title is too long (max 120 characters)";
              }

              const urlPattern = new RegExp("(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})");
              if (values.url && !urlPattern.test(values.url)) {
                errors.url = "Invalid URL";
              }

              for (let input of this.state.currentAction.abi.inputs) {
                valueIsRequired(input.name);
              }

              return errors;
            }}
            onSubmit={this.handleSubmit.bind(this)}
            render={({
              errors,
              touched,
              handleSubmit,
              isSubmitting,
              setFieldTouched,
              setFieldValue,
              values
            }: FormikProps<FormValues>) => {
              return (
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
                  <div key={currentAction.id}
                     className={classNames({
                        [css.tab]: true,
                        [css.selected]: this.state.currentAction.id === currentAction.id
                      })
                    }
                  >
                    {
                      currentAction.getFields().map((field: { name: string, type: string, label: string}) => {
                        // TODO: show different field depending on field.type

                        return (
                          <div key={field.name}>
                            <label htmlFor={field.name}>
                              { field.label }
                              <ErrorMessage name={field.name}>{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                              <div className={css.requiredMarker}>*</div>
                            </label>

                            <Field
                              id={field.name}
                              data-test-id={field.name}
                              placeholder={`${field.name} --- type is: ${field.type}`}
                              name={field.name}
                              className={touched[field.name] && errors[field.name] ? css.error : null}
                            />
                          </div>
                        );
                      })
                    }
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
              );
            }}
          />
        </div>
      </div>
    );
  }
}

const ConnectedCreateDutchXProposalContainer = connect(mapStateToProps, mapDispatchToProps)(CreateDutchXProposalContainer);

export default(props: IStateProps) => {
  const arc = getArc();
  //TODO: dont need this
  const observable = arc.dao(props.daoAvatarAddress).queues();
  return <Subscribe observable={observable}>{
    (state: IObservableState<Queue[]>): any => {
      if (state.isLoading) {
        return  <div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>;
      } else if (state.error) {
        throw state.error;
      } else {
        return <ConnectedCreateDutchXProposalContainer {...props} />;
      }
    }
  }</Subscribe>;
};
