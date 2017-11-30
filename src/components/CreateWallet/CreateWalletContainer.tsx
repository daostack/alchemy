import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { connect, Dispatch } from 'react-redux';

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IDaoState, ICollaboratorState } from 'reducers/arcReducer';
import { IWeb3State } from 'reducers/web3Reducer'

import * as css from './CreateWallet.scss';

interface IStateProps {
  web3: IWeb3State
}

const mapStateToProps = (state : IRootState, ownProps: any) => {
  return {
    web3: state.web3
  };
};

interface IDispatchProps {
  createWallet: typeof arcActions.createWallet
}

const mapDispatchToProps = {
  createWallet: arcActions.createWallet
};

type IProps = IStateProps & IDispatchProps

interface IState {
  password: string,
}

class CreateWalletContainer extends React.Component<IProps, IState> {

  constructor(props: IProps){
    super(props);

    this.state = {
      password: ""
    };
  }

  handleSubmit = (event : any) => {
    event.preventDefault();
    this.props.createWallet(this.state.password);
    return false;
  }

  handleChange = (event : any) => {
    const newPassword = ReactDOM.findDOMNode<HTMLInputElement>(this.refs.passwordNode).value;
    this.setState({
      password: newPassword,
    });
  }

  render() {
    return(
      <div className={css.createWalletContainer}>
        <h2>Create a Wallet</h2>
        <form onSubmit={this.handleSubmit}>
          <label htmlFor='nameInput'>Password: </label>
          <input
            autoFocus
            id='passwordInput'
            onChange={this.handleChange}
            ref="passwordNode"
            required
            type="text"
            value={this.state.password}
          />
          <button type='submit'>Submit</button>
        </form>
      </div>
    );
  }

}

export default connect(mapStateToProps, mapDispatchToProps)(CreateWalletContainer);