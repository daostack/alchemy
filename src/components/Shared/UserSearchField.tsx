import { DAO, Member } from '@daostack/client'
import * as React from "react";
import * as Autosuggest from "react-autosuggest";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { IProfilesState, IProfileState } from "reducers/profilesReducer";
import { first } from 'rxjs/operators';

import { arc } from "arc";
import AccountImage from "components/Account/AccountImage"
import Subscribe, { IObservableState } from "components/Shared/Subscribe"

import * as css from "./UserSearchField.scss";

interface IUserSearchInternalProps {
  members: Member[];
  name?: string;
  onBlur?: (touched: boolean) => any,
  onChange?: (newValue: string) => any,
  profiles: IProfilesState;
}

interface IUserSearchInternalState {
  suggestions: IProfileState[];
  value: string;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    profiles: state.profiles
  }
}

class UserSearchField extends React.Component<IUserSearchInternalProps, IUserSearchInternalState> {

  constructor(props: IUserSearchInternalProps) {
    super(props);

    this.state = {
      suggestions: [],
      value: ''
    };
  }

  public handleBlur = (event: any) => {
    this.props.onBlur(true);
  };

  public handleChange = (event: any, { newValue }: { newValue: string }) => {
    this.setState({
      value: newValue
    });
    this.props.onChange(newValue);
  };

  public async getSuggestions(value: string): Promise<IProfileState[]> {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;
    const suggestedProfiles = [] as IProfileState[];

    if (inputLength === 0) {
      return [];
    }

    await Promise.all(this.props.members.map(async (member: Member) => {
      const memberState = await member.state.pipe(first()).toPromise();
      const profile = this.props.profiles[memberState.address];

      if (profile && (profile.name.includes(inputValue) || profile.ethereumAccountAddress.includes(inputValue))) {
        suggestedProfiles.push(profile);
      }
    }));
    return suggestedProfiles;
  }

  // Autosuggest will call this function every time you need to update suggestions.
  public onSuggestionsFetchRequested = async ({ value }: { value: string}) => {
    this.setState({
      suggestions: await this.getSuggestions(value)
    });
  };

  // Autosuggest will call this function every time you need to clear suggestions.
  public onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: []
    });
  };

  public renderSuggestion = (suggestion: IProfileState) => {
    return (
      <span>
        <span className={css.suggestionAvatar}>
          <AccountImage accountAddress={suggestion.ethereumAccountAddress} />
        </span>
        <span className={css.suggestionText}>{suggestion.name + " " + suggestion.ethereumAccountAddress}</span>
      </span>
    );
  };

  // When suggestion is clicked, Autosuggest needs to populate the input
  // based on the clicked suggestion. Teach Autosuggest how to calculate the
  // input value for every given suggestion.
  public getSuggestionValue = (suggestion: IProfileState) => suggestion.ethereumAccountAddress;

  public render() {
    const { value, suggestions } = this.state;

    // Autosuggest will pass through all these props to the input.
    const inputProps = {
      "autoComplete": "nope",
      "data-test-id": "beneficiaryInput",
      "name": this.props.name,
      "onBlur": this.handleBlur,
      "onChange": this.handleChange,
      "placeholder": "name / public key",
      value
    };

    return (
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={this.getSuggestionValue}
        renderSuggestion={this.renderSuggestion}
        inputProps={inputProps}
        theme={css}
      />
    );
  }
}

const ConnectedUserSearchField = connect(mapStateToProps)(UserSearchField);

interface IUserSearchProps {
  daoAvatarAddress: string;
  name?: string;
  onBlur?: (touched: boolean) => any,
  onChange?: (newValue: string) => any
}

export default (props: IUserSearchProps) => {
  const dao = new DAO(props.daoAvatarAddress, arc)
  return <Subscribe observable={dao.members()}>{(state: IObservableState<Member[]>) => {
      if (state.isLoading) {
        return (<div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>);
      } else if (state.error) {
        return <div>{ state.error.message }</div>
      } else {
        return <ConnectedUserSearchField members={state.data} {...props} />
      }
    }
  }</Subscribe>
}
