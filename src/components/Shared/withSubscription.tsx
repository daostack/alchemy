import * as React from "react";
import { combineLatest, Observable, Subscription } from "rxjs";
import { Subtract } from "utility-types";

export interface IObservableState<ObservableType> {
  isLoading: boolean;
  data: ObservableType;
  error: Error;
  complete: boolean;
}

export interface ISubscriptionProps<ObservableType> {
  data: ObservableType;
  error: Error;
  fetchMore: () => void;
  isLoading: boolean;
}

interface withSubscriptionOptions<Props extends ISubscriptionProps<ObservableType>, ObservableType extends Object> {
  wrappedComponent: React.ComponentType<Props>,
  checkForUpdate: (keyof Props)[] | ((oldProps: Subtract<Props, ISubscriptionProps<ObservableType>>, newProps: Subtract<Props, ISubscriptionProps<ObservableType>>) => boolean),
  createObservable: (props: Subtract<Props, ISubscriptionProps<ObservableType>>) => Observable<ObservableType>,
  getFetchMoreObservable?: (props: Subtract<Props, ISubscriptionProps<ObservableType>>, currentData: ObservableType) => Observable<ObservableType>,
  fetchMoreCombine?: (oldState: ObservableType, newData: any) => ObservableType
}

 /**
   * Higher Order Component that subscribes to the observables required by the wrappedComponent and passes along the data observed as it comes in
   * @param {React.ComponentType} wrappedComponent : The component to render with the subscribed data
   * @param {string[] | ((oldProps, newProps) => boolean)} checkForUpdate :
   *         Either an array of props to check for changes or a function that accepts the props and returns whether to update the subscription or not
   * @param {(props) => Observable} createObservable : A function that given the props returns the observable to subscribe to
   * @param {(props, currentData) => Observable} getFetchMoreObservable? : A function to call when the component wants to fetch more which should return the updated observable
   * @param {(oldState, newData) => combinedData} fetchMoreCombine? : A function that combines old data and new data when fetchMore is called
   */
const withSubscription = <Props extends ISubscriptionProps<ObservableType>, ObservableType extends Object>(options: withSubscriptionOptions<Props, ObservableType>) => {

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

    public setupSubscription(observable?: Observable<any>) {
      if (this.subscription) {
        this.subscription.unsubscribe();
      }
      const { createObservable, wrappedComponent } = options;
      console.log(getDisplayName(wrappedComponent), "setting up sub", this.props);
      this.observable = observable || createObservable(this.props);
      console.log("got oserv =", this.observable);
      this.subscription = this.observable.subscribe(
        (next: ObservableType) => {
          console.log(getDisplayName(wrappedComponent), "Got data", next);
          this.setState({
            data: next,
            isLoading: false,
          });
        },
        (error: Error) => {
          console.log(getDisplayName(wrappedComponent), "error", error);
          this.setState({
            isLoading: false,
            error });
        },
        () => { console.log(getDisplayName(wrappedComponent), "complete"); this.setState({complete: true}); }
      );
    }

    public teardownSubscription() {
      if (this.subscription) {
        this.subscription.unsubscribe();
      }
    }

    public componentDidMount() {
      console.log(getDisplayName(options.wrappedComponent), "component did mount")
      this.setupSubscription();
    }

    public componentDidUpdate(prevProps: InputProps) {
      const { wrappedComponent, checkForUpdate } = options;
      console.log(getDisplayName(wrappedComponent), "did updatexx?", checkForUpdate);
      let shouldUpdate = false;
      console.log(checkForUpdate, typeof(checkForUpdate));
      if (typeof(checkForUpdate) === "function") {
        shouldUpdate = checkForUpdate(prevProps, this.props);
      } else {
        checkForUpdate.forEach((prop: keyof InputProps) => {
          if (prevProps[prop] !== this.props[prop]) {
            shouldUpdate = true;
          }
        });
      }
      if (shouldUpdate) {
        console.log(getDisplayName(wrappedComponent), "yes did updateyy");
        this.setupSubscription();
      }
    }

    public componentWillUnmount() {
      this.teardownSubscription();
    }

    public render() {
      return <options.wrappedComponent
               data={this.state.data}
               isLoading={this.state.isLoading}
               error={this.state.error}
               fetchMore={this.fetchMore}
               {...this.props as Props} />;
    }

    public fetchMore(): void {
      // Do nothing if the wrapped component didn't tell us how to fetch more
      if (!options.getFetchMoreObservable) {
        return;
      }

      const newObservable = options.getFetchMoreObservable(this.props, this.state.data);
      const combineFunction = options.fetchMoreCombine || this._fetchMoreCombine;
      const observable = combineLatest(this.observable, newObservable, combineFunction);
      this.setupSubscription(observable);
    }

     // a function that combines the previousState with the results of the new observable from fetchMore
    private _fetchMoreCombine(oldState: ObservableType, newData: any): ObservableType {
      return (oldState as any).concat(newData);
    }
  };
}

function getDisplayName(wrappedComponent: any): string {
  return wrappedComponent.displayName || wrappedComponent.name || 'Component';
}

export default withSubscription;