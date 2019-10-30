import { Member } from "@daostack/client";
import * as React from "react";
import * as Autosuggest from "react-autosuggest";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { IProfilesState, IProfileState } from "reducers/profilesReducer";
import { first } from "rxjs/operators";
import { getArc } from "arc";
import AccountImage from "components/Account/AccountImage";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";

import * as css from "./UserSearchField.scss";

interface IExternalProps {
  daoAvatarAddress: string;
  name?: string;
  onBlur?: (touched: boolean) => any;
  onChange?: (newValue: string) => any;
}

interface IStateProps {
  profiles: IProfilesState;
}

type IProps = IExternalProps & IStateProps & ISubscriptionProps<Member[]>;

const mapStateToProps = (state: IRootState, _ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ..._ownProps,
    profiles: state.profiles,
  };
};

interface IState {
  suggestions: IProfileState[];
  value: string;
}

class UserSearchField extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.state = {
      suggestions: [],
      value: "",
    };
  }

  public handleBlur = (_event: any): void => {
    this.props.onBlur(true);
  }

  public handleChange = (event: any, { newValue }: { newValue: string }) => {
    this.setState({
      value: newValue,
    });
    this.props.onChange(newValue);
  }

  public async getSuggestions(value: string): Promise<IProfileState[]> {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;
    const suggestedProfiles = [] as IProfileState[];

    if (inputLength === 0) {
      return [];
    }

    await Promise.all(this.props.data.map(async (member: Member) => {
      const memberState = await member.state().pipe(first()).toPromise();
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
      suggestions: await this.getSuggestions(value),
    });
  }

  // Autosuggest will call this function every time you need to clear suggestions.
  public onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
    });
  }

  public renderSuggestion = (suggestion: IProfileState) => {
    return (
      <span>
        <span className={css.suggestionAvatar}>
          <AccountImage accountAddress={suggestion.ethereumAccountAddress} profile={suggestion} />
        </span>
        <span className={css.suggestionText}>{suggestion.name + " " + suggestion.ethereumAccountAddress}</span>
      </span>
    );
  }

  // When suggestion is clicked, Autosuggest needs to populate the input
  // based on the clicked suggestion. Teach Autosuggest how to calculate the
  // input value for every given suggestion.
  public getSuggestionValue = (suggestion: IProfileState) => suggestion.ethereumAccountAddress;

  public render(): RenderOutput {
    const { value, suggestions } = this.state;

    // Autosuggest will pass through all these props to the input.
    const inputProps = {
      "autoComplete": "nope",
      "data-test-id": "beneficiaryInput",
      "name": this.props.name,
      "onBlur": this.handleBlur,
      "onChange": this.handleChange,
      "placeholder": "name / public key",
      value,
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

const SubscribedUserSearchField = withSubscription({
  wrappedComponent: UserSearchField,
  loadingComponent: <div className={css.loading}><Loading/></div>,
  errorComponent: (props) => <div>{ props.error.message }</div>,
  checkForUpdate: ["daoAvatarAddress"],

  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    return arc.dao(props.daoAvatarAddress).members();
  },
});

export default connect(mapStateToProps)(SubscribedUserSearchField);
