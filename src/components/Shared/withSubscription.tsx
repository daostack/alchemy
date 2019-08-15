import * as React from "react";
import { Observable, Subscription } from "rxjs";
import { Subtract } from "utility-types";

export interface IObservableState<ObservableType> {
  isLoading: boolean;
  data: ObservableType;
  error: Error;
  complete: boolean;
}

export interface ISubscriptionProps<ObservableType> {
  isLoading: boolean;
  data: ObservableType;
  error: Error;
}

 /**
   * Higher Order Component that subscribes to the observables required by the WrappedComponent and passes along the data observed as it comes in
   * @param {React.ComponentType}: The component to render with the subscribed data
   * @param {string[] | ((oldProps, newProps) => boolean)} checkForUpdate :
   *         Either an array of props to check for changes or a function that accepts the props and returns whether to update the subscription or not
   * @param {(props) => Observable} createObservable : A function that given the props returns the observable to subscribe to
   */
const withSubscription = <Props extends ISubscriptionProps<ObservableType>, ObservableType extends Object>(
  WrappedComponent: React.ComponentType<Props>,
  checkForUpdate: (keyof Props)[] | ((oldProps: Subtract<Props, ISubscriptionProps<ObservableType>>, newProps: Subtract<Props, ISubscriptionProps<ObservableType>>) => boolean),
  createObservable: (props: Subtract<Props, ISubscriptionProps<ObservableType>>) => Observable<ObservableType>
 ) => {

  // The props that can get passed into the wrapped component, removing the ISubscriptionProps since those get passed down by WithSubscription
  type InputProps = Subtract<Props, ISubscriptionProps<ObservableType>>;

  return class WithSubscriptionComponent extends React.Component<InputProps, IObservableState<ObservableType>> {
    public subscription: Subscription;
    public observable: Observable<ObservableType>;

    constructor(props: Props) {
      super(props);

      this.fetchMore = this.fetchMore.bind(this);

      this.state = {
        isLoading: true,
        data: null,
        error: null,
        complete: null,
      };
    }

    public setupSubscription() {
      if (this.subscription) {
        this.subscription.unsubscribe();
      }
      console.log(getDisplayName(WrappedComponent), "setting up sub", this._getQueryData());
      this.observable = createObservable(this._getQueryData());
      console.log("got oserv =", this.observable);
      this.subscription = this.observable.subscribe(
        (next: ObservableType) => {
          console.log(getDisplayName(WrappedComponent), "Got data", next);
          this.setState({
            data: next,
            isLoading: false,
          });
        },
        (error: Error) => {
          console.log(getDisplayName(WrappedComponent), "error", error);
          this.setState({
            isLoading: false,
            error });
        },
        () => { console.log(getDisplayName(WrappedComponent), "complete"); this.setState({complete: true}); }
      );
    }

    public teardownSubscription() {
      if (this.subscription) {
        this.subscription.unsubscribe();
      }
    }

    public componentDidMount() {
      console.log(getDisplayName(WrappedComponent), "component did mount")
      this.setupSubscription();
    }

    public componentDidUpdate(prevProps: InputProps) {
      console.log(getDisplayName(WrappedComponent), "did updatexx?", checkForUpdate);
      let shouldUpdate = false;

      if (typeof(checkForUpdate) == "function") {
        shouldUpdate = checkForUpdate(prevProps, this.props);
      } else {
        checkForUpdate.forEach((prop: keyof InputProps) => {
          if (prevProps[prop] !== this.props[prop]) {
            shouldUpdate = true;
          }
        });
      }
      if (shouldUpdate) {
        console.log(getDisplayName(WrappedComponent), "yes did updateyy");
        this.setupSubscription();
      }
    }

    public componentWillUnmount() {
      this.teardownSubscription();
    }

    public render() {
      return <WrappedComponent
               data={this.state.data}
               isLoading={this.state.isLoading}
               error={this.state.error}
               fetchMore={this.fetchMore}
               {...this.props as Props} />;
    }

    public fetchMore(options: {
      observable: any; // the observable that will return the data
      combine: any; // a function that combines the previousState with the results of the observable to return a new state
    }) {
      // add more results to the query
      if (!options.combine) {
        options.combine = (oldState: any, newData: any) => {
          return oldState.concat(newData);
        };
      }
      // const observable = combineLatest(this.observable, options.observable, options.combine);
      this.setupSubscription();
    }

    private _getQueryData(): Props {
      return (checkForUpdate as (keyof InputProps)[]).reduce((accum: {[key: string]: any}, prop) => { accum[prop as string] = (this.props as Props)[prop]; return accum }, {}) as Props;
    }
  };
}

function getDisplayName(WrappedComponent: any): string {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

export default withSubscription;