import * as React from "react";
import { combineLatest, Observable, Subscription } from "rxjs";
import { Subtract } from "utility-types";

function getDisplayName(wrappedComponent: any): string {
  return wrappedComponent.displayName || wrappedComponent.name || "Component";
}

export interface IObservableState<ObservableType> {
  complete: boolean;
  data: ObservableType;
  error: Error;
  hasMoreToLoad: boolean;
  isLoading: boolean;
}

export interface ISubscriptionProps<ObservableType> {
  data: ObservableType;
  error: Error;
  fetchMore: () => void;
  hasMoreToLoad: boolean;
  isLoading: boolean;
}

// For the props that can get passed into the wrapped component, removing the ISubscriptionProps since those get passed down by WithSubscription
type OnlyWrappedComponentProps<T extends ISubscriptionProps<any>> = Subtract<T, ISubscriptionProps<any>>;

interface IWithSubscriptionOptions<Props extends ISubscriptionProps<ObservableType>, ObservableType extends Record<string, any>> {
  checkForUpdate: (keyof Props)[] | ((oldProps: OnlyWrappedComponentProps<Props>, newProps: OnlyWrappedComponentProps<Props>) => boolean);
  createObservable: (props: OnlyWrappedComponentProps<Props>) => Observable<ObservableType>;
  errorComponent?: React.ReactElement<any> | React.ComponentType<{error: Error}>;
  fetchMoreCombine?: (oldState: ObservableType, newData: any) => ObservableType;
  getFetchMoreObservable?: (props: OnlyWrappedComponentProps<Props>, currentData: ObservableType) => Observable<any>;
  loadingComponent?: React.ReactElement<any> | React.ComponentType<Props>;
  pageSize?: number;
  wrappedComponent: React.ComponentType<Props>;
}

/**
   * Higher Order Component that subscribes to the observables required by the wrappedComponent and passes along the data observed as it comes in
   * @param {React.ComponentType} wrappedComponent : The component to render with the subscribed data
   * @param {string[] | ((oldProps, newProps) => boolean)} checkForUpdate :
   *         Either an array of props to check for changes or a function that accepts the props and returns whether to update the subscription or not
   * @param {(props) => Observable} createObservable : A function that given the props returns the observable to subscribe to
   * @param {(props, currentData) => Observable} getFetchMoreObservable? : A function to call when the component wants to fetch more which should return the updated observable
   * @param {(oldState, newData) => combinedData} fetchMoreCombine? : A function that combines old data and new data when fetchMore is called
   * @param {number} pageSize? : Used for hacky way to determine if when paging there is more to load
   */
const withSubscription = <Props extends ISubscriptionProps<ObservableType>, ObservableType extends Record<string, any>>(options: IWithSubscriptionOptions<Props, ObservableType>) => {

  // The props that can get passed into the wrapped component, removing the ISubscriptionProps since those get passed down by WithSubscription
  type InputProps = OnlyWrappedComponentProps<Props>;

  return class WithSubscriptionComponent extends React.Component<InputProps, IObservableState<ObservableType>> {
    public subscription: Subscription;
    public observable: Observable<ObservableType>;

    constructor(props: Props) {
      super(props);

      this.fetchMore = this.fetchMore.bind(this);
      this._fetchMoreCombine = this._fetchMoreCombine.bind(this);

      this.state = {
        complete: null,
        data: null,
        error: null,
        hasMoreToLoad: options.pageSize !== null,
        isLoading: true,
      };
    }

    public setupSubscription(observable?: Observable<any>) {
      if (this.subscription) {
        this.subscription.unsubscribe();
      }
      const { createObservable, wrappedComponent } = options;

      this.observable = observable || createObservable(this.props);

      this.subscription = this.observable.subscribe(
        (next: ObservableType) => {
          this.setState({
            data: next,
            isLoading: false,
          });
        },
        (error: Error) => {
          console.error(getDisplayName(wrappedComponent), "Error in subscription", error);

          this.setState({
            isLoading: false,
            error,
          });
        },
        () => { this.setState({complete: true}); }
      );
    }

    public teardownSubscription() {
      if (this.subscription) {
        this.subscription.unsubscribe();
      }
    }

    public componentDidMount() {
      this.setupSubscription();
    }

    public componentDidUpdate(prevProps: InputProps) {
      const { checkForUpdate } = options;

      let shouldUpdate = false;

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
        this.setupSubscription();
      }
    }

    public componentWillUnmount() {
      this.teardownSubscription();
    }

    public render() {
      if (this.state.isLoading && typeof options.loadingComponent !== "undefined") {
        if (typeof options.loadingComponent === "function") {
          return <options.loadingComponent {...this.props as Props} />;
        }
        return options.loadingComponent;
      }

      if (this.state.error && typeof options.errorComponent !== "undefined") {
        if (typeof options.errorComponent === "function") {
          return <options.errorComponent error={this.state.error} />;
        }
        return options.errorComponent;
      }

      return <options.wrappedComponent
        data={this.state.data}
        isLoading={this.state.isLoading}
        error={this.state.error}
        fetchMore={this.fetchMore}
        hasMoreToLoad={this.state.hasMoreToLoad}
        {...this.props as Props} />;
    }

    public fetchMore(): void {
      // Do nothing if the wrapped component didn't tell us how to fetch more
      if (!options.getFetchMoreObservable) {
        return;
      }

      const newObservable = options.getFetchMoreObservable(this.props, this.state.data);
      const observable = combineLatest(this.observable, newObservable, this._fetchMoreCombine);
      this.setupSubscription(observable);
    }

    // Combine the previousState with the results of the new observable from fetchMore
    private _fetchMoreCombine(oldState: ObservableType, newData: any): ObservableType {
      // Kind of hacky way of figuring out if there is more data to load
      if (newData.length < options.pageSize) {
        this.setState({ hasMoreToLoad: false });
      }

      if (options.fetchMoreCombine) {
        return options.fetchMoreCombine(oldState, newData);
      }

      // Default way of combining
      return (oldState as any).concat(newData);
    }
  };
};

export default withSubscription;
