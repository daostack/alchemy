import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { connect, Dispatch } from 'react-redux';

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IDaoState, IMemberState } from 'reducers/arcReducer';
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
  members: IMemberState[]
}

class CreateDaoContainer extends React.Component<IProps, IState> {

  constructor(props: IProps){
    super(props);

    this.state = {
      name: "",
      tokenName: "",
      tokenSymbol: "",
      members: [ { address: this.props.web3.ethAccountAddress, tokens: 1000, reputation: 1000 }]
    };
  }

  handleSubmit = (event : any) => {
    event.preventDefault();
    this.props.createDAO(this.state.name, this.state.tokenName, this.state.tokenSymbol, this.state.members);
    return false;
  }

  handleChange = (event : any) => {
    const newName = (ReactDOM.findDOMNode(this.refs.nameNode) as HTMLInputElement).value;
    const newTokenName = (ReactDOM.findDOMNode(this.refs.tokenNode) as HTMLInputElement).value;
    const newTokenSymbol = (ReactDOM.findDOMNode(this.refs.tokenSymbolNode)as HTMLInputElement).value;
    this.setState({
      name: newName,
      tokenName: newTokenName,
      tokenSymbol: newTokenSymbol
    });
  }

  handleChangeMemberAddress = (index : number) => (event : any) => {
    const newMembers = this.state.members.map((member, sidx) => {
      if (index !== sidx) return member;
      return { ...member, address: event.target.value }
    })
    this.setState({ members: newMembers });
  }

  handleChangeMemberTokens = (index : number) => (event : any) => {
    const newMembers = this.state.members.map((member, sidx) => {
      if (index !== sidx) return member;
      return { ...member, tokens: event.target.value }
    })
    this.setState({ members: newMembers });
  }

  handleChangeMemberReputation = (index : number) => (event : any) => {
    const newMembers = this.state.members.map((member, sidx) => {
      if (index !== sidx) return member;
      return { ...member, reputation: event.target.value }
    })
    this.setState({ members: newMembers });
  }

  handleRemoveMember = (index : number) => (event : any) => {
    if (this.state.members.length === 1) { return }
    this.setState({ members: this.state.members.filter((c, sidx) => index !== sidx) })
  }

  handleAddMember = (event : any) => {
    this.setState({
      members: this.state.members.concat([{ address: '', tokens: 1000, reputation: 1000 }]),
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
            {this.renderMembers()}
            <button type='submit'>Submit</button>
          </form>
      </div>
    );
  }

  renderMembers() {
    const memberRows = this.state.members.map((member : IMemberState, index : number) => {
      return (
        <div key={`member_${index}_row_`}>
          <label htmlFor={`member_${index}_address_input`}>Member Address: </label>
          <input
            id={`member_${index}_address_input`}
            maxLength={42}
            minLength={42}
            onChange={this.handleChangeMemberAddress(index)}
            placeholder="0x0000000000000000000000000000000000000000"
            ref={`member_${index}_address_input`}
            size={46}
            type='string'
            value={member.address} />
          <label htmlFor={`member_${index}_tokens_input`}>Num Tokens: </label>
          <input
            id={`member_${index}_tokens_input`}
            onChange={this.handleChangeMemberTokens(index)}
            ref={`member_${index}_tokens_input`}
            placeholder='assign initial tokens'
            size={10}
            type='string'
            value={member.tokens} />
          <label htmlFor={`member_${index}_reputation_input`}>Reputation: </label>
          <input
            id={`member_${index}_reputation_input`}
            onChange={this.handleChangeMemberReputation(index)}
            placeholder="assign initial reputation"
            ref={`member_${index}_reputation_input`}
            size={10}
            type='string'
            value={member.reputation} />
          {index > 0 ? <button type='button' tabIndex={-1} onClick={this.handleRemoveMember(index)}>X</button> : ""}
        </div>
      );
    });

    return (
      <div className={css.members}>
        <h3>DAO Members</h3>
        {memberRows}
        <br />
        <button type='button' onClick={this.handleAddMember}>Add Member</button>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateDaoContainer);