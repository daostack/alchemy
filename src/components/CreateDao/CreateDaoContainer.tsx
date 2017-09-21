import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { connect, Dispatch } from 'react-redux';

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IDaoState, ICollaborator } from 'reducers/arcReducer';
import { IWeb3State } from 'reducers/web3Reducer'

import * as css from './CreateDao.scss';

interface IStateProps {
  web3: IWeb3State
}

const mapStateToProps = (state : IRootState, ownProps: any) => {
  return {
    web3: state.web3
  };
};

interface IDispatchProps {
  createDAO: typeof arcActions.createDAO
}

const mapDispatchToProps = {
  createDAO: arcActions.createDAO
};

type IProps = IStateProps & IDispatchProps

interface IState {
  name: string,
  tokenName: string,
  tokenSymbol: string,
  collaborators: ICollaborator[]
}

class CreateDaoContainer extends React.Component<IProps, IState> {

  constructor(props: IProps){
    super(props);

    this.state = {
      name: "",
      tokenName: "",
      tokenSymbol: "",
      collaborators: [ { address: this.props.web3.ethAccountAddress, tokens: 1000, reputation: 1000 }]
    };
  }

  handleSubmit = (event : any) => {
    event.preventDefault();
    this.props.createDAO(this.state.name, this.state.tokenName, this.state.tokenSymbol, this.state.collaborators);
    return false;
  }

  handleChange = (event : any) => {
    const newName = ReactDOM.findDOMNode<HTMLInputElement>(this.refs.nameNode).value;
    const newTokenName = ReactDOM.findDOMNode<HTMLInputElement>(this.refs.tokenNode).value;
    const newTokenSymbol = ReactDOM.findDOMNode<HTMLInputElement>(this.refs.tokenSymbolNode).value;
    this.setState({
      name: newName,
      tokenName: newTokenName,
      tokenSymbol: newTokenSymbol
    });
  }

  handleChangeCollaboratorAddress = (index : number) => (event : any) => {
    const newCollaborators = this.state.collaborators.map((collaborator, sidx) => {
      if (index !== sidx) return collaborator;
      return { ...collaborator, address: event.target.value }
    })
    this.setState({ collaborators: newCollaborators });
  }

  handleChangeCollaboratorTokens = (index : number) => (event : any) => {
    const newCollaborators = this.state.collaborators.map((collaborator, sidx) => {
      if (index !== sidx) return collaborator;
      return { ...collaborator, tokens: event.target.value }
    })
    this.setState({ collaborators: newCollaborators });
  }

  handleChangeCollaboratorReputation = (index : number) => (event : any) => {
    const newCollaborators = this.state.collaborators.map((collaborator, sidx) => {
      if (index !== sidx) return collaborator;
      return { ...collaborator, reputation: event.target.value }
    })
    this.setState({ collaborators: newCollaborators });
  }

  handleRemoveCollaborator = (index : number) => (event : any) => {
    if (this.state.collaborators.length === 1) { return }
    this.setState({ collaborators: this.state.collaborators.filter((c, sidx) => index !== sidx) })
  }

  handleAddCollaborator = (event : any) => {
    this.setState({
      collaborators: this.state.collaborators.concat([{ address: '', tokens: 1000, reputation: 1000 }]),
    })
  }

  render() {
    return(
      <div className={css.createDaoWrapper}>
        <h2>Create Your DAO</h2>
          <form onSubmit={this.handleSubmit}>
            <label htmlFor='nameInput'>Name: </label>
            <input
              autoFocus
              id='nameInput'
              onChange={this.handleChange}
              placeholder="Name your DAO"
              ref="nameNode"
              required
              type="text"
              value={this.state.name}
            />
            <br />
            <label htmlFor='tokenInput'>Token: </label>
            <input
              id='tokenInput'
              onChange={this.handleChange}
              placeholder="Choose a token name"
              ref="tokenNode"
              required
              type="text"
              value={this.state.tokenName}
            />
            <br />
            <label htmlFor='tokenSymbolInput'>Token Symbol: </label>
            <input
              id='tokenSymbolInput'
              maxLength={3}
              onChange={this.handleChange}
              placeholder="Choose a three character token symbol"
              ref="tokenSymbolNode"
              required
              type="text"
              value={this.state.tokenSymbol}
            />
            <br />
            {this.renderCollaborators()}
            <button type='submit'>Submit</button>
          </form>
      </div>
    );
  }

  renderCollaborators() {
    const collaboratorRows = this.state.collaborators.map((collaborator : ICollaborator, index : number) => {
      return (
        <div key={`collaborator_${index}_row_`}>
          <label htmlFor={`collaborator_${index}_address_input`}>Member Address: </label>
          <input
            id={`collaborator_${index}_address_input`}
            maxLength={42}
            minLength={42}
            onChange={this.handleChangeCollaboratorAddress(index)}
            placeholder="0x0000000000000000000000000000000000000000"
            ref={`collaborator_${index}_address_input`}
            size={46}
            type='string'
            value={collaborator.address} />
          <label htmlFor={`collaborator_${index}_tokens_input`}>Num Tokens: </label>
          <input
            id={`collaborator_${index}_tokens_input`}
            onChange={this.handleChangeCollaboratorTokens(index)}
            ref={`collaborator_${index}_tokens_input`}
            placeholder='assign initial tokens'
            size={10}
            type='string'
            value={collaborator.tokens} />
          <label htmlFor={`collaborator_${index}_reputation_input`}>Reputation: </label>
          <input
            id={`collaborator_${index}_reputation_input`}
            onChange={this.handleChangeCollaboratorReputation(index)}
            placeholder="assign initial reputation"
            ref={`collaborator_${index}_reputation_input`}
            size={10}
            type='string'
            value={collaborator.reputation} />
          {index > 0 ? <button type='button' tabIndex={-1} onClick={this.handleRemoveCollaborator(index)}>X</button> : ""}
        </div>
      );
    });

    return (
      <div className={css.collaborators}>
        <h3>DAO Members</h3>
        {collaboratorRows}
        <br />
        <button type='button' onClick={this.handleAddCollaborator}>Add Collaborator</button>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateDaoContainer);