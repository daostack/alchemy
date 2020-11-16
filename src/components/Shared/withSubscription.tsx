import * as React from "react";
import { combineLatest, Observable, Subscription } from "rxjs";
import { Subtract } from "utility-types";
import { GRAPH_POLL_INTERVAL } from "../../settings";

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

/**
 * Parameters for `withSubscription`
 */
interface IWithSubscriptionOptions<Props extends ISubscriptionProps<ObservableType>, ObservableType extends Record<string, any>> {
  /**
   * Specifies when to recreate the subscription. Either an array of prop names or a function that returns boolean.
   */
  checkForUpdate: (keyof Props)[] | ((oldProps: OnlyWrappedComponentProps<Props>, newProps: OnlyWrappedComponentProps<Props>) => boolean);
  /**
   * A function that given the props returns the observable to which we will subscribe.
   */
  createObservable: (props: OnlyWrappedComponentProps<Props>) => Promise<Observable<ObservableType>> | Observable<ObservableType>;
  /**
   * Optional commonet to display when there is an error fetching the data.
   */
  errorComponent?: React.ReactElement<any> | React.ComponentType<{error: Error}>;
  /**
   * Optional function used by `fetchMore` to combine old data and new data.
   */
  fetchMoreCombine?: (oldState: ObservableType, newData: any) => ObservableType;
  /**
   *  Optional function used by `fetchMore`. Should return an updated observable.
   */
  getFetchMoreObservable?: (props: OnlyWrappedComponentProps<Props>, currentData: ObservableType) => Observable<any>;
  /**
   * Optional component to display while waiting for the first bit of data to arrive
   */
  loadingComponent?: React.ReactElement<any> | React.ComponentType<Props>;
  /**
   * Optional as a hacky way to determine if when paging there is more data to load.
   */
  pageSize?: number;
  /**
   * The component to render with the subscribed data.
   */
  wrappedComponent: React.ComponentType<Props>;
}

/**
 * Higher Order Component that subscribes to the observables
 * required by the wrappedComponent and passes along the data observed as it comes in.
 * @oarams options See `IWithSubscriptionOptions`
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

    public async setupSubscription(observable?: Observable<any>, currentAttempt = 0) {

      this.teardownSubscription();

      const { createObservable, wrappedComponent } = options;

      try {
        this.observable = observable || await createObservable(this.props);
      } catch (ex) {
        // this will go to the error page
        this.setState(() => { throw ex; });
      }

      this.subscription = this.observable.subscribe(
        (next: ObservableType) => {
          currentAttempt = 0; // reset on success
          this.setState({
            data: next,
            isLoading: false,
          });
        },
        (error: Error) => {
          /**
           * The below condition is a workaround to avoid crashing Alchemy when a GraphQL error or a Network error occurs.
           * This is due to the way Apollo Client works when such an error occurs - it fails and terminates the observable including the polling.
           */
          if ((error.message.includes("GraphQL") || error.message.includes("Network")) && currentAttempt < 10) {
            currentAttempt ++;
            this.subscription.unsubscribe();
            setTimeout(this.setupSubscription.bind(this, observable, currentAttempt), GRAPH_POLL_INTERVAL);
          } else {
            // eslint-disable-next-line no-console
            console.error(getDisplayName(wrappedComponent), "Error in subscription", error);
            // this will go to the error page
            this.setState(() => { throw error; });
          }
        },
        () => { this.setState({
          complete: true,
          isLoading: false,
        }); }
      );
    }

    public teardownSubscription() {
      if (this.subscription) {
        this.subscription.unsubscribe();
      }
    }

    public async componentDidMount() {
      await this.setupSubscription();
    }

    public async componentDidUpdate(prevProps: InputProps) {
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
        await this.setupSubscription();
      }
    }

    public componentWillUnmount() {
      this.teardownSubscription();
    }


    public render(): RenderOutput {
      if (!this.state.complete && this.state.isLoading && typeof options.loadingComponent !== "undefined") {

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
