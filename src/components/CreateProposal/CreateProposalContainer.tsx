import * as Arc from "@daostack/arc.js";
import * as H from "history";
import * as React from "react";
import { connect } from "react-redux";
import { Web3 } from "web3";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IWeb3State } from "reducers/web3Reducer";

import * as css from "./CreateProposal.scss";

import { default as PreTransactionModal, ActionTypes } from "components/Shared/PreTransactionModal";
import UserSearchField from "components/Shared/UserSearchField";
import ReputationView from "components/Account/ReputationView";

import { Formik, Field } from 'formik';

import Subscribe, { IObservableState } from "components/Shared/Subscribe"
import { arc } from "arc";
import { IDAOState, IProposalState, ProposalOutcome, ProposalStage } from '@daostack/client'

const emptyProposal: IProposalState = {
  beneficiary: null,
  boostedAt: 0,
  boostedVotePeriodLimit: 0,
  boostingThreshold: 0,
  createdAt: 0,
  description: "",
  dao: null,
  ethReward: 0,
  executedAt: 0,
  externalTokenReward: 0,
  nativeTokenReward: 0,
  id: null,
  descriptionHash: "",
  preBoostedVotePeriodLimit: 0,
  proposer: null,
  proposingRepReward: 0,
  quietEndingPeriodBeganAt: 0,
  reputationReward: 0,
  resolvedAt: 0,
  stakesFor: 0,
  stakesAgainst: 0,
  stage: ProposalStage.Open,
  title: "",
  votesFor: 0,
  votesAgainst: 0,
  winningOutcome: ProposalOutcome.Fail,
}

interface IState {
  preTransactionModalOpen: boolean;
  proposalDetails: IProposalState;
}

interface IStateProps {
  currentAccount: string;
  daoAvatarAddress: string;
  history: H.History;
  web3: IWeb3State;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    currentAccount: state.web3.ethAccountAddress,
    daoAvatarAddress : ownProps.match.params.daoAvatarAddress,
    history: ownProps.history,
    web3: state.web3,
  };
};

interface IDispatchProps {
  createProposal: typeof arcActions.createProposal;
}

const mapDispatchToProps = {
  createProposal: arcActions.createProposal,
};

type IProps = IStateProps & IDispatchProps;

interface FormValues {
  beneficiary: string;
  description: string;
  ethReward: number;
  externalTokenReward: number;
  nativeTokenReward: number;
  reputationReward: number;
  title: string;

  [key: string]: any;
}

class CreateProposalContainer extends React.Component<IProps, IState> {
  private web3: Web3;

  constructor(props: IProps) {
    super(props);

    this.state = {
      preTransactionModalOpen: false,
      proposalDetails: emptyProposal
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  public async componentDidMount() {
    this.web3 = await Arc.Utils.getWeb3();
  }

  public handleSubmit(values: FormValues, { props, setSubmitting, setErrors }: any ) {
    this.setState({
      preTransactionModalOpen: true,
      proposalDetails: { ...emptyProposal, ...values}
    });
    setSubmitting(false);
  }

  public closePreTransactionModal() {
    this.setState({ preTransactionModalOpen: false });
  }

  public goBack(address: string) {
    const { history } = this.props;

    if (history.length > 0) {
      history.goBack();
    } else {
      history.push("/dao/" + address);
    }
  }

  public render() {
    const { createProposal, currentAccount, daoAvatarAddress } = this.props;
    const { beneficiary, description, ethReward, externalTokenReward, nativeTokenReward, reputationReward, title } = this.state.proposalDetails;

    return <Subscribe observable={arc.dao(daoAvatarAddress).state}>{
      (state: IObservableState<IDAOState>) => {
        if ( state.data !== null ) {
          const dao: IDAOState = state.data

          // TODO: this is used to check uniqueness of proposalDescriptions,
          // it is disabled at this moment, but should be restored
          // const proposalDescriptions = (dao.proposals as IProposalState[])
          //   .filter((proposal) => !proposalEnded(proposal))
          //   .map((proposal) => proposal.description);
          const proposalDescriptions: string[] = []
          const boundCreateProposal = createProposal.bind(null, dao.address, title, description, nativeTokenReward, reputationReward, ethReward, externalTokenReward, beneficiary)
          return (
            <div className={css.createProposalWrapper}>
              {this.state.preTransactionModalOpen ?
                <PreTransactionModal
                  actionType={ActionTypes.CreateProposal}
                  action={boundCreateProposal}
                  closeAction={this.closePreTransactionModal.bind(this)}
                  currentAccount={currentAccount}
                  dao={dao}
                  effectText={<span>Budget: <ReputationView reputation={reputationReward}
                    totalReputation={dao.reputationTotalSupply} daoName={dao.name}/> and
                    {ethReward || externalTokenReward} {externalTokenReward ? dao.externalTokenSymbol : "ETH"}</span>}
                  proposal={this.state.proposalDetails}
                /> : ""
              }

              <h2>
                <img className={css.editIcon} src="/assets/images/Icon/Draft-white.svg"/>
                <span>Create proposal</span>
                <button className={css.exitProposalCreation} onClick={this.goBack.bind(this, dao.address)}>
                  <img src="/assets/images/Icon/Close.svg"/>
                </button>
              </h2>
              <Formik
                initialValues={{
                  beneficiary: '',
                  description: '',
                  ethReward: 0,
                  externalTokenReward: 0,
                  nativeTokenReward: 0,
                  reputationReward: 0,
                  title: ''
                } as FormValues}
                validate={(values: FormValues) => {
                  const errors: any = {};

                  const require = (name: string) => {
                    if (!(values as any)[name]) {
                      errors[name] = 'Required';
                    }
                  };

                  const nonNegative = (name: string) => {
                    if ((values as any)[name] < 0) {
                      errors[name] = 'Please enter a non-negative reward';
                    }
                  };

                  if (values.title.length > 120) {
                    errors.title = 'Title is too long (max 120 characters)';
                  }

                  // ???
                  if (proposalDescriptions.indexOf(values.description) !== -1) {
                    errors.description = 'Must be unique';
                  }

                  if (!this.web3.isAddress(values.beneficiary)) {
                    errors.beneficiary = 'Invalid address';
                  }

                  const pattern = new RegExp('(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})');
                  if (!pattern.test(values.description)) {
                    errors.description = 'Invalid URL';
                  }

                  nonNegative('ethReward');
                  nonNegative('externalTokenReward');
                  nonNegative('nativeTokenReward');

                  require('description');
                  require('title');
                  require('beneficiary');

                  if (!values.ethReward && !values.reputationReward) {
                    errors.rewards = 'Please select at least some reward';
                  }

                  return errors;
                }}
                onSubmit={this.handleSubmit}
                render={({
                  values,
                  errors,
                  touched,
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  isSubmitting,
                  isValid,
                  setFieldTouched,
                  setFieldValue
                }) =>
                  <form onSubmit={handleSubmit} noValidate>
                    <Field
                      autoFocus
                      id="titleInput"
                      maxLength={120}
                      placeholder="Summarize your proposal"
                      name='title'
                      type="text"
                      className={touched.title && errors.title ? css.error : null}
                    />
                    <label htmlFor="titleInput">
                      Title (120 characters)
                      <img className={css.infoTooltip} src="/assets/images/Icon/Info.svg"/>
                      {touched.title && errors.title && <span className={css.errorMessage}>{errors.title}</span>}
                    </label>
                    <Field
                      id="descriptionInput"
                      placeholder="Proposal description URL"
                      name='description'
                      type="text"
                      className={touched.description && errors.description ? css.error : null}
                    />
                    <label htmlFor="descriptionInput">
                      Description (URL)
                      <a className={css.recommendedTemplate} href="https://docs.google.com/document/d/1JzBUikOfEll9gaJ9N2OfaJJeelWxoHzffNcZqeqWDTM/edit#heading=h.vaikfqc64l1" target="_blank">
                        Recommended template
                      </a>
                      <img className={css.infoTooltip} src="/assets/images/Icon/Info.svg"/>
                      {touched.description && errors.description && <span className={css.errorMessage}>{errors.description}</span>}
                    </label>

                    <UserSearchField
                      daoAvatarAddress={daoAvatarAddress}
                      name="beneficiary"
                      onBlur={(touched) => { setFieldTouched("beneficiary", touched)}}
                      onChange={(newValue) => { setFieldValue("beneficiary", newValue)}}
                    />
                    <label htmlFor="beneficiary">
                      Please make sure that the target ETH address can work with Metamask (e.g. no exchanges)
                      <img className={css.infoTooltip} src="/assets/images/Icon/Info.svg"/>
                      {touched.beneficiary && errors.beneficiary && <span className={css.errorMessage}>{errors.beneficiary}</span>}
                    </label>

                    <div className={css.addTransfer}>
                      <div style={{display: 'none'}}>
                        <Field
                          id="nativeTokenRewardInput"
                          maxLength={10}
                          placeholder="How many tokens to reward"
                          name='nativeTokenReward'
                          type="number"
                          className={touched.nativeTokenReward && errors.nativeTokenReward ? css.error : null}
                        />
                        <label htmlFor="nativeTokenRewardInput">
                          {dao.tokenSymbol} reward:
                          {touched.nativeTokenReward && errors.nativeTokenReward && <span className={css.errorMessage}>{errors.nativeTokenReward}</span>}
                        </label>
                      </div>
                      <Field
                        id="reputationRewardInput"
                        placeholder="How much reputation to reward"
                        name='reputationReward'
                        type="number"
                        className={touched.reputationReward && errors.reputationReward ? css.error : null}
                        step={0.1}
                      />
                      <label htmlFor="reputationRewardInput">
                        Reputation reward:
                        {touched.reputationReward && errors.reputationReward && <span className={css.errorMessage}>{errors.reputationReward}</span>}
                      </label>

                      {dao.externalTokenAddress
                        ? <div>
                            <Field
                              id="externalTokenRewardInput"
                              placeholder={`How much ${dao.externalTokenSymbol} to reward`}
                              name='externalTokenReward'
                              type="number"
                              className={touched.externalTokenReward && errors.externalTokenReward ? css.error : null}
                              min={0}
                              step={0.1}
                            />
                            <label htmlFor="externalRewardInput">
                              Proposal budget ({dao.externalTokenSymbol}):
                              {touched.externalTokenReward && errors.externalTokenReward && <span className={css.errorMessage}>{errors.externalTokenReward}</span>}
                            </label>
                          </div>
                        : <div>
                            <Field
                              id="ethRewardInput"
                              placeholder="How much ETH to reward"
                              name='ethReward'
                              type="number"
                              className={touched.ethReward && errors.ethReward ? css.error : null}
                              min={0}
                              step={0.1}
                            />
                            <label htmlFor="ethRewardInput">
                              Proposal budget (ETH):
                              {touched.ethReward && errors.ethReward && <span className={css.errorMessage}>{errors.ethReward}</span>}
                            </label>
                          </div>
                      }

                      {(touched.ethReward || touched.externalTokenReward) && touched.reputationReward && errors.rewards && <span className={css.errorMessage + " " + css.someReward}><br/> {errors.rewards}</span>}
                    </div>
                    <div className={css.alignCenter}>
                      <button className={css.submitProposal} type="submit" disabled={isSubmitting}>
                        <img className={css.sendIcon} src="/assets/images/Icon/Send.svg"/>
                        <img className={css.loading} src="/assets/images/Icon/Loading-black.svg"/>
                        Submit proposal
                      </button>
                    </div>
                  </form>
                }
              />

            </div>
          )
        } else {
          return null
       }
     }
    }</Subscribe>
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateProposalContainer);
