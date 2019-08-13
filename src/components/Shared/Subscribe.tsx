import * as React from "react";
import { combineLatest, Observable, Subscription } from "rxjs";

interface IProps {
  observable: Observable<any>;
  children: any;
  name?: string;
}


export interface IObservableState<IData> {
  isLoading: boolean;
  data: IData;
  error: Error;
  complete: boolean;
  fetchMore?: (observable: any) => void;
}

export default class Subscribe extends React.Component<IProps, IObservableState<object>> {
  public subscription: Subscription;
  public observable: Observable<any>;

  constructor(props: IProps) {
    super(props);

    this.state = {
      isLoading: true,
      data: null,
      error: null,
      complete: null,
    };
  }

  public setupSubscription(observable: Observable<any>) {
    this.observable = observable;
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    console.log(this.props.name, "setting up sub", observable);
    this.subscription = observable.subscribe(
      (next: object) => {
        console.log(this.props.name, "Got data", next);
        this.setState({
          data: next,
          isLoading: false,
          fetchMore: this.fetchMore.bind(this),
        });
      },
      (error: Error) => {
        console.log(this.props.name, "error", error);
        this.setState({
          isLoading: false,
          error });
      },
      () => { console.log(this.props.name, "complete"); this.setState({complete: true}); }
    );
  }

  public teardownSubscription() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public componentDidMount() {
    this.setupSubscription(this.props.observable);
  }

  public componentDidUpdate(prevProps: IProps) {
    console.log("did update?");
    if (this.props.observable !== prevProps.observable) {
      console.log("yes did update");
      this.setupSubscription(this.props.observable);
    }
  }

  public componentWillUnmount() {
    this.teardownSubscription();
  }

  public render() {
    const { children } = this.props;
    if (typeof children === "function") {
      return children(this.state);
    }
    throw Error("Children of <Subscribe> must be a function");
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
    const observable = combineLatest(this.observable, options.observable, options.combine);
    this.setupSubscription(observable);
  }
}
