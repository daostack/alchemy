import * as Arc from "@daostack/arc.js";
import * as H from "history";
import { denormalize } from "normalizr";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { connect, Dispatch } from "react-redux";
import { Web3 } from "web3";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDaoState } from "reducers/arcReducer";
import { IWeb3State } from "reducers/web3Reducer";
import * as schemas from "../../schemas";

import * as css from "./CreateProposal.scss";

import AccountImage from "components/Account/AccountImage";
import DaoHeader from "../ViewDao/DaoHeader";

import { Formik, Field } from 'formik';

interface IStateProps {
  dao: IDaoState;
  daoAddress: string;
  history: H.History;
  web3: IWeb3State;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    dao: denormalize(state.arc.daos[ownProps.match.params.daoAddress], schemas.daoSchema, state.arc),
    daoAddress : ownProps.match.params.daoAddress,
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
  reputationReward: number;
  title: string;

  [key: string]: any;
}

class CreateProposalContainer extends React.Component<IProps, null> {
  private web3: Web3;
  constructor(props: IProps) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  public async componentDidMount() {
    if (!this.props.dao) {
      this.props.getDAO(this.props.daoAddress);
    }

    this.web3 = await Arc.Utils.getWeb3();
  }

  public handleSubmit(values: FormValues) {
    const { createProposal, dao: { avatarAddress } } = this.props;
    const {
      title,
      description,
      nativeTokenReward,
      reputationReward,
      ethReward,
      beneficiaryAddress,
    } = values;

    createProposal(
      avatarAddress,
      title,
      description,
      nativeTokenReward,
      reputationReward,
      ethReward,
      beneficiaryAddress,
    );
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
    const { dao } = this.props;
    return(
      dao ? <div className={css.createProposalWrapper}>
        <h2>
          <img className={css.editIcon} src="/assets/images/Icon/Edit.svg"/>
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
            reputationReward: 0,
            title: ''
          } as FormValues}
          validate={(values: FormValues) => {
            const {
              beneficiaryAddress,
              description,
              ethReward,
              externalTokenReward,
              nativeTokenReward,
              reputationReward,
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

            if (!this.web3.isAddress(beneficiaryAddress)) {
              errors.beneficiaryAddress = 'Invalid address';
            }

            if (!/^(ftp|http|https):\/\/[^ "]+$/.test(description)) {
              errors.description = 'Invalid URL';
            }

            nonNegative('ethReward');
            nonNegative('externalTokenReward');
            nonNegative('nativeTokenReward');
            nonNegative('reputationReward');

            require('description');
            require('title');
            require('beneficiaryAddress');

            if (!ethReward && !reputationReward) {
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
            <form onSubmit={handleSubmit}>
              <label htmlFor="titleInput">
                Title (120 characters)
                <img className={css.infoTooltip} src="/assets/images/Icon/Info.svg"/>
              </label>
              <Field
                autoFocus
                id="titleInput"
                maxLength={120}
                placeholder="Summarize your propsoal"
                name='title'
                type="text"
                className={touched.title && errors.title ? css.error : null}
              />
              {touched.title && errors.title && <span className={css.errorMessage}>{errors.title}</span>}
              <label htmlFor="descriptionInput">
                Description (URL)
                <a className={css.recommendedTemplate} href="https://docs.google.com/document/d/1JzBUikOfEll9gaJ9N2OfaJJeelWxoHzffNcZqeqWDTM/edit#heading=h.vaikfqc64l1" target="_blank">
                  Recommended template
                </a>
                <img className={css.infoTooltip} src="/assets/images/Icon/Info.svg"/>
              </label>
              <Field
                id="descriptionInput"
                placeholder="Proposal description URL"
                name='description'
                type="text"
                className={touched.description && errors.description ? css.error : null}
              />
              {touched.description && errors.description && <span className={css.errorMessage}>{errors.description}</span>}
              <label htmlFor="beneficiaryInput">
                Target Address
                <img className={css.infoTooltip} src="/assets/images/Icon/Info.svg"/>
              </label>
              <Field
                id="beneficiaryInput"
                maxLength={42}
                placeholder="Recipient's address public key"
                name='beneficiaryAddress'
                type="text"
                className={touched.beneficiaryAddress && errors.beneficiaryAddress ? css.error : null}
              />
              {touched.beneficiaryAddress && errors.beneficiaryAddress && <span className={css.errorMessage}>{errors.beneficiaryAddress}</span>}
              <div className={css.addTransfer}>
                <div style={{display: 'none'}}>
                  <label htmlFor="nativeTokenRewardInput">{dao.tokenSymbol} reward: </label>
                  <Field
                    id="nativeTokenRewardInput"
                    maxLength={10}
                    placeholder="How many tokens to reward"
                    name='nativeTokenReward'
                    type="number"
                    className={touched.nativeTokenReward && errors.nativeTokenReward ? css.error : null}
                  />
                  {touched.nativeTokenReward && errors.nativeTokenReward && <span className={css.errorMessage}>{errors.nativeTokenReward}</span>}
                </div>
                <label htmlFor="reputationRewardInput">Reputation reward: </label>
                <Field
                  id="reputationRewardInput"
                  placeholder="How much reputation to reward"
                  name='reputationReward'
                  type="number"
                  className={touched.reputationReward && errors.reputationReward ? css.error : null}
                  min={0}
                />
                {touched.reputationReward && errors.reputationReward && <span className={css.errorMessage}>{errors.reputationReward}</span>}
                <label htmlFor="ethRewardInput">ETH reward: </label>
                <Field
                  id="ethRewardInput"
                  placeholder="How much ETH to reward"
                  name='ethReward'
                  type="number"
                  className={touched.ethReward && errors.ethReward ? css.error : null}
                  min={0}
                />
                {touched.ethReward && errors.ethReward && <span className={css.errorMessage}>{errors.ethReward}</span>}

                {touched.ethReward && touched.reputationReward && errors.rewards && <span className={css.errorMessage}><br/> {errors.rewards}</span>}
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
                  <img src="/assets/images/Icon/Send.svg"/>
                  Submit proposal
                </button>
              </div>
            </form>
          }
        />

      </div>
      : "Loading..."
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateProposalContainer);
