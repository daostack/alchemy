import * as Arc from "@daostack/arc.js";
import * as H from "history";
import { denormalize } from "normalizr";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { connect, Dispatch } from "react-redux";
import * as Web3 from "web3";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDaoState } from "reducers/arcReducer";
import { IWeb3State } from "reducers/web3Reducer";
import * as schemas from "../../schemas";

import * as css from "./CreateProposal.scss";

import AccountImage from "components/Account/AccountImage";
import DaoHeader from "../ViewDao/DaoHeader";

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

interface FormErrors {
  beneficiary?: string;
}

interface IState {
  avatarAddress: string;
  beneficiary: string;
  description: string;
  ethReward: number | string;
  externalTokenAddress: string;
  externalTokenReward: number | string;
  nativeTokenReward: number | string;
  reputationReward: number | string;
  title: string;
  buttonEnabled: boolean;
  errors: FormErrors;
}

class CreateProposalContainer extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      avatarAddress: this.props.daoAddress,
      beneficiary: "",
      description: "",
      ethReward: "",
      externalTokenAddress: null,
      externalTokenReward: "",
      nativeTokenReward: "",
      reputationReward: "",
      title: "",
      buttonEnabled : true,
      errors: {},
    };
  }

  public validate(): FormErrors {
    const state = this.state;
    const out: FormErrors = {};
    const web3: Web3 = Arc.Utils.getWeb3();

    if (!web3.isAddress(state.beneficiary)) {
      out.beneficiary = "Invalid address";
    }

    this.setState({...this.state, errors: out});
    return out;
  }

  public componentDidMount() {
    if (!this.props.dao) {
      this.props.getDAO(this.props.daoAddress);
    }
  }

  public handleSubmit = (event: any) => {
    event.preventDefault();

    if (!Object.keys(this.state.errors).length) {
      this.setState({...this.state, buttonEnabled: false });
      this.props.createProposal(
        this.state.avatarAddress,
        this.state.title,
        this.state.description,
        Number(this.state.nativeTokenReward),
        Number(this.state.reputationReward),
        this.state.beneficiary,
      );
    }
  }

  public goBack() {
    const { history, dao } = this.props;

    if (history.length > 0) {
      history.goBack();
    } else {
      history.push("/dao/" + dao.avatarAddress);
    }
  }

  public handleChange = (event: any) => {
    const newTitle = (ReactDOM.findDOMNode(this.refs.titleNode) as HTMLInputElement).value;
    const newDescription = (ReactDOM.findDOMNode(this.refs.descriptionNode) as HTMLInputElement).value;
    const newNativeTokenReward = (ReactDOM.findDOMNode(this.refs.nativeTokenRewardNode) as HTMLInputElement).value;
    const newReputationReward = (ReactDOM.findDOMNode(this.refs.reputationRewardNode) as HTMLInputElement).value;
    const newBenificiary = (ReactDOM.findDOMNode(this.refs.beneficiaryNode) as HTMLInputElement).value;

    this.setState({
      beneficiary: newBenificiary,
      description: newDescription,
      nativeTokenReward: newNativeTokenReward,
      reputationReward: newReputationReward,
      title: newTitle,
    });
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
        <form onSubmit={this.handleSubmit}>
          <label htmlFor="titleInput">
            Title (120 characters)
            <img className={css.infoTooltip} src="/assets/images/Icon/Info.svg"/>
          </label>
          <input
            autoFocus
            id="titleInput"
            onChange={this.handleChange}
            placeholder="Summarize your propsoal"
            ref="titleNode"
            required
            type="text"
            value={this.state.title}
          />
          <label htmlFor="descriptionInput">
            Description (URL)
            <a className={css.recommendedTemplate} href="https://docs.google.com/document/d/1JzBUikOfEll9gaJ9N2OfaJJeelWxoHzffNcZqeqWDTM/edit#heading=h.vaikfqc64l1" target="_blank">
              Recommended template
            </a>
            <img className={css.infoTooltip} src="/assets/images/Icon/Info.svg"/>
          </label>
          <input
            id="descriptionInput"
            onChange={this.handleChange}
            placeholder="Proposal description URL"
            ref="descriptionNode"
            required
            type="text"
            value={this.state.description}
          />
          <label htmlFor="beneficiaryInput">
            Target Address
            <img className={css.infoTooltip} src="/assets/images/Icon/Info.svg"/>
          </label>
          <input
            id="beneficiaryInput"
            className={this.state.errors.beneficiary ? css.error : null}
            maxLength={42}
            onChange={this.handleChange}
            onBlur={(e) => this.validate()}
            placeholder="Recipient's address public key"
            ref="beneficiaryNode"
            required
            type="text"
            value={this.state.beneficiary}
          />
          {this.state.errors.beneficiary ?
            <span className={css.errorMessage}>
              {this.state.errors.beneficiary}
            </span>
            : ""
          }
          <div className={css.addTransfer}>
            <label htmlFor="nativeTokenRewardInput">{dao.tokenSymbol} Token reward: </label>
            <input
              id="nativeTokenRewardInput"
              maxLength={10}
              onChange={this.handleChange}
              placeholder="How many tokens to reward"
              ref="nativeTokenRewardNode"
              required
              type="number"
              value={this.state.nativeTokenReward}
            />
            <label htmlFor="reputationRewardInput">Reputation reward: </label>
            <input
              id="reputationRewardInput"
              maxLength={10}
              onChange={this.handleChange}
              placeholder="How much reputation to reward"
              ref="reputationRewardNode"
              required
              type="number"
              value={this.state.reputationReward}
            />
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
                    <AccountImage accountAddress={this.state.beneficiary} className={css.userAvatar} />
                  </td>
                  <td className={css.transferTotals}>
                    <span className={css.tokenAmount}>79.98 ETH</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>*/}

          <div className={css.alignCenter}>
            <button className={css.submitProposal} type="submit" disabled={!this.state.buttonEnabled || !!Object.keys(this.state.errors).length}>
              <img src="/assets/images/Icon/Send.svg"/>
              Submit proposal
            </button>
          </div>
        </form>
      </div>
      : "Loading..."
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateProposalContainer);
