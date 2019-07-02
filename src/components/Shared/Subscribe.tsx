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
          fetchMore: (observable: any) => this.fetchMore({observable})
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
    // fetchMoreFunction: () => any
    // updateQuery: (prevData: any, newData: any) => any
    observable: any
  }) {
    // add more results to the query
    const combine = (x1: any, x2: any) => {
      return x1.concat(x2);
    };
    this.observable = combineLatest(this.observable, options.observable, combine);
    this.setupSubscription();

  }
}
