import * as Arc from "@daostack/arc.js";
import * as H from "history";
import { denormalize } from "normalizr";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { connect, Dispatch } from "react-redux";
import { Web3 } from "web3";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDaoState, IProposalState, emptyProposal } from "reducers/arcReducer";
import { IWeb3State } from "reducers/web3Reducer";
import * as schemas from "schemas";

import * as css from "./CreateProposal.scss";

import AccountImage from "components/Account/AccountImage";
import DaoHeader from "../ViewDao/DaoHeader";
import { default as PreTransactionModal, ActionTypes } from "components/Shared/PreTransactionModal";
import ReputationView from "components/Account/ReputationView";

import { Formik, Field, FormikBag } from 'formik';
import { proposalEnded } from "reducers/arcReducer";

interface IState {
  preTransactionModalOpen: boolean;
  proposalDetails: IProposalState;
}

interface IStateProps {
  currentAccount: string;
  dao: IDaoState;
  daoAvatarAddress: string;
  history: H.History;
  web3: IWeb3State;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    currentAccount: state.web3.ethAccountAddress,
    dao: denormalize(state.arc.daos[ownProps.match.params.daoAvatarAddress], schemas.daoSchema, state.arc),
    daoAvatarAddress : ownProps.match.params.daoAvatarAddress,
    history: ownProps.history,
    web3: state.web3,
  };
};

interface IDispatchProps {
  createProposal: typeof arcActions.createProposal;
  getDAO: typeof arcActions.getDAO;
}

const mapDispatchToProps = {
  createProposal: arcActions.createProposal,
  getDAO: arcActions.getDAO,
};

type IProps = IStateProps & IDispatchProps;

interface FormValues {
  beneficiaryAddress: string;
  description: string;
  ethReward: number;
  externalTokenReward: number;
  nativeTokenReward: number;
  reputationChange: number;
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
    if (!this.props.dao) {
      this.props.getDAO(this.props.daoAvatarAddress);
    }

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

  public goBack() {
    const { history, dao } = this.props;

    if (history.length > 0) {
      history.goBack();
    } else {
      history.push("/dao/" + dao.avatarAddress);
    }
  }

  public render() {
    const { createProposal, currentAccount, dao } = this.props;
    const { beneficiaryAddress, description, ethReward, externalTokenReward, nativeTokenReward, reputationChange, title } = this.state.proposalDetails;

    if (!dao) {
      return "Loading...";
    }

    const proposalDescriptions = (dao.proposals as IProposalState[])
      .filter((proposal) => !proposalEnded(proposal))
      .map((proposal) => proposal.description);

    return (
      <div className={css.createProposalWrapper}>
        {this.state.preTransactionModalOpen ?
          <PreTransactionModal
            actionType={ActionTypes.CreateProposal}
            action={createProposal.bind(null, dao.avatarAddress, title, description, nativeTokenReward, reputationChange, ethReward, beneficiaryAddress)}
            closeAction={this.closePreTransactionModal.bind(this)}
            currentAccount={currentAccount}
            dao={dao}
            effectText={<span>Budget: <ReputationView reputation={reputationChange} totalReputation={dao.reputationCount} daoName={dao.name}/> and {ethReward} ETH</span>}
            proposal={this.state.proposalDetails}
          /> : ""
        }

        <h2>
          <img className={css.editIcon} src="/assets/images/Icon/Draft-white.svg"/>
          <span>Create proposal</span>
          <button className={css.exitProposalCreation} onClick={this.goBack.bind(this)}>
            <img src="/assets/images/Icon/Close.svg"/>
          </button>
        </h2>
        <Formik
          initialValues={{
            beneficiaryAddress: '',
            description: '',
            ethReward: 0,
            externalTokenReward: 0,
            nativeTokenReward: 0,
            reputationChange: 0,
            title: ''
          } as FormValues}
          validate={(values: FormValues) => {
            const {
              beneficiaryAddress,
              description,
              ethReward,
              externalTokenReward,
              nativeTokenReward,
              reputationChange,
              title
            } = values;
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

            if (title.length > 120) {
              errors.title = 'Title is too long (max 120 characters)';
            }

            if (proposalDescriptions.indexOf(description) !== -1) {
              errors.description = 'Must be unique';
            }

            if (!this.web3.isAddress(beneficiaryAddress)) {
              errors.beneficiaryAddress = 'Invalid address';
            }

            const pattern = new RegExp('(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})');
            if (!pattern.test(description)) {
              errors.description = 'Invalid URL';
            }

            nonNegative('ethReward');
            nonNegative('externalTokenReward');
            nonNegative('nativeTokenReward');

            require('description');
            require('title');
            require('beneficiaryAddress');

            if (!ethReward && !reputationChange) {
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
              <Field
                id="beneficiaryInput"
                maxLength={42}
                placeholder="Recipient's address public key"
                name='beneficiaryAddress'
                type="text"
                className={touched.beneficiaryAddress && errors.beneficiaryAddress ? css.error : null}
              />
              <label htmlFor="beneficiaryInput">
                Target Address - Please make sure that the target ETH address can work with Metamask (no hardware wallets, no exchanges)
                <img className={css.infoTooltip} src="/assets/images/Icon/Info.svg"/>
                {touched.beneficiaryAddress && errors.beneficiaryAddress && <span className={css.errorMessage}>{errors.beneficiaryAddress}</span>}
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
                  id="reputationChangeInput"
                  placeholder="How much reputation to reward"
                  name='reputationChange'
                  type="number"
                  className={touched.reputationChange && errors.reputationChange ? css.error : null}
                  step={0.1}
                />
                <label htmlFor="reputationChangeInput">
                  Reputation reward:
                  {touched.reputationChange && errors.reputationChange && <span className={css.errorMessage}>{errors.reputationChange}</span>}
                </label>
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

                {touched.ethReward && touched.reputationChange && errors.rewards && <span className={css.errorMessage + " " + css.someReward}><br/> {errors.rewards}</span>}
              </div>
              {/*
              <div className={css.transactionList}>
                <h3 className={css.transactionListHeader}>
                  Transactions
                  <span>TOTAL</span>
                </h3>
                <table>
                  <tbody>
                    <tr>
                      <td>
                        <span className={css.tokenAmount}>12.333 ETH </span>
                        monthly for 6 months
                        <img className={css.transferIcon} src='/assets/images/Icon/Send.svg'/>
                        <AccountImage accountAddress={this.state.beneficiaryAddress} className={css.userAvatar} />
                      </td>
                      <td className={css.transferTotals}>
                        <span className={css.tokenAmount}>79.98 ETH</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>*/}
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
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateProposalContainer);
