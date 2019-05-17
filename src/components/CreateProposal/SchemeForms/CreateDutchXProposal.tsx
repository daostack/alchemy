import { IProposalType, Queue } from "@daostack/client";
import * as arcActions from "actions/arcActions";
import { checkMetaMaskAndWarn, getArc } from "arc";
import * as classNames from "classnames";
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

  auctionThreshold: number;
  newContractAddress: string; // update mastercopy & Change ETH:USD oracle
  newOwnerAddress: string; // Change DutchX owner
  tokenWhitelist: string[];
  tokenPairThreshold: number;
}

interface IState {
  currentTab: string;
}

const actions: { [ tabName: string]: string } = {
  "updateMasterCopy": "Update Mastercopy",
  "changeOracle": "Change ETH:USD Oracle",
  "changeOwner": "Change DutchX owner",
  "addTokens": "Add Tokens",
  "removeTokens": "Remove Tokens",
  "tokenThreshold": "Update new token pair threshold",
  "auctionThreshold": "Update new auction threshold"
};

class CreateDutchXProposalContainer extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);

    this.state = { currentTab: "updateMasterCopy" };
  }

  public async handleSubmit(values: FormValues, { setSubmitting }: any ) {
    if (!(await checkMetaMaskAndWarn(this.props.showNotification))) { return; }

    //const currentTab = this.state.currentTab;
    const proposalValues = {...values,
      type: IProposalType.GenericScheme
      // type: this.state.currentTab === "removeScheme" ? IProposalType.SchemeRegistrarRemove : this.state.currentTab === "addScheme" ? IProposalType.SchemeRegistrarAdd : IProposalType.SchemeRegistrarEdit,
      // parametersHash: values.parametersHash,
      // permissions: "0x" + permissions.toString(16).padStart(8, "0"),
      // scheme: currentTab === "addScheme" ? (values.schemeToAdd === "Other" ? values.otherScheme : values.schemeToAdd) :
      //         currentTab === "editScheme" ? values.schemeToEdit :
      //         values.schemeToRemove
    };

    setSubmitting(false);
    await this.props.createProposal(this.props.daoAvatarAddress, proposalValues);
    this.props.handleClose();
  }

  public handleTabClick = (tab: string) => (e: any) => {
    this.setState({ currentTab: tab });
  }

  public render() {
    const { handleClose } = this.props;
    const currentTab = this.state.currentTab;

//    const arc = getArc();

    const tabClasses: { [key: string]: any } = Object.keys(actions).reduce((classes: { [key: string]: any }, tab) => {
      classes[tab] = classNames({
        [css.tab]: true,
        [css.selected]: currentTab === tab
      });
      return classes;
    }, {});

    // const addSchemeButtonClass = ;
    // const editSchemeButtonClass = classNames({
    //   [css.selected]: currentTab === "editScheme"
    // });
    // const removeSchemeButtonClass = classNames({
    //   [css.selected]: currentTab === "removeScheme"
    // });

    // const schemeRegistrarFormClass = classNames({
    //   [css.schemeRegistrarForm]: true,
    //   [css.addScheme]: currentTab === "addScheme",
    //   [css.removeScheme]: currentTab === "removeScheme",
    //   [css.editScheme]: currentTab === "editScheme"
    // });

    return (
      <div className={css.createWrapperWithSidebar}>
        <div className={css.sidebar}>
          {Object.keys(actions).map((tab) =>
            <button className={tabClasses[tab]} onClick={this.handleTabClick(tab)}>
              <span></span>
              {actions[tab]}
            </button>
          )}
        </div>

        <div className={css.formWrapper}>
          <Formik
            initialValues={{
              auctionThreshold: 0,
              newContractAddress: "",
              newOwnerAddress: "",
              tokenWhitelist: [],
              tokenPairThreshold: 0,

              description: "",
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

              require("description");
              require("title");

              if (values.title.length > 120) {
                errors.title = "Title is too long (max 120 characters)";
              }

              const urlPattern = new RegExp("(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})");
              if (values.url && !urlPattern.test(values.url)) {
                errors.url = "Invalid URL";
              }

              switch (currentTab) {
                case "updateMasterCopy":
                  require("newContractAddress");
                  break
                case "changeOracle":
                  require("newContractAddress");
                  break;
                case "changeOwner":
                  require("newOwnerAddress");
                  break;
                case "addTokens":
                  require("tokenWhitelist");
                  break;
                case "tokenThreshold":
                  require("tokenPairThreshold");
                  break;
                case "auctionThreshold":
                  require("auctionThreshold");
                  break;
              }

              {/*if (currentTab === "addScheme" && values.otherScheme && !arc.web3.utils.isAddress(values.otherScheme)) {
                errors.otherScheme = "Invalid address";
              }*/}

{/*              const parametersHashPattern = /0x([\da-f]){64}/i;
              if (currentTab !== "removeScheme" && values.parametersHash && !parametersHashPattern.test(values.parametersHash)) {
                errors.parametersHash = "Invalid parameters hash";
              }
*/}

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

                  <div className={tabClasses["updateMasterCopy"]}>
                    <div>
                      <label htmlFor="newContractAddress">
                        New Contract Address
                        <ErrorMessage name="newContractAddress">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                        <div className={css.requiredMarker}>*</div>
                      </label>
                      <Field
                        id="newContractAddress"
                        placeholder="New contract address"
                        name="newContractAddress"
                        className={touched.newContractAddress && errors.newContractAddress ? css.error : null}
                      />
                    </div>
                  </div>

                  <div className={tabClasses["changeOracle"]}>
                    <div>
                      <label htmlFor="newContractAddress">
                        New Contract Address
                        <ErrorMessage name="newContractAddress">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                        <div className={css.requiredMarker}>*</div>
                      </label>
                      <Field
                        id="newContractAddress"
                        placeholder="skldfjsjh"
                        name="newContractAddress"
                        className={touched.newContractAddress && errors.newContractAddress ? css.error : null}
                      />
                    </div>
                  </div>

                  <div className={tabClasses["changeOwner"]}>
                    <div>
                      <label htmlFor="newOwnerAddress">
                        New Owner Address
                        <ErrorMessage name="newOwnerAddress">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                        <div className={css.requiredMarker}>*</div>
                      </label>
                      <Field
                        id="newOwnerAddress"
                        placeholder="skldfjsjh"
                        name="newOwnerAddress"
                        className={touched.newContractAddress && errors.newContractAddress ? css.error : null}
                      />
                    </div>
                  </div>

                  <div className={tabClasses["addTokens"]}>
                    <div>
                      <label htmlFor="newOwnerAddress">
                        New Owner Address
                        <ErrorMessage name="newOwnerAddress">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                        <div className={css.requiredMarker}>*</div>
                      </label>
                      <Field
                        id="newOwnerAddress"
                        placeholder="skldfjsjh"
                        name="newOwnerAddress"
                        className={touched.newContractAddress && errors.newContractAddress ? css.error : null}
                      />
                    </div>
                  </div>

                  <div className={tabClasses["removeTokens"]}>
                    <div>
                      <label htmlFor="newOwnerAddress">
                        New Owner Address
                        <ErrorMessage name="newOwnerAddress">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                        <div className={css.requiredMarker}>*</div>
                      </label>
                      <Field
                        id="newOwnerAddress"
                        placeholder="skldfjsjh"
                        name="newOwnerAddress"
                        className={touched.newContractAddress && errors.newContractAddress ? css.error : null}
                      />
                    </div>
                  </div>

                  <div className={tabClasses["tokenThreshold"]}>
                    <div>
                      <label htmlFor="tokenPairThreshold">
                        New token threshold
                        <ErrorMessage name="tokenPairThreshold">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                        <div className={css.requiredMarker}>*</div>
                      </label>
                      <Field
                        id="tokenPairThreshold"
                        placeholder="skldfjsjh"
                        name="tokenPairThreshold"
                        type="number"
                        className={touched.tokenPairThreshold && errors.tokenPairThreshold ? css.error : null}
                      />
                    </div>
                  </div>

                  <div className={tabClasses["auctionThreshold"]}>
                    <div>
                      <label htmlFor="auctionThreshold">
                        New auction threshold
                        <ErrorMessage name="auctionThreshold">{(msg) => <span className={css.errorMessage}>{msg}</span>}</ErrorMessage>
                        <div className={css.requiredMarker}>*</div>
                      </label>
                      <Field
                        id="auctionThreshold"
                        placeholder="skldfjsjh"
                        name="auctionThreshold"
                        type="number"
                        className={touched.auctionThreshold && errors.auctionThreshold ? css.error : null}
                      />
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
