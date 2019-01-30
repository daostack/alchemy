import * as React from "react";
import * as Autosuggest from "react-autosuggest";
import { connect } from "react-redux";

import { IRootState } from "reducers";
import { IProfileState, IProfilesState } from "reducers/profilesReducer";

import Subscribe, { IObservableState } from "components/Shared/Subscribe"
import { arc } from "arc";
import { DAO, IDAOState, Member, IMemberState, IProposalState, ProposalOutcome, ProposalStage } from '@daostack/client'

import * as css from "./UserSearchField.scss";

interface IUserSearchProps {
  members: Member[];
  profiles: IProfilesState;
}

interface IUserSearchState {
  suggestions: IProfileState[];
  value: string;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    profiles: state.profiles
  }
}

class UserSearchField extends React.Component<IUserSearchProps, IUserSearchState> {

  constructor(props: IUserSearchProps) {
    super(props);

    // Autosuggest is a controlled component.
    // This means that you need to provide an input value
    // and an onChange handler that updates this value (see below).
    // Suggestions also need to be provided to the Autosuggest,
    // and they are initially empty because the Autosuggest is closed.
    this.state = {
      suggestions: [],
      value: ''
    };
  }

  onChange = (event: any, { newValue } : { newValue: string }) => {
    this.setState({
      value: newValue
    });
  };

  getSuggestions = (value: string) => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;
    const suggestedProfiles = [] as IProfileState[];

    if (inputLength === 0) return [];

    this.props.members.forEach(async (member: Member) => {
      console.log(1);
      const memberState = await member.state.toPromise();
      console.log(2);
      const profile = this.props.profiles[memberState.address];
      console.log("member", member, memberState, profile)

      if (profile.name.includes(inputValue)) {
        suggestedProfiles.push(profile);
      }
    });
    console.log("members = ", this.props.members, ". ", suggestedProfiles);
    return suggestedProfiles;
  };

  // Autosuggest will call this function every time you need to update suggestions.
  // You already implemented this logic above, so just use it.
  onSuggestionsFetchRequested = ({ value } : { value: string}) => {
    this.setState({
      suggestions: this.getSuggestions(value)
    });
  };

  // Autosuggest will call this function every time you need to clear suggestions.
  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: []
    });
  };

  renderSuggestion = (suggestion: IProfileState) => {
    return suggestion.name + " " + suggestion.ethereumAccountAddress;
  };

  // When suggestion is clicked, Autosuggest needs to populate the input
  // based on the clicked suggestion. Teach Autosuggest how to calculate the
  // input value for every given suggestion.
  getSuggestionValue = (suggestion : IProfileState) => suggestion.ethereumAccountAddress;

  render() {
    const { value, suggestions } = this.state;

    // Autosuggest will pass through all these props to the input.
    const inputProps = {
      placeholder: "Select a beneficiary from this DAO's members or use any ETH address",
      value,
      onChange: this.onChange
    };

    // Finally, render it!
    return (
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={this.getSuggestionValue}
        renderSuggestion={this.renderSuggestion}
        inputProps={inputProps}
      />
    );
  }
}

const ConnectedUserSearchField = connect(mapStateToProps)(UserSearchField);

export default (props: { daoAvatarAddress: string }) => {
  const dao = new DAO(props.daoAvatarAddress, arc)
  return <Subscribe observable={dao.members()}>{(state: IObservableState<Member[]>) => {
      if (state.isLoading) {
        return (<div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>);
      } else if (state.error) {
        return <div>{ state.error.message }</div>
      } else {
        return <ConnectedUserSearchField members={state.data} />
      }
    }
  }</Subscribe>
}

