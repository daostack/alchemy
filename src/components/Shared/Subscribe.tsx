import * as React from "react";
import { combineLatest, Observable, Subscription } from "rxjs";

interface IProps {
  observable: Observable<any>;
  children: any;
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

  public state: IObservableState<object> = {
    isLoading: true,
    data: null,
    error: null,
    complete: null,
  };

  public id: string;
  constructor(props: IProps) {
    super(props);
    this.id =  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    this.observable = this.props.observable;
  }
  public setupSubscription() {
    this.subscription = this.observable.subscribe(
      (next: object) => {
        this.setState({
          data: next,
          isLoading: false,
          fetchMore: this.fetchMore.bind(this)
      });
      },
      (error: Error) => {
        this.setState({
          isLoading: false,
          error });
        },
      () => { this.setState({complete: true}); }
    );
  }

  public teardownSubscription() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public componentWillMount() {
    this.setupSubscription();
  }

  public componentWillUnmount() {
    this.teardownSubscription();
  }

  public render() {
    const { children } = this.props;

    if (typeof children === "function") {
      return children(this.state);
    }
    throw Error(`Children of <Subscribe> must be a function`);
  }

  public fetchMore(options: {
    observable: any // the observable that will return the data
    combine: any // a function that combines the previousState with the results of the observable to return a new state
  }) {
    // add more results to the query
    if (!options.combine) {
      options.combine = (oldState: any, newData: any) => {
        return oldState.concat(newData);
      };
    }
    this.observable = combineLatest(this.observable, options.observable, options.combine);
    this.setupSubscription();

  }
}
