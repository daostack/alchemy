import * as React from "react";
import * as ReactDOM from "react-dom";
import { connect, Dispatch } from "react-redux";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { newAccount, IAccountState, IDaoState } from "reducers/arcReducer";
import { IWeb3State } from "reducers/web3Reducer";

import * as css from "./CreateDao.scss";
import { Link } from "react-router-dom";

interface IStateProps {
  web3: IWeb3State;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    web3: state.web3,
  };
};

interface IDispatchProps {
  createDAO: typeof arcActions.createDAO;
}

const mapDispatchToProps = {
  createDAO: arcActions.createDAO,
};

type IProps = IStateProps & IDispatchProps;

interface IState {
  buttonEnabled: boolean;
  name: string;
  tokenName: string;
  tokenSymbol: string;
  members: IAccountState[];
}

class CreateDaoContainer extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      buttonEnabled: true,
      name: "",
      tokenName: "",
      tokenSymbol: "",
      members: [ newAccount(null, this.props.web3.ethAccountAddress, 1000, 1000) ],
    };
  }

  public handleSubmit = (event: any) => {
    event.preventDefault();
    this.setState({ buttonEnabled: false });
    this.props.createDAO(this.state.name, this.state.tokenName, this.state.tokenSymbol, this.state.members);
    return false;
  }

  public handleChange = (event: any) => {
    const newName = (ReactDOM.findDOMNode(this.refs.nameNode) as HTMLInputElement).value;
    const newTokenName = (ReactDOM.findDOMNode(this.refs.tokenNode) as HTMLInputElement).value;
    const newTokenSymbol = (ReactDOM.findDOMNode(this.refs.tokenSymbolNode)as HTMLInputElement).value;
    this.setState({
      name: newName,
      tokenName: newTokenName,
      tokenSymbol: newTokenSymbol.toUpperCase(),
    });
  }

  public handleChangeMemberAddress = (index: number) => (event: any) => {
    const newMembers = this.state.members.map((member, sidx) => {
      if (index !== sidx) { return member; }
      return { ...member, address: event.target.value };
    });
    this.setState({ members: newMembers });
  }

  public handleChangeMemberTokens = (index: number) => (event: any) => {
    const newMembers = this.state.members.map((member, sidx) => {
      if (index !== sidx) { return member; }
      return { ...member, tokens: Number(event.target.value) };
    });
    this.setState({ members: newMembers });
  }

  public handleChangeMemberReputation = (index: number) => (event: any) => {
    const newMembers = this.state.members.map((member, sidx) => {
      if (index !== sidx) { return member; }
      return { ...member, reputation: Number(event.target.value) };
    });
    this.setState({ members: newMembers });
  }

  public handleRemoveMember = (index: number) => (event: any) => {
    if (this.state.members.length === 1) { return; }
    this.setState({ members: this.state.members.filter((c, sidx) => index !== sidx) });
  }

  public handleAddMember = (event: any) => {
    this.setState({
      members: this.state.members.concat([newAccount(null, "", 1000, 1000)]),
    });
  }

  public render() {
    return(
      <div className={css.createDaoWrapper}>
        <h2>
          <img className={css.editIcon} src="/assets/images/Icon/Edit.svg"/>
          <span>Create DAO</span>
          <Link to='/'>
            <button className={css.exitProposalCreation}>
              <img src="/assets/images/Icon/Close.svg"/>
            </button>
          </Link>
        </h2>
        <div className={css.inner}>
          <form onSubmit={this.handleSubmit}>
            <label htmlFor="nameInput">Name </label>
            <input
              autoFocus
              id="nameInput"
              onChange={this.handleChange}
              placeholder="Name your DAO"
              ref="nameNode"
              required
              type="text"
              value={this.state.name}
            />
            <div className={css.clearfix + " " + css.tokenDetails}>
              <div className={css.column}>
                <label htmlFor="tokenInput">Token name </label>
                <input
                  id="tokenInput"
                  onChange={this.handleChange}
                  placeholder="Choose a token name"
                  ref="tokenNode"
                  required
                  type="text"
                  value={this.state.tokenName}
                />
              </div>
              <div className={css.column}>
                <label htmlFor="tokenSymbolInput">Token symbol </label>
                <input
                  id="tokenSymbolInput"
                  maxLength={3}
                  onChange={this.handleChange}
                  placeholder="3 character symbol"
                  ref="tokenSymbolNode"
                  required
                  type="text"
                  value={this.state.tokenSymbol}
                />
              </div>
            </div>
            {this.renderMembers()}
            <button type="submit" className={css.submitDao} disabled={!this.state.buttonEnabled}>Create DAO</button>
          </form>
        </div>
      </div>
    );
  }

  public renderMembers() {
    const memberRows = this.state.members.map((member: IAccountState, index: number) => {
      return (
        <div key={`member_${index}_row_`}>
          <label htmlFor={`member_${index}_address_input`}>Member Address </label>
          <input
            id={`member_${index}_address_input`}
            maxLength={42}
            minLength={42}
            onChange={this.handleChangeMemberAddress(index)}
            placeholder="0x0000000000000000000000000000000000000000"
            ref={`member_${index}_address_input`}
            size={46}
            type="string"
            value={member.address} />
          <div className={css.clearfix}>
            <div className={css.column + " " + css.columnOne}>
              <label htmlFor={`member_${index}_tokens_input`}>Tokens </label>
              <input
                id={`member_${index}_tokens_input`}
                onChange={this.handleChangeMemberTokens(index)}
                ref={`member_${index}_tokens_input`}
                placeholder="assign initial tokens"
                size={10}
                type="string"
                value={member.tokens} />
            </div>
            <div className={css.column + " " + css.columnTwo}>
              <label htmlFor={`member_${index}_reputation_input`}>Reputation </label>
              <input
                id={`member_${index}_reputation_input`}
                onChange={this.handleChangeMemberReputation(index)}
                placeholder="assign initial reputation"
                ref={`member_${index}_reputation_input`}
                size={10}
                type="string"
                value={member.reputation} />
            </div>
            <div className={css.column + " " + css.columnThree}>
              {index > 0 ? <button className={css.cancelAdd} type="button" tabIndex={-1} onClick={this.handleRemoveMember(index)}>X</button> : ""}
            </div>
          </div>
        </div>
      );
    });

    if (memberRows.length) {
      return (
          <div className={css.addMember}>
            <div className={css.membersList}>
              <h3>DAO Members</h3>
              {memberRows}
              <button className={css.addMemberButton} type="button" onClick={this.handleAddMember}>Add Member</button>
            </div>
          </div>
      );
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateDaoContainer);
