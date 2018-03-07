import * as H from 'history';
import { denormalize } from 'normalizr';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { connect, Dispatch } from 'react-redux';

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IDaoState } from 'reducers/arcReducer';
import { IWeb3State } from 'reducers/web3Reducer'
import * as schemas from '../../schemas';

import * as css from './CreateProposal.scss';

import AccountImage from 'components/Account/AccountImage';
import DaoHeader from '../ViewDao/DaoHeader';

interface IStateProps {
  dao: IDaoState,
  daoAddress : string,
  history: H.History,
  web3: IWeb3State
}

const mapStateToProps = (state : IRootState, ownProps: any) => {
  return {
    dao: denormalize(state.arc.daos[ownProps.match.params.daoAddress], schemas.daoSchema, state.arc),
    daoAddress : ownProps.match.params.daoAddress,
    history: ownProps.history,
    web3: state.web3
  };
};

interface IDispatchProps {
  createProposal: typeof arcActions.createProposal
  getDAO: typeof arcActions.getDAO
}

const mapDispatchToProps = {
  createProposal: arcActions.createProposal,
  getDAO: arcActions.getDAO
};

type IProps = IStateProps & IDispatchProps

interface IState {
  avatarAddress: string,
  beneficiary: string,
  description: string,
  ethReward: number,
  externalTokenAddress: string,
  externalTokenReward: number,
  nativeTokenReward: number,
  reputationReward: number,
  title: string
  buttonEnabled: boolean
}

class CreateProposalContainer extends React.Component<IProps, IState> {

  constructor(props: IProps){
    super(props);

    this.state = {
      avatarAddress: this.props.daoAddress,
      beneficiary: "",
      description: "",
      ethReward: 0,
      externalTokenAddress: null,
      externalTokenReward: 0,
      nativeTokenReward: 0,
      reputationReward: 0,
      title: "",
      buttonEnabled : true
    };
  }

  componentDidMount() {
    if (!this.props.dao) {
      this.props.getDAO(this.props.daoAddress);
    }
  }

  handleSubmit = (event : any) => {
    event.preventDefault();
    this.setState({ buttonEnabled: false });
    this.props.createProposal(this.state.avatarAddress, this.state.title, this.state.description, this.state.nativeTokenReward, this.state.reputationReward, this.state.beneficiary);
  }

  goBack() {
    const { history, dao } = this.props;

    if (history.length > 0) {
      history.goBack();
    } else {
      history.push("/dao/" + dao.avatarAddress);
    }
  }

  handleChange = (event : any) => {
    const newTitle = (ReactDOM.findDOMNode(this.refs.titleNode) as HTMLInputElement).value;
    const newDescription = (ReactDOM.findDOMNode(this.refs.descriptionNode) as HTMLInputElement).value;
    const newNativeTokenReward = Number((ReactDOM.findDOMNode(this.refs.nativeTokenRewardNode) as HTMLInputElement).value);
    const newReputationReward = Number((ReactDOM.findDOMNode(this.refs.reputationRewardNode) as HTMLInputElement).value);
    const newBenificiary = (ReactDOM.findDOMNode(this.refs.beneficiaryNode) as HTMLInputElement).value;
    this.setState({
      beneficiary: newBenificiary,
      description: newDescription,
      nativeTokenReward: newNativeTokenReward,
      reputationReward: newReputationReward,
      title: newTitle,
    });
  }

  render() {
    const { dao } = this.props;

    return(
      dao ? <div className={css.createProposalWrapper}>
        <h2>
          <img className={css.editIcon} src='/assets/images/Icon/Edit.svg'/>
          <span>Create proposal</span>
          <button className={css.exitProposalCreation} onClick={this.goBack.bind(this)}>
            <img src='/assets/images/Icon/Close.svg'/>
          </button>
        </h2>
        <form onSubmit={this.handleSubmit}>
          <label htmlFor='titleInput'>
            Title (120 characters)
            <img className={css.infoTooltip} src='/assets/images/Icon/Info.svg'/>
          </label>
          <input
            autoFocus
            id='titleInput'
            onChange={this.handleChange}
            placeholder="Summarize your propsoal"
            ref="titleNode"
            required
            type="text"
            value={this.state.title}
          />
          <label htmlFor="descriptionInput">
            Description (URL)
            <button className={css.recommendedTemplate}>Recommended template</button>
            <img className={css.infoTooltip} src='/assets/images/Icon/Info.svg'/>
          </label>
          <input
            id='descriptionInput'
            onChange={this.handleChange}
            placeholder="Proposal description URL"
            ref="descriptionNode"
            required
            type="text"
            value={this.state.description}
          />
          <label htmlFor='beneficiaryInput'>
            Target Address
            <img className={css.infoTooltip} src='/assets/images/Icon/Info.svg'/>
          </label>
          <input
            id='beneficiaryInput'
            maxLength={42}
            onChange={this.handleChange}
            placeholder="Recipient's address public key"
            ref="beneficiaryNode"
            required
            type="text"
            value={this.state.beneficiary}
          />
          <div className={css.addTransfer}>
            <label htmlFor='nativeTokenRewardInput'>{dao.tokenSymbol} Token reward: </label>
            <input
              id='nativeTokenRewardInput'
              maxLength={10}
              onChange={this.handleChange}
              placeholder="How many tokens to reward"
              ref="nativeTokenRewardNode"
              required
              type="number"
              value={this.state.nativeTokenReward}
            />
            <label htmlFor='reputationRewardInput'>Reputation reward: </label>
            <input
              id='reputationRewardInput'
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
            <button className={css.submitProposal} type='submit' disabled={!this.state.buttonEnabled}>
              <img src='/assets/images/Icon/Send.svg'/>
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
